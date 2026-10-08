import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  getFirebaseConfigStatus,
  loginWithFirebase,
  registerWithFirebase,
  sendFirebasePasswordReset,
} from '../services/firebase';
import {
  Sprout,
  Lock,
  Mail,
  User,
  Building,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Cpu,
  Flame,
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { setUser, setFarmConfig, setEvents } = useFarm();
  const fbStatus = getFirebaseConfigStatus();

  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'reset'>('signin');

  // Sign In Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form
  const [regFullName, setRegFullName] = useState('');
  const [regFarmName, setRegFarmName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Reset Password Form
  const [resetEmail, setResetEmail] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // State messages
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const registerSubmittingRef = React.useRef(false);

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Sign In Handler (Uses Firebase Authentication + Private Firestore document users/{uid})
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!loginEmail || !loginPassword) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);

    if (fbStatus.isConfigured) {
      try {
        const { user, savedConfig, savedEvents } = await loginWithFirebase(loginEmail, loginPassword);
        setUser(user);
        setFarmConfig(savedConfig);
        setEvents(savedEvents || []);
      } catch (err: any) {
        let msg = err.message || 'Firebase authentication failed.';
        if (
          err.code === 'auth/user-not-found' ||
          err.code === 'auth/wrong-password' ||
          err.code === 'auth/invalid-credential'
        ) {
          msg = 'Invalid email or password.';
        } else if (err.code === 'auth/invalid-email') {
          msg = 'Please enter a valid email address.';
        } else if (err.code === 'auth/user-disabled') {
          msg = 'This user account has been disabled.';
        } else if (err.code === 'auth/too-many-requests') {
          msg = 'Too many failed login attempts. Please wait a moment before trying again.';
        } else if (err.code === 'auth/network-request-failed') {
          msg = 'Network connection failed. Please check your internet connection.';
        } else if (
          err.code === 'auth/api-key-not-valid' ||
          (err.message && (err.message.includes('API key') || err.message.includes('api-key')))
        ) {
          msg = 'Firebase API key error. Please check your Google Cloud Console API key settings (Identity Toolkit API must be enabled).';
        }
        setErrorMsg(msg);
      } finally {
        setLoading(false);
      }
    } else {
      // Local Fallback Mode: Allows full use without requiring private Firebase keys or exposing secrets
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'Invalid email or password.');
          setLoading(false);
          return;
        }

        // Retrieve local farm state if exists
        let savedConfig = null;
        let savedEvents = [];
        try {
          const stateRes = await fetch(`/api/farm-twin/state/${data.user.id}`);
          if (stateRes.ok) {
            const stateData = await stateRes.json();
            if (stateData.state?.farmConfig) savedConfig = stateData.state.farmConfig;
            if (Array.isArray(stateData.state?.events)) savedEvents = stateData.state.events;
          }
        } catch {}

        const profile = {
          id: data.user.id,
          fullName: data.user.fullName,
          farmName: data.user.farmName,
          email: data.user.email,
          emailVerified: true,
        };

        setUser(profile);
        setFarmConfig(savedConfig || {
          farmName: profile.farmName,
          ownerName: profile.fullName,
          acres: 120,
          zones: [],
          theme: 'dark',
          farmLogo: 'sprout',
        });
        setEvents(savedEvents);
      } catch (err) {
        setErrorMsg('Network error connecting to local server.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Register Handler (Uses Firebase Auth + Creates Private Firestore users/{uid})
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerSubmittingRef.current || loading) return;
    registerSubmittingRef.current = true;
    clearMessages();

    if (!regFullName || !regFarmName || !regEmail || !regPassword || !regConfirmPassword) {
      setErrorMsg('All registration fields are required.');
      registerSubmittingRef.current = false;
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your password.');
      registerSubmittingRef.current = false;
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password should be at least 6 characters.');
      registerSubmittingRef.current = false;
      return;
    }

    setLoading(true);

    if (fbStatus.isConfigured) {
      try {
        const { user, farmConfig: freshConfig, events: freshEvents } = await registerWithFirebase(
          regFullName,
          regFarmName,
          regEmail,
          regPassword
        );
        setSuccessMsg(
          'Registration successful! Entering your AI FarmTwin dashboard...'
        );
        // Log the user in directly without any email verification step
        setUser(user);
        setFarmConfig(freshConfig);
        setEvents(freshEvents);
      } catch (err: any) {
        let msg = err.message || 'Firebase registration failed.';
        if (err.code === 'auth/email-already-in-use') {
          msg = 'An account with this email address already exists in Firebase.';
        } else if (err.code === 'auth/invalid-email') {
          msg = 'The email address format is invalid.';
        } else if (err.code === 'auth/weak-password') {
          msg = 'Password is too weak. Please use at least 6 characters.';
        } else if (err.code === 'auth/too-many-requests') {
          msg = 'Too many requests. Please wait a moment before trying again.';
        } else if (err.code === 'auth/network-request-failed') {
          msg = 'Network connection failed. Please check your internet connection.';
        } else if (
          err.code === 'auth/api-key-not-valid' ||
          (err.message && (err.message.includes('API key') || err.message.includes('api-key')))
        ) {
          msg = 'Firebase API key error. Please check your Google Cloud Console API key settings (Identity Toolkit API must be enabled).';
        }
        setErrorMsg(msg);
      } finally {
        setLoading(false);
        registerSubmittingRef.current = false;
      }
    } else {
      // Local Fallback Mode: Seamless registration without needing private keys
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: regFullName,
            farmName: regFarmName,
            email: regEmail,
            password: regPassword,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'Registration failed.');
          setLoading(false);
          registerSubmittingRef.current = false;
          return;
        }

        const profile = {
          id: data.user.id,
          fullName: data.user.fullName,
          farmName: data.user.farmName,
          email: data.user.email,
          emailVerified: true,
        };

        setSuccessMsg('Registration successful! Entering your AI FarmTwin dashboard...');
        setUser(profile);
      } catch (err) {
        setErrorMsg('Network error connecting to local server.');
      } finally {
        setLoading(false);
        registerSubmittingRef.current = false;
      }
    }
  };

  // Request Reset Handler (Uses Firebase sendPasswordResetEmail)
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!resetEmail) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setLoading(true);

    if (fbStatus.isConfigured) {
      try {
        await sendFirebasePasswordReset(resetEmail);
        setSuccessMsg(
          `Firebase password reset email dispatched to ${resetEmail}. Check your inbox to choose a new password.`
        );
      } catch (err: any) {
        let msg = err.message || 'Unable to send password reset email via Firebase.';
        if (err.code === 'auth/user-not-found') {
          msg = 'No user account found with this email in Firebase.';
        }
        setErrorMsg(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Fallback to local endpoint
    try {
      const res = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Unable to initiate password reset for this email.');
        setLoading(false);
        return;
      }

      setResetStep(2);
      if (data.resetCode) {
        setResetCode(data.resetCode);
      }
      setSuccessMsg(`Verification code issued for ${resetEmail}. Enter code and choose a new password.`);
    } catch (err) {
      setErrorMsg('Network error while requesting password reset.');
    } finally {
      setLoading(false);
    }
  };

  // Submit New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!resetCode || !newPassword || !confirmNewPassword) {
      setErrorMsg('Verification code and new password are required.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          resetCode,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Password reset failed.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Password successfully reset! You can now sign in with your new password.');
      setLoginEmail(resetEmail);
      setLoginPassword('');
      setActiveTab('signin');
      setResetStep(1);
    } catch (err) {
      setErrorMsg('Network error completing password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-radial from-stone-800 to-stone-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Farm Twin Emblem */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/50 mb-4">
          <Sprout className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-white">
          AI FARM TWIN
        </h1>
        <p className="mt-1 text-sm text-emerald-400 font-semibold tracking-wide">
          &ldquo;Predict. Simulate. Protect.&rdquo;
        </p>
        <p className="mt-2 text-xs text-stone-400 max-w-sm mx-auto">
          Software Digital Twin Platform for Agronomic Modeling, Manual Telemetry Evaluation & Perimeter Threat Detection.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-stone-900/90 backdrop-blur-md py-8 px-6 sm:px-10 rounded-2xl border border-stone-800 shadow-2xl space-y-6">
          {/* Firebase Authentication Status Banner */}
          {fbStatus.isConfigured ? (
            <div className="p-2.5 bg-emerald-950/50 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold">
                <Flame className="w-4 h-4 text-amber-500" />
                Firebase Auth &amp; Firestore Connected
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Cloud Synced</span>
            </div>
          ) : (
            <div className="p-2.5 bg-amber-950/40 border border-amber-800/80 rounded-xl text-amber-300 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-200">
                <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Firebase Authentication Ready</span>
              </div>
              <p className="text-[10px] text-amber-400/90 leading-tight">
                To connect live Firebase, add <code className="font-mono bg-black/40 px-1 py-0.5 rounded">VITE_FIREBASE_API_KEY</code> and project variables in <code className="font-mono bg-black/40 px-1 py-0.5 rounded">.env</code>. (Operating securely on local store until configured).
              </p>
            </div>
          )}

          {/* Tab Selector */}
          <div className="flex rounded-xl bg-stone-800/80 p-1 border border-stone-700/60 text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTab('signin');
                clearMessages();
              }}
              className={`flex-1 py-2 rounded-lg transition cursor-pointer ${
                activeTab === 'signin'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                clearMessages();
              }}
              className={`flex-1 py-2 rounded-lg transition cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => {
                setActiveTab('reset');
                clearMessages();
              }}
              className={`flex-1 py-2 rounded-lg transition cursor-pointer ${
                activeTab === 'reset'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Reset Password
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SECTION A: SIGN IN */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="manager@farmtwin.ag"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-stone-300 font-semibold">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('reset');
                      clearMessages();
                    }}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* SECTION B: REGISTER */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Alex Mercer"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  Farm Name
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Verdant Horizon Smart Farm"
                    value={regFarmName}
                    onChange={(e) => setRegFarmName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="manager@farmtwin.ag"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="Re-enter password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                <span>{loading ? 'Creating Account...' : 'Register'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* SECTION C: RESET PASSWORD */}
          {activeTab === 'reset' && (
            <div className="space-y-4 text-xs">
              {resetStep === 1 ? (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <p className="text-stone-400 text-xs">
                    Enter the email registered with your Farm Twin. A real backend cryptographic reset token will be issued.
                  </p>

                  <div>
                    <label className="block text-stone-300 font-semibold mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        placeholder="manager@farmtwin.ag"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Verifying...' : 'Request Password Reset'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3.5">
                  <div className="p-3 bg-stone-800 rounded-xl border border-stone-700 text-center">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">
                      Secure Verification Code
                    </span>
                    <span className="text-lg font-mono font-extrabold text-emerald-400">
                      {resetCode || '123456'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-stone-300 font-semibold mb-1">
                      Enter Verification Code
                    </label>
                    <input
                      type="text"
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-white focus:outline-hidden text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-300 font-semibold mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-white focus:outline-hidden text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-300 font-semibold mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Re-enter new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-white focus:outline-hidden text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Updating Password...' : 'Save New Password & Sign In'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="w-full py-1.5 text-stone-400 hover:text-white text-xs underline text-center block"
                  >
                    Back to email entry
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Security & Prototype Assurance Footer */}
          <div className="pt-4 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              PBKDF2/Scrypt Hashed Auth
            </span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-stone-400" />
              AI Studio Fullstack
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
