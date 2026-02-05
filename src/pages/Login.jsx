import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { isFirebaseEnabled } from '../lib/firebase.js';
import { ApiError } from '../api/index.js';

const SIGNUP_ROLE_KEY = 'talentx_signup_role';

function getStoredSignupRole() {
  try {
    const r = sessionStorage.getItem(SIGNUP_ROLE_KEY);
    if (r === 'employer' || r === 'talent') return r;
  } catch (_) {}
  return 'talent';
}

export default function Login() {
  const [role, setRole] = useState('talent');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, loginWithEmailPassword, registerWithEmailPassword, completeOnboard, needsOnboarding, firebaseUser, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || (role === 'employer' ? '/employer' : '/talent');
  const isOnboarding = location.state?.onboarding || needsOnboarding;
  const firebaseMode = isFirebaseEnabled();

  // If auth was restored on reload (e.g. from localStorage), redirect back to protected page
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      const target = location.state?.returnTo || (user.role === 'employer' ? '/employer' : '/talent');
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, user?.role, navigate, location.state?.returnTo]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [registerCompleting, setRegisterCompleting] = useState(false);

  const isRegisterMode = new URLSearchParams(location.search).get('mode') === 'register';
  const [activeTab, setActiveTab] = useState(isRegisterMode ? 'register' : 'login');
  useEffect(() => {
    setActiveTab(isRegisterMode ? 'register' : 'login');
  }, [isRegisterMode]);

  useEffect(() => {
    if (isOnboarding && firebaseUser && firebaseMode) {
      setRole(getStoredSignupRole());
    }
  }, [isOnboarding, firebaseUser, firebaseMode]);

  const handleMockSubmit = (e) => {
    e.preventDefault();
    setError('');
    login(role, name.trim() || undefined);
    navigate(returnTo, { replace: true });
  };

  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (activeTab === 'register') {
        try {
          sessionStorage.setItem(SIGNUP_ROLE_KEY, role);
        } catch (_) {}
      }
      await login();
    } catch (err) {
      setError(err?.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    if (activeTab === 'register') {
      if (!displayName.trim()) {
        setError('Name is required');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }
    setLoading(true);
    try {
      if (activeTab === 'register') {
        try {
          sessionStorage.setItem(SIGNUP_ROLE_KEY, role);
        } catch (_) {}
        setRegisterCompleting(true);
        await registerWithEmailPassword(email, password, displayName);
        await completeOnboard(displayName.trim() || email, email, role);
        try {
          sessionStorage.removeItem(SIGNUP_ROLE_KEY);
        } catch (_) {}
        navigate(returnTo, { replace: true });
        return;
      } else {
        await loginWithEmailPassword(email, password);
      }
    } catch (err) {
      const msg = err?.code === 'auth/user-not-found' ? 'No account with this email.'
        : err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential' ? 'Invalid email or password.'
        : err?.code === 'auth/email-already-in-use' ? 'This email is already registered.'
        : err?.code === 'auth/weak-password' ? 'Password is too weak.'
        : err?.code === 'auth/invalid-email' ? 'Invalid email address.'
        : err?.message || 'Sign in failed';
      setError(msg);
    } finally {
      setLoading(false);
      setRegisterCompleting(false);
    }
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await completeOnboard(
        (name || firebaseUser?.displayName || '').trim(),
        (email || firebaseUser?.email || '').trim(),
        role
      );
      try {
        sessionStorage.removeItem(SIGNUP_ROLE_KEY);
      } catch (_) {}
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err?.message || 'Onboarding failed'));
    } finally {
      setLoading(false);
    }
  };

  if (isOnboarding && firebaseUser && firebaseMode) {
    if (registerCompleting) {
      return (
        <div className="mx-auto max-w-md">
          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm text-center">
            <p className="text-gray-600">Setting up your account...</p>
          </div>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-md">
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-xl font-semibold text-gray-900">Complete your profile</h1>
          <p className="mb-6 text-sm text-gray-500">Choose your role to continue (name and email from your account).</p>
          <form onSubmit={handleOnboardSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">I am a</label>
              <div className="flex gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name="onboard-role" value="employer" checked={role === 'employer'} onChange={() => setRole('employer')} className="text-indigo-600 focus:ring-indigo-500" />
                  <span>Employer</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name="onboard-role" value="talent" checked={role === 'talent'} onChange={() => setRole('talent')} className="text-indigo-600 focus:ring-indigo-500" />
                  <span>Job seeker</span>
                </label>
              </div>
            </div>
            <div>
              <label htmlFor="onboard-name" className="mb-2 block text-sm font-medium text-gray-700">Name</label>
              <input
                id="onboard-name"
                type="text"
                value={name || firebaseUser.displayName || ''}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="onboard-email" className="mb-2 block text-sm font-medium text-gray-700">Email</label>
              <input
                id="onboard-email"
                type="email"
                value={email || firebaseUser.email || ''}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (firebaseMode) {
    return (
      <div className="mx-auto max-w-md">
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setError(''); setPassword(''); setConfirmPassword(''); }}
              className={`flex-1 rounded-md py-2 text-sm font-medium ${activeTab === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setError(''); setPassword(''); setConfirmPassword(''); }}
              className={`flex-1 rounded-md py-2 text-sm font-medium ${activeTab === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Register
            </button>
          </div>
          <h1 className="mb-2 text-xl font-semibold text-gray-900">
            {activeTab === 'register' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mb-6 text-sm text-gray-500">
            {activeTab === 'register' ? 'Sign up with email and password.' : 'Sign in with your email and password.'}
          </p>
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
            {activeTab === 'register' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">I am a</label>
                <div className="flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="radio" name="signup-role" value="employer" checked={role === 'employer'} onChange={() => setRole('employer')} className="text-indigo-600 focus:ring-indigo-500" />
                    <span>Employer</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="radio" name="signup-role" value="talent" checked={role === 'talent'} onChange={() => setRole('talent')} className="text-indigo-600 focus:ring-indigo-500" />
                    <span>Job seeker</span>
                  </label>
                </div>
              </div>
            )}
            <div>
              <label htmlFor="auth-email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            {activeTab === 'register' && (
              <div>
                <label htmlFor="auth-display-name" className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                <input
                  id="auth-display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}
            <div>
              <label htmlFor="auth-password" className="mb-1 block text-sm font-medium text-gray-700">Password</label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={activeTab === 'register' ? 'At least 6 characters' : 'Your password'}
                autoComplete={activeTab === 'register' ? 'new-password' : 'current-password'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            {activeTab === 'register' && (
              <div>
                <label htmlFor="auth-confirm-password" className="mb-1 block text-sm font-medium text-gray-700">Confirm password</label>
                <input
                  id="auth-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Please wait...' : activeTab === 'register' ? 'Create account' : 'Sign in'}
            </button>
          </form>
          <div className="mt-6 flex items-center gap-3">
            <span className="flex-1 border-t border-gray-200" />
            <span className="text-xs text-gray-500">or</span>
            <span className="flex-1 border-t border-gray-200" />
          </div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="mt-4 w-full rounded-lg border border-gray-300 bg-white py-2.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {activeTab === 'register' ? 'Sign up with Google' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 rounded-md py-2 text-sm font-medium ${activeTab === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 rounded-md py-2 text-sm font-medium ${activeTab === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Register
          </button>
        </div>
        <h1 className="mb-2 text-xl font-semibold text-gray-900">
          {activeTab === 'register' ? 'Create your account' : 'Login to your account'}
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          {activeTab === 'register' ? 'Choose your role and name to get started. No real authentication (demo).' : 'Choose your role to continue. No real authentication (demo).'}
        </p>
        <form onSubmit={handleMockSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Role</label>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="radio" name="role" value="employer" checked={role === 'employer'} onChange={() => setRole('employer')} className="text-indigo-600 focus:ring-indigo-500" />
                <span>Employer</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="radio" name="role" value="talent" checked={role === 'talent'} onChange={() => setRole('talent')} className="text-indigo-600 focus:ring-indigo-500" />
                <span>Talent</span>
              </label>
            </div>
          </div>
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
              {activeTab === 'register' ? 'Name' : 'Name (optional)'}
            </label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <button type="submit" className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700">
            {activeTab === 'register' ? 'Create account' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
