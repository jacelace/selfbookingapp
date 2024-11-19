'use client';

import { initializeApp, getApps } from 'firebase/app';
import { Auth, getAuth, inMemoryPersistence, setPersistence } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

// Import the Firebase Auth package first to ensure proper registration
import 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function initializeFirebase() {
  if (typeof window === 'undefined') {
    return {
      app: null,
      auth: null,
      db: null,
    };
  }

  try {
    // Initialize Firebase
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

    // Initialize Auth
    const auth = getAuth(app);
    setPersistence(auth, inMemoryPersistence).catch(console.error);

    // Initialize Firestore
    const db = getFirestore(app);

    return { app, auth, db };
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return {
      app: null,
      auth: null,
      db: null,
    };
  }
}

const { app, auth, db } = initializeFirebase();

export { app, auth, db };
