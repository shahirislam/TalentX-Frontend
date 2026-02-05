import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { isFirebaseEnabled } from '../lib/firebase.js';
import { ApiError } from '../api/index.js';

export default function Login() {
  const [role, setRole] = useState('talent');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, completeOnboard, needsOnboarding, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || (role === 'employer' ? '/employer' : '/talent');
  const isOnboarding = location.state?.onboarding || needsOnboarding;
  const firebaseMode = isFirebaseEnabled();

  const isRegisterMode = new URLSearchParams(location.search).get('mode') === 'register';
  const [activeTab, setActiveTab] = useState(isRegisterMode ? 'register' : 'login');
  useEffect(() => {
    setActiveTab(isRegisterMode ? 'register' : 'login');
  }, [isRegisterMode]);

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
      await login();
      // Auth state will update; if needsOnboarding, form will show below
    } catch (err) {
      setError(err?.message || 'Sign in failed');
    } finally {
      setLoading(false);
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
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err?.message || 'Onboarding failed'));
    } finally {
      setLoading(false);
    }
  };

  if (isOnboarding && firebaseUser && firebaseMode) {
    return (
      <div className="mx-auto max-w-md">
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-xl font-semibold text-gray-900">Complete your profile</h1>
          <p className="mb-6 text-sm text-gray-500">Set your role to continue.</p>
          <form onSubmit={handleOnboardSubmit} className="space-y-5">
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
              onClick={() => setActiveTab('login')}
              className={`flex-1 rounded-md py-2 text-sm font-medium ${activeTab === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Sign in
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
            {activeTab === 'register' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mb-6 text-sm text-gray-500">
            {activeTab === 'register' ? 'Sign up with Google to get started.' : 'Sign in to continue.'}
          </p>
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'Please wait...' : activeTab === 'register' ? 'Sign up with Google' : 'Sign in with Google'}
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
