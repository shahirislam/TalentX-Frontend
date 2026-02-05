import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app = null;
let auth = null;

export function isFirebaseEnabled() {
  return Boolean(config.apiKey && config.authDomain);
}

export function getFirebaseAuth() {
  if (auth) return auth;
  if (!isFirebaseEnabled()) return null;
  app = app || initializeApp(config);
  auth = getAuth(app);
  return auth;
}

export function getGoogleProvider() {
  return new GoogleAuthProvider();
}
