import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  reload,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import { FarmConfig, FarmEvent, UserProfile } from '../types/farm';
import { createFreshUserFarmConfig } from '../utils/initialData';
import firebaseConfig from '../../firebase-applet-config.json';

// Dynamic Firebase configuration using Vite environment variables (VITE_FIREBASE_*)
// Real credentials are kept in .env.local (git-ignored) and never committed to GitHub.
const resolvedFirebaseConfig = {
  apiKey:
    (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) ||
    firebaseConfig.apiKey ||
    '',
  authDomain:
    (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) ||
    firebaseConfig.authDomain ||
    '',
  projectId:
    (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) ||
    firebaseConfig.projectId ||
    '',
  storageBucket:
    (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined) ||
    firebaseConfig.storageBucket ||
    '',
  messagingSenderId:
    (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined) ||
    firebaseConfig.messagingSenderId ||
    '',
  appId:
    (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined) ||
    firebaseConfig.appId ||
    '',
};

const resolvedDatabaseId =
  (import.meta.env.VITE_FIREBASE_DATABASE_ID as string | undefined) ||
  firebaseConfig.firestoreDatabaseId ||
  '(default)';

// Error Handler definitions conforming to Firebase integration guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const rawMsg = error instanceof Error ? error.message : String(error);
  // Redact any Google API keys, authorization tokens, or sensitive credentials
  const sanitizedMsg = rawMsg
    .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_KEY]')
    .replace(/(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi, '$1[REDACTED_TOKEN]');

  const errInfo: FirestoreErrorInfo = {
    error: sanitizedMsg,
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', sanitizedMsg);
  throw new Error(JSON.stringify(errInfo));
}

// Initialize Firebase App
let app: FirebaseApp;
if (getApps().length > 0) {
  app = getApp();
} else {
  // If API key is not yet set in .env.local, use placeholder to prevent startup crash
  const configToInit = {
    ...resolvedFirebaseConfig,
    apiKey: resolvedFirebaseConfig.apiKey || 'DUMMY_KEY_CONFIGURE_IN_ENV_LOCAL',
  };
  app = initializeApp(configToInit);
}

// CRITICAL: Connect to the specific firestoreDatabaseId provisioned
export const db: Firestore = getFirestore(app, resolvedDatabaseId);
export const auth: Auth = getAuth(app);

export interface FirebaseConfigStatus {
  isConfigured: boolean;
  missingVariables: string[];
}

export function getFirebaseConfigStatus(): FirebaseConfigStatus {
  const missingVariables: string[] = [];
  const key = resolvedFirebaseConfig.apiKey;
  if (
    !key ||
    key.trim() === '' ||
    key.includes('your_') ||
    key.includes('DUMMY') ||
    key.includes('placeholder') ||
    key.includes('YOUR_')
  ) {
    missingVariables.push('VITE_FIREBASE_API_KEY');
  }
  if (!resolvedFirebaseConfig.projectId) {
    missingVariables.push('VITE_FIREBASE_PROJECT_ID');
  }
  return {
    isConfigured: missingVariables.length === 0,
    missingVariables,
  };
}

// Test connection on boot per Firebase guidelines
async function testConnection() {
  const status = getFirebaseConfigStatus();
  if (!status.isConfigured) {
    console.info('[Firebase] Waiting for valid VITE_FIREBASE_API_KEY in .env.local to establish cloud connection.');
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection check: Client currently offline.');
    }
  }
}
testConnection();

// Guard flags to prevent concurrent verification email triggers
let isRegistrationInProgress = false;
let isResendInProgress = false;

/**
 * Register a new user in Firebase Auth, send a real Firebase verification email,
 * and initialize a completely fresh, isolated private farm document.
 * Path: users/{uid}
 */
