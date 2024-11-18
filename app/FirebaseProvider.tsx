'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from './firebase/clientApp';
import { Card } from './components/ui/card';
import { Button } from './components/ui/button';
import LoadingSpinner from './components/LoadingSpinner';
import { TEST_CREDENTIALS } from './lib/constants';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';

interface FirebaseContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  signInWithTest: () => Promise<void>;
  signInWithCredentials: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  error: null,
  signInWithTest: async () => {},
  signInWithCredentials: async () => {},
  logout: async () => {},
});

export const useFirebase = () => useContext(FirebaseContext);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize test user if needed
  const initializeTestUser = async () => {
    try {
      console.log('Initializing test user...');
      // Try to sign in first to check if user exists
      try {
        await signInWithEmailAndPassword(
          auth,
          TEST_CREDENTIALS.email,
          TEST_CREDENTIALS.password
        );
        console.log('Test user exists, signing out...');
        await signOut(auth);
      } catch (err: any) {
        console.log('Sign-in attempt failed:', err.code);
        // If user doesn't exist, create it
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
          console.log('Creating test user...');
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            TEST_CREDENTIALS.email,
            TEST_CREDENTIALS.password
          );

          // Create default label if it doesn't exist
          const labelsRef = collection(db, 'labels');
          const defaultLabel = {
            name: 'Default',
            color: '#808080',
            isDefault: true,
            createdAt: new Date().toISOString()
          };
          await addDoc(labelsRef, defaultLabel);

          // Create user document in Firestore
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: TEST_CREDENTIALS.email,
            name: 'Admin',
            isAdmin: true,
            role: 'admin',
            createdAt: new Date().toISOString()
          });

          console.log('Test user created successfully');
          await signOut(auth);
        }
      }
    } catch (error) {
      console.error('Error in initializeTestUser:', error);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      if (!initialized) {
        await initializeTestUser();
        setInitialized(true);
      }
    };

    initialize();
  }, [initialized]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Check if user is admin
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data();
          setIsAdmin(userData?.isAdmin === true);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithTest = async () => {
    console.log('Attempting test sign in...');
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(
        auth,
        TEST_CREDENTIALS.email,
        TEST_CREDENTIALS.password
      );
      console.log('Test sign in successful:', result.user.email);
    } catch (err) {
      console.error('Test sign in error:', err);
      setError('Failed to login with test credentials');
      throw err;
    }
  };

  const signInWithCredentials = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid email or password');
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout');
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 max-w-md mx-auto mt-8">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </Card>
    );
  }

  return (
    <FirebaseContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        error,
        signInWithTest,
        signInWithCredentials,
        logout,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}
