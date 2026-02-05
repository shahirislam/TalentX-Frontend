import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isFirebaseEnabled, getFirebaseAuth, getGoogleProvider } from '../lib/firebase.js';
import { apiOnboard } from '../api/talentxApi.js';
import { isRealApi } from '../api/client.js';

const AUTH_STORAGE_KEY = 'talentx_auth';
const SIGNUP_ROLE_KEY = 'talentx_signup_role';

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

/** Load any stored profile (for optimistic init before Firebase restores session). */
function loadStoredProfileAny() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.uid && (data.role === 'employer' || data.role === 'talent')) {
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
  const [state, setState] = useState(() => {
    if (!isFirebaseEnabled()) return loadMockAuth();
    const stored = loadStoredProfileAny();
    if (stored) {
      return { user: stored, isAuthenticated: true, needsOnboarding: false };
    }
    return { user: null, isAuthenticated: false, needsOnboarding: false };
  });

  // Firebase auth state – follow backend flow: call onboard once with name, email, role
  useEffect(() => {
    if (!isFirebaseEnabled()) return;
    const auth = getFirebaseAuth();
    if (!auth) return;
    const unsub = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setState({ user: null, isAuthenticated: false, needsOnboarding: false });
        // Do not clear stored profile here: Firebase can fire null briefly before
        // restoring the session on reload; we only clear profile on explicit logout.
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
        return;
      }
      const email = firebaseUser.email || '';
      const name = firebaseUser.displayName || email;
      let signupRole = null;
      try {
        const r = sessionStorage.getItem(SIGNUP_ROLE_KEY);
        if (r === 'employer' || r === 'talent') signupRole = r;
      } catch (_) {}
      if (signupRole && email) {
        try {
          const token = await firebaseUser.getIdToken(true);
          if (isRealApi()) {
            const backendRole = signupRole === 'employer' ? 'EMPLOYER' : 'TALENT';
            const user = await apiOnboard({ name, email, role: backendRole }, () => Promise.resolve(token));
            const savedProfile = {
              uid: user.uid,
              id: user.uid,
              name: user.name,
              email: user.email,
              role: (user.role || backendRole).toLowerCase() === 'employer' ? 'employer' : 'talent',
            };
            saveStoredProfile(savedProfile);
            try {
              sessionStorage.removeItem(SIGNUP_ROLE_KEY);
            } catch (_) {}
            setState({ user: savedProfile, isAuthenticated: true, needsOnboarding: false });
            return;
          }
          const savedProfile = { uid, id: uid, name, email, role: signupRole };
          saveStoredProfile(savedProfile);
          try {
            sessionStorage.removeItem(SIGNUP_ROLE_KEY);
          } catch (_) {}
          setState({ user: savedProfile, isAuthenticated: true, needsOnboarding: false });
          return;
        } catch (_) {}
      }
      setState({
        user: null,
        isAuthenticated: false,
        needsOnboarding: true,
        firebaseUser: { uid, email, displayName: firebaseUser.displayName || '' },
      });
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

  const login = useCallback(async (roleOrEmail, nameOrPassword) => {
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
    if (roleOrEmail !== 'employer' && roleOrEmail !== 'talent') return;
    const id = roleOrEmail === 'employer' ? 'emp-1' : 'talent-1';
    setState({
      user: { id, name: nameOrPassword || (roleOrEmail === 'employer' ? 'Employer' : 'Talent'), role: roleOrEmail },
      isAuthenticated: true,
      needsOnboarding: false,
    });
  }, []);

  const loginWithEmailPassword = useCallback(async (email, password) => {
    if (!isFirebaseEnabled()) return;
    const auth = getFirebaseAuth();
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const registerWithEmailPassword = useCallback(async (email, password, displayName = '') => {
    if (!isFirebaseEnabled()) return;
    const auth = getFirebaseAuth();
    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
    const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (displayName && userCred.user) {
      await updateProfile(userCred.user, { displayName: displayName.trim() });
    }
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
    loginWithEmailPassword,
    registerWithEmailPassword,
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
