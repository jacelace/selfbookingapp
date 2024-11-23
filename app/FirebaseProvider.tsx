'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, enableIndexedDbPersistence, getFirestore } from 'firebase/firestore';
import { auth, db } from './firebase/clientApp';
import { Card } from './components/ui/card';
import LoadingSpinner from './components/LoadingSpinner';
import { TEST_CREDENTIALS } from './lib/constants';

interface FirebaseContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  signInWithTest: () => Promise<void>;
  signInWithCredentials: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const defaultContext: FirebaseContextType = {
  user: null,
  isAdmin: false,
  loading: true,
  error: null,
  signInWithTest: async () => {},
  signInWithCredentials: async () => {},
  logout: async () => {},
};

const FirebaseContext = createContext<FirebaseContextType>(defaultContext);

export const useFirebase = () => {
  return useContext(FirebaseContext);
};

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<FirebaseContextType, 'signInWithTest' | 'signInWithCredentials' | 'logout'>>({
    user: null,
    isAdmin: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    // Disable persistence by default
    const db = getFirestore();
    enableIndexedDbPersistence(db).catch((err) => {
      console.error('Error enabling persistence:', err);
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Always fetch fresh user data
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          setState({
            user,
            isAdmin: userData?.role === 'admin',
            loading: false,
            error: null,
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          setState({
            user,
            isAdmin: false,
            loading: false,
            error: 'Error fetching user data',
          });
        }
      } else {
        setState({
          user: null,
          isAdmin: false,
          loading: false,
          error: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithTest = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await signInWithEmailAndPassword(auth, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    } catch (error) {
      console.error('Test sign-in error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error signing in with test credentials',
      }));
      throw error;
    }
  };

  const signInWithCredentials = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check user's approval status
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.data();
      
      if (!userData || userData.status === 'pending' || userData.isApproved === false) {
        // Sign out if not approved
        await signOut(auth);
        throw new Error('Account pending approval');
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error signing in',
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error signing out',
      }));
      throw error;
    }
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-4">
          <LoadingSpinner />
        </Card>
      </div>
    );
  }

  return (
    <FirebaseContext.Provider
      value={{
        ...state,
        signInWithTest,
        signInWithCredentials,
        logout,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}
