'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
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
    }
  };

  const signInWithCredentials = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign-in error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Invalid email or password',
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await signOut(auth);
    } catch (error) {
      console.error('Sign-out error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error signing out',
      }));
    }
  };

  if (state.loading) {
    return (
      <Card className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </Card>
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
