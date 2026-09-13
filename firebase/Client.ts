import { getApp, getApps, initializeApp } from "firebase/app";
import { inMemoryPersistence, initializeAuth } from "firebase/auth";

// Public web config. These values ship to the browser by design; access is
// controlled by Firebase security rules, not by keeping them secret.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// getApps() was previously called without parens, so this always took the
// initializeApp branch and the getApp() reuse path was dead.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/**
 * Client auth exists only to exchange an email and password for an ID token,
 * which is then traded for the httpOnly session cookie the server trusts.
 *
 * Persistence is in-memory on purpose: nothing reads client auth state, so
 * writing it to IndexedDB only cost time on every sign-in and left a second,
 * independent source of truth that could drift out of sync with the cookie.
 */
export const auth = initializeAuth(app, {
  persistence: inMemoryPersistence,
});