export async function registerWithFirebase(
  fullName: string,
  farmName: string,
  email: string,
  password: string
): Promise<{ user: UserProfile; farmConfig: FarmConfig; events: FarmEvent[] }> {
  if (isRegistrationInProgress) {
    throw new Error('Registration is already processing. Please wait.');
  }
  isRegistrationInProgress = true;

  try {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const uid = credential.user.uid;

    // Create a completely clean, fresh FarmTwin state for the new user
    const freshFarmConfig = createFreshUserFarmConfig(farmName.trim(), fullName.trim());
    const freshEvents: FarmEvent[] = [];

    const userProfile: UserProfile = {
      id: uid,
      fullName: fullName.trim(),
      farmName: farmName.trim(),
      email: email.trim().toLowerCase(),
      emailVerified: true,
    };

    // Store isolated private user record in Firestore: users/{uid}
    const userDocPath = `users/${uid}`;
    try {
      await setDoc(doc(db, 'users', uid), {
        id: uid,
        name: fullName.trim(),
        farmName: farmName.trim(),
        email: email.trim().toLowerCase(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        farmConfig: freshFarmConfig,
        events: freshEvents,
      });
    } catch (writeErr) {
      handleFirestoreError(writeErr, OperationType.WRITE, userDocPath);
    }

    return {
      user: userProfile,
      farmConfig: freshFarmConfig,
      events: freshEvents,
    };
  } finally {
    isRegistrationInProgress = false;
  }
}

/**
 * Sign in existing user via Firebase Authentication and retrieve ONLY that user's private farm dataset
 * Path: users/{uid}
 */
export async function loginWithFirebase(
  email: string,
  password: string
): Promise<{ user: UserProfile; savedConfig: FarmConfig; savedEvents: FarmEvent[] }> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const uid = credential.user.uid;

  const userDocPath = `users/${uid}`;
  let userDocSnap;
  try {
    userDocSnap = await getDoc(doc(db, 'users', uid));
  } catch (readErr) {
    handleFirestoreError(readErr, OperationType.GET, userDocPath);
  }

  let fullName = credential.user.displayName || 'Farm Manager';
  let farmName = 'My Private Farm';
  let savedConfig: FarmConfig;
  let savedEvents: FarmEvent[] = [];

  if (userDocSnap.exists()) {
    const data = userDocSnap.data();
    fullName = data.name || fullName;
    farmName = data.farmName || farmName;
    savedEvents = Array.isArray(data.events) ? data.events : [];

    if (data.farmConfig && typeof data.farmConfig === 'object') {
      savedConfig = data.farmConfig as FarmConfig;
    } else {
      // First time initialization if document had no farmConfig
      savedConfig = createFreshUserFarmConfig(farmName, fullName);
      try {
        await setDoc(
          doc(db, 'users', uid),
          { farmConfig: savedConfig, events: savedEvents, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, userDocPath);
      }
    }
  } else {
    // Completely fresh user record in case document wasn't generated at registration
    savedConfig = createFreshUserFarmConfig(farmName, fullName);
    try {
      await setDoc(doc(db, 'users', uid), {
        id: uid,
        name: fullName,
        farmName,
        email: credential.user.email || email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        farmConfig: savedConfig,
        events: savedEvents,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, userDocPath);
    }
  }

  const profile: UserProfile = {
    id: uid,
    fullName,
    farmName,
    email: credential.user.email || email,
    emailVerified: true,
  };

  return { user: profile, savedConfig, savedEvents };
}

/**
 * (Email verification deprecated/removed per user request)
 * Keeps no-op stubs so any legacy references do not break.
 */
export async function resendFirebaseVerificationEmail(): Promise<void> {
  // Email verification is completely removed
  return Promise.resolve();
}

export async function reloadAndCheckEmailVerified(): Promise<{
  isVerified: boolean;
  currentUser: FirebaseUser | null;
  userProfile?: UserProfile;
  farmConfig?: FarmConfig | null;
  events?: FarmEvent[];
}> {
  const currentUser = auth.currentUser;
  return {
    isVerified: true,
    currentUser,
  };
}

/**
 * Trigger Firebase Authentication Password Reset Email
 */
export async function sendFirebasePasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Sign out user from Firebase Authentication
 */
export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}

/**
 * Synchronize user's private farm configuration and events to Firestore: users/{uid}
 * Strictly verifies that the authenticated user matches the target UID
 */
export async function syncUserFarmToFirestore(
  uid: string,
  farmConfig: FarmConfig,
  events: FarmEvent[]
): Promise<void> {
  if (!uid || auth.currentUser?.uid !== uid) {
    console.warn('Sync aborted: User UID mismatch or not authenticated.');
    return;
  }

  const docPath = `users/${uid}`;
  try {
    await setDoc(
      doc(db, 'users', uid),
      {
        farmConfig,
        events,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, docPath);
  }
}

/**
 * Load user's private farm configuration directly from Firestore: users/{uid}
 */
export async function loadUserFarmFromFirestore(
  uid: string
): Promise<{ farmConfig: FarmConfig | null; events: FarmEvent[] }> {
  if (!uid || auth.currentUser?.uid !== uid) {
    return { farmConfig: null, events: [] };
  }

  const docPath = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const data = snap.data();
      return {
        farmConfig: (data.farmConfig as FarmConfig) || null,
        events: Array.isArray(data.events) ? (data.events as FarmEvent[]) : [],
      };
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, docPath);
  }

  return { farmConfig: null, events: [] };
}

/**
 * Subscribe to Firebase Auth state changes for seamless session restoration across page reloads
 */
export function onFirebaseAuthStateChange(
  callback: (
    authData: {
      user: UserProfile;
      savedConfig: FarmConfig | null;
      savedEvents: FarmEvent[];
    } | null
  ) => void
): () => void {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }

    const uid = firebaseUser.uid;
    const profile: UserProfile = {
      id: uid,
      fullName: firebaseUser.displayName || 'Farm Manager',
      farmName: 'My Private Farm',
      email: firebaseUser.email || '',
      emailVerified: true,
    };
    const docPath = `users/${uid}`;
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const data = snap.data();
        profile.fullName = data.name || profile.fullName;
        profile.farmName = data.farmName || profile.farmName;
        const savedConfig = (data.farmConfig as FarmConfig) || null;
        const savedEvents = Array.isArray(data.events) ? (data.events as FarmEvent[]) : [];
        callback({ user: profile, savedConfig, savedEvents });
      } else {
        callback({ user: profile, savedConfig: null, savedEvents: [] });
      }
    } catch (err) {
      console.warn('Notice retrieving user document on auth state change:', err);
      callback({ user: profile, savedConfig: null, savedEvents: [] });
    }
  });
}
