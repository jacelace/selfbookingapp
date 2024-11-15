'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase/clientApp';
import { TEST_CREDENTIALS } from '../lib/constants';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithTest: () => Promise<void>;
  signInWithCredentials: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithTest = async () => {
    try {
      setError(null);
      await signInWithEmailAndPassword(
        auth,
        TEST_CREDENTIALS.email,
        TEST_CREDENTIALS.password
      );
    } catch (err) {
      console.error('Test login error:', err);
      setError('Failed to login with test credentials');
      throw err;
    }
  };

  const signInWithCredentials = async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid email or password');
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout');
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    signInWithTest,
    signInWithCredentials,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
