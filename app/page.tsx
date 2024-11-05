'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from './FirebaseProvider';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import LoadingSpinner from './components/LoadingSpinner';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase/clientApp';

type AuthTab = 'signup' | 'signin' | 'admin';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useFirebase();
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (activeTab === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
        router.push('/booking');
      } else if (activeTab === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/booking');
      } else if (activeTab === 'admin') {
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillTestCredentials = () => {
    if (activeTab === 'admin') {
      setEmail('admin@test.com');
      setPassword('admin123');
    } else {
      setEmail('user@test.com');
      setPassword('user123');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100">
      <Card className="w-full max-w-md shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardContent className="p-8 space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Therapy Session Booking</h1>
            <p className="text-gray-500 text-sm">
              {activeTab === 'signup' 
                ? 'Create an account to book therapy sessions'
                : activeTab === 'admin'
                ? 'Admin access for managing bookings'
                : 'Sign in to manage your therapy sessions'}
            </p>
          </div>

          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <Button
              type="button"
              variant={activeTab === 'signup' ? 'default' : 'ghost'}
              className="flex-1"
              onClick={() => setActiveTab('signup')}
            >
              Sign Up
            </Button>
            <Button
              type="button"
              variant={activeTab === 'signin' ? 'default' : 'ghost'}
              className="flex-1"
              onClick={() => setActiveTab('signin')}
            >
              Sign In
            </Button>
            <Button
              type="button"
              variant={activeTab === 'admin' ? 'default' : 'ghost'}
              className="flex-1"
              onClick={() => setActiveTab('admin')}
            >
              Admin
            </Button>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={activeTab === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : activeTab === 'signup' ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={fillTestCredentials}
            >
              Use Test Credentials
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            {activeTab === 'admin' ? (
              'Admin access is restricted to authorized personnel only.'
            ) : (
              <>
                By {activeTab === 'signup' ? 'signing up' : 'signing in'}, you agree to our{' '}
                <Button variant="link" className="p-0 h-auto">Terms of Service</Button>
                {' '}and{' '}
                <Button variant="link" className="p-0 h-auto">Privacy Policy</Button>.
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
