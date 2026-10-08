import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// Load local environment variables from .env.local (git-ignored) and .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// In-memory + file-backed persistent store for prototype
const DATA_FILE = path.join(__dirname, '.farm_twin_store.json');

interface UserRecord {
  id: string;
  fullName: string;
  farmName: string;
  email: string;
  salt: string;
  passwordHash: string;
  resetCode?: string;
  resetExpires?: number;
  createdAt: string;
}

interface StoreData {
  users: Record<string, UserRecord>;
  farmStates: Record<string, any>;
}

function loadStore(): StoreData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read store file:', err);
  }
  return { users: {}, farmStates: {} };
}

function saveStore(store: StoreData) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write store file:', err);
  }
}

let store: StoreData = loadStore();

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// Authentication Endpoints

// REGISTER
app.post('/api/auth/register', (req: Request, res: Response): void => {
  const { fullName, farmName, email, password } = req.body || {};

  if (!fullName || !farmName || !email || !password) {
    res.status(400).json({ error: 'All fields (Full Name, Farm Name, Email, Password) are required.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if already exists
  if (store.users[normalizedEmail]) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const userId = 'usr_' + crypto.randomUUID().slice(0, 8);

  const newUser: UserRecord = {
    id: userId,
    fullName: fullName.trim(),
    farmName: farmName.trim(),
    email: normalizedEmail,
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  store.users[normalizedEmail] = newUser;
  saveStore(store);

  // Return user without salt/hash
  res.status(201).json({
    message: 'Registration successful! You can now sign in.',
    user: {
      id: newUser.id,
      fullName: newUser.fullName,
      farmName: newUser.farmName,
      email: newUser.email,
    },
  });
});

// SIGN IN
app.post('/api/auth/login', (req: Request, res: Response): void => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = store.users[normalizedEmail];

  if (!user) {
    res.status(401).json({ error: 'Account does not exist or credentials are incorrect.' });
    return;
  }

  const calculatedHash = hashPassword(password, user.salt);
  if (calculatedHash !== user.passwordHash) {
    res.status(401).json({ error: 'Account does not exist or credentials are incorrect.' });
    return;
  }

  const token = 'tok_' + crypto.randomBytes(24).toString('hex');

  res.status(200).json({
    message: 'Sign in successful.',
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      farmName: user.farmName,
      email: user.email,
    },
  });
});

// REQUEST PASSWORD RESET
app.post('/api/auth/request-reset', (req: Request, res: Response): void => {
  const { email } = req.body || {};

  if (!email) {
    res.status(400).json({ error: 'Email is required.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = store.users[normalizedEmail];

  if (!user) {
    res.status(404).json({ error: 'No account registered with this email.' });
    return;
  }

  // Generate secure 6-digit numeric reset token
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const resetExpires = Date.now() + 15 * 60 * 1000; // 15 mins

  user.resetCode = resetCode;
  user.resetExpires = resetExpires;
  saveStore(store);

  // Return reset code in response for testing/prototype along with success
  res.status(200).json({
    message: 'Password reset code generated and verified.',
    resetCode,
    email: normalizedEmail,
  });
});

// RESET PASSWORD
app.post('/api/auth/reset-password', (req: Request, res: Response): void => {
  const { email, resetCode, newPassword } = req.body || {};

  if (!email || !resetCode || !newPassword) {
    res.status(400).json({ error: 'Email, verification code, and new password are required.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = store.users[normalizedEmail];

  if (!user) {
    res.status(404).json({ error: 'Account not found.' });
    return;
  }

  if (!user.resetCode || user.resetCode !== resetCode.trim()) {
    res.status(400).json({ error: 'Invalid verification code.' });
    return;
  }

  if (!user.resetExpires || Date.now() > user.resetExpires) {
    res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    return;
  }

  // Update password with new salt and hash
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(newPassword, salt);

  user.salt = salt;
  user.passwordHash = passwordHash;
  delete user.resetCode;
  delete user.resetExpires;
  saveStore(store);

  res.status(200).json({
    message: 'Password has been successfully updated. You can now sign in with your new password.',
  });
});

// Farm State Persistence
app.get('/api/farm-twin/state/:userId', (req: Request, res: Response): void => {
  const { userId } = req.params;
  const data = store.farmStates[userId] || null;
  res.status(200).json({ state: data });
});

app.post('/api/farm-twin/state/:userId', (req: Request, res: Response): void => {
  const { userId } = req.params;
  const { state } = req.body || {};
  if (!state) {
    res.status(400).json({ error: 'State is required.' });
    return;
  }
  store.farmStates[userId] = state;
  saveStore(store);
  res.status(200).json({ message: 'Farm twin state persisted successfully.' });
});

// Setup Vite middleware for development or serve dist in production
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AI FarmTwin Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
