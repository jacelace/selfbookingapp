'use client';

import { initializeApp, getApps, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ] as const;

  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required Firebase configuration fields: ${missingFields.join(', ')}`);
  }
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

try {
  // Validate configuration before initialization
  validateFirebaseConfig();
  
  console.log('Initializing Firebase with project:', firebaseConfig.projectId);

  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log('Firebase app initialized successfully');
  } else {
    app = getApps()[0];
    console.log('Using existing Firebase app');
  }

  // Initialize Firestore with settings
  db = getFirestore(app);
  
  // Initialize Auth
  auth = getAuth(app);
  auth.useDeviceLanguage(); // Set language to match device
  
  console.log('Firebase services initialized successfully');
} catch (error: any) {
  console.error('Firebase initialization error:', error);
  throw new Error(`Failed to initialize Firebase: ${error.message}`);
}

// Export initialized instances
export { app, db, auth };

// Export a function to check if Firebase is initialized
export const isFirebaseInitialized = () => {
  try {
    return !!app && !!db && !!auth;
  } catch {
    return false;
  }
};
