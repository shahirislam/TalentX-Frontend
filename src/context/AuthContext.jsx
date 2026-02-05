import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isFirebaseEnabled, getFirebaseAuth, getGoogleProvider } from '../lib/firebase.js';
import { apiOnboard } from '../api/talentxApi.js';
import { isRealApi } from '../api/client.js';

const AUTH_STORAGE_KEY = 'talentx_auth';

const AuthContext = createContext(null);

function loadStoredProfile(uid) {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.uid === uid && (data.role === 'employer' || data.role === 'talent')) {
        return {
          id: data.uid,
          uid: data.uid,
          name: data.name || '',
          email: data.email || '',
          role: data.role,
        };
      }
    }
  } catch (_) {}
  return null;
}

function saveStoredProfile(profile) {
  try {
    if (profile) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        uid: profile.uid || profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
      }));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (_) {}
}

function loadMockAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && (data.role === 'employer' || data.role === 'talent')) {
        return {
          user: {
            id: data.id || (data.role === 'employer' ? 'emp-1' : 'talent-1'),
            name: data.name || (data.role === 'employer' ? 'Employer' : 'Talent'),
            role: data.role,
          },
          isAuthenticated: true,
          needsOnboarding: false,
        };
      }
    }
  } catch (_) {}
  return { user: null, isAuthenticated: false, needsOnboarding: false };
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => (isFirebaseEnabled() ? { user: null, isAuthenticated: false, needsOnboarding: false } : loadMockAuth()));

  // Firebase auth state
  useEffect(() => {
    if (!isFirebaseEnabled()) return;
    const auth = getFirebaseAuth();
    if (!auth) return;
    const unsub = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setState({ user: null, isAuthenticated: false, needsOnboarding: false });
        saveStoredProfile(null);
        return;
      }
      const uid = firebaseUser.uid;
      const profile = loadStoredProfile(uid);
      if (profile) {
        setState({
          user: { id: uid, uid, name: profile.name, email: profile.email, role: profile.role },
          isAuthenticated: true,
          needsOnboarding: false,
        });
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          needsOnboarding: true,
          firebaseUser: { uid, email: firebaseUser.email || '', displayName: firebaseUser.displayName || '' },
        });
      }
    });
    return () => unsub();
  }, []);

  // Mock mode: persist to localStorage
  useEffect(() => {
    if (isFirebaseEnabled()) return;
    if (state.isAuthenticated && state.user) {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          id: state.user.id,
          name: state.user.name,
          role: state.user.role,
        })
      );
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [state.isAuthenticated, state.user]);

  const getIdToken = useCallback(async (forceRefresh = false) => {
    if (!isFirebaseEnabled()) return null;
    const auth = getFirebaseAuth();
    const user = auth?.currentUser;
    if (!user) return null;
    return user.getIdToken(forceRefresh);
  }, []);

  const login = useCallback(async (role, name) => {
    if (isFirebaseEnabled()) {
      const auth = getFirebaseAuth();
      const { signInWithPopup } = await import('firebase/auth');
      try {
        await signInWithPopup(auth, getGoogleProvider());
      } catch (err) {
        console.error('Firebase sign in failed', err);
        throw err;
      }
      return;
    }
    if (role !== 'employer' && role !== 'talent') return;
    const id = role === 'employer' ? 'emp-1' : 'talent-1';
    setState({
      user: { id, name: name || (role === 'employer' ? 'Employer' : 'Talent'), role },
      isAuthenticated: true,
      needsOnboarding: false,
    });
  }, []);

  const completeOnboard = useCallback(async (name, email, role) => {
    if (!isFirebaseEnabled() || !isRealApi()) return;
    const token = await getIdToken(true);
    if (!token) throw new Error('Not signed in');
    const backendRole = role === 'employer' ? 'EMPLOYER' : 'TALENT';
    const user = await apiOnboard({ name, email, role: backendRole }, () => Promise.resolve(token));
    const profile = {
      uid: user.uid,
      id: user.uid,
      name: user.name,
      email: user.email,
      role: (user.role || backendRole).toLowerCase() === 'employer' ? 'employer' : 'talent',
    };
    saveStoredProfile(profile);
    setState({
      user: profile,
      isAuthenticated: true,
      needsOnboarding: false,
      firebaseUser: undefined,
    });
  }, [getIdToken]);

  const logout = useCallback(async () => {
    if (isFirebaseEnabled()) {
      const auth = getFirebaseAuth();
      if (auth) {
        const { signOut } = await import('firebase/auth');
        await signOut(auth);
      }
      saveStoredProfile(null);
    }
    setState({ user: null, isAuthenticated: false, needsOnboarding: false });
  }, []);

  const value = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    needsOnboarding: state.needsOnboarding,
    firebaseUser: state.firebaseUser,
    getIdToken,
    login,
    logout,
    completeOnboard,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user, needsOnboarding } = useAuth();
  const location = useLocation();
  if (needsOnboarding) {
    return <Navigate to="/login" replace state={{ returnTo: location.pathname, onboarding: true }} />;
  }
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ returnTo: location.pathname }} />;
  }
  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }
  return children;
}
