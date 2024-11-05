'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/clientApp';
import { Card } from './components/ui/card';
import { Button } from './components/ui/button';
import LoadingSpinner from './components/LoadingSpinner';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  loading: true,
  error: null,
});

export const useFirebase = () => useContext(FirebaseContext);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initialize = async () => {
      try {
        setError(null);
        setLoading(true);

        // Set up authentication listener
        unsubscribe = onAuthStateChanged(
          auth,
          (user) => {
            setUser(user);
            setLoading(false);
          },
          (error) => {
            console.error('Auth state change error:', error);
            setError(`Authentication error: ${error.message}`);
            setLoading(false);
          }
        );

      } catch (err: any) {
        console.error('Firebase initialization error:', err);
        setError(err.message);
        setLoading(false);

        // Retry initialization if we haven't tried too many times
        if (retryCount < 3) {
          console.log(`Retrying initialization (attempt ${retryCount + 1}/3)...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000);
        }
      }
    };

    initialize();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [retryCount]);

  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
    setLoading(true);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100">
        <Card className="max-w-md w-full p-6">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-red-600">Connection Error</h2>
            <p className="text-gray-600">{error}</p>
            {retryCount < 3 && (
              <p className="text-sm text-gray-500">
                Retrying automatically... (Attempt {retryCount + 1}/3)
              </p>
            )}
            <Button
              onClick={handleRetry}
              className="w-full"
              disabled={loading}
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Retry Connection'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600">Initializing application...</p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500">
              Retry attempt {retryCount}/3
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={{ user, loading, error }}>
      {children}
    </FirebaseContext.Provider>
  );
}
