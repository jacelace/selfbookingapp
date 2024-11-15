'use client';

import { useEffect, useState } from 'react';
import { app } from '../firebase/clientApp';
import LoadingSpinner from './LoadingSpinner';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

interface FirebaseInitializerProps {
  children: React.ReactNode;
}

export default function FirebaseInitializer({ children }: FirebaseInitializerProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Check if Firebase app is initialized
        if (app) {
          console.log('Firebase app initialized successfully');
          setIsInitialized(true);
        }
      } catch (err: any) {
        console.error('Firebase initialization error:', err);
        setError(`Failed to initialize the application: ${err.message}`);
      }
    };

    initialize();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="max-w-md w-full text-center">
          <Card className="p-6">
            <CardContent>
              <div className="bg-red-50 text-red-500 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-2">Initialization Error</h2>
                <p className="text-sm mb-4">{error}</p>
                <Button
                  variant="secondary"
                  onClick={() => window.location.reload()}
                  className="text-sm hover:text-blue-800"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Initializing application...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
