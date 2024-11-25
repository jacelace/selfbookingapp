'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase/clientApp';
import LoadingSpinner from './components/LoadingSpinner';

interface FirebaseContextType {
  user: User | null;
  isAdmin: boolean;
  isApproved: boolean;
  loading: boolean;
  error: string | null;
  signInWithCredentials: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const defaultContext: FirebaseContextType = {
  user: null,
  isAdmin: false,
  isApproved: false,
  loading: true,
  error: null,
  signInWithCredentials: async () => {},
  logout: async () => {},
};

const FirebaseContext = createContext<FirebaseContextType>(defaultContext);

export const useFirebase = () => {
  return useContext(FirebaseContext);
};

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<FirebaseContextType, 'signInWithCredentials' | 'logout'>>({
    user: null,
    isAdmin: false,
    isApproved: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? user.email : 'No user');
      
      if (user) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          console.log('User data:', userData);

          if (!userData) {
            console.log('Creating initial user data in Firestore');
            // Create initial user data if it doesn't exist
            const initialUserData = {
              email: user.email,
              name: user.email?.split('@')[0] || '',
              role: 'user',
              isAdmin: false,
              status: 'pending',
              isApproved: false,
              sessions: 0,
              remainingBookings: 0,
              totalBookings: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            try {
              await setDoc(doc(db, 'users', user.uid), initialUserData);
              console.log('Initial user data created successfully');
              
              setState({
                user,
                isAdmin: initialUserData.role === 'admin',
                isApproved: initialUserData.isApproved,
                loading: false,
                error: null,
              });
            } catch (error) {
              console.error('Error creating initial user data:', error);
              setState({
                user: null,
                isAdmin: false,
                isApproved: false,
                loading: false,
                error: 'Error creating user data',
              });
            }
            return;
          }

          // Update state with existing user data
          setState({
            user,
            isAdmin: userData.role === 'admin',
            isApproved: userData.isApproved === true,
            loading: false,
            error: null,
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          setState({
            user: null,
            isAdmin: false,
            isApproved: false,
            loading: false,
            error: 'Error fetching user data',
          });
        }
      } else {
        setState({
          user: null,
          isAdmin: false,
          isApproved: false,
          loading: false,
          error: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

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
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <FirebaseContext.Provider
      value={{
        ...state,
        signInWithCredentials,
        logout,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}
