'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from './FirebaseProvider';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import LoadingSpinner from './components/LoadingSpinner';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from './firebase/clientApp';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { TEST_CREDENTIALS } from './lib/constants';
import { toast } from './components/ui/use-toast';

type AuthTab = 'signup' | 'signin' | 'admin';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useFirebase();
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

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
    setPendingApproval(false);
    setIsSubmitting(true);

    try {
      if (activeTab === 'signup') {
        // Create the auth user first
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        
        try {
          // Create the user document in Firestore with pending status
          await setDoc(doc(db, 'users', uid), {
            email: email,
            name: email.split('@')[0], // Use part of email as initial name
            status: 'pending',
            role: 'user',
            remainingBookings: 0,
            totalBookings: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          // Set pending status for UI
          setPendingApproval(true);
          setPendingEmail(email);
          
          // Sign out the user until they're approved
          await signOut(auth);
        } catch (firestoreError) {
          console.error('Firestore Error:', firestoreError);
          // If Firestore creation fails, delete the auth user
          await userCredential.user.delete();
          throw new Error('Failed to create user profile. Please try again.');
        }
      } else if (activeTab === 'signin') {
        // Sign in and check approval status
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Check user's approval status
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        const userData = userDoc.data();

        if (userData?.status === 'pending') {
          // Sign out if not approved
          await signOut(auth);
          setPendingApproval(true);
          setPendingEmail(email);
        } else {
          router.push('/booking');
        }
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
      setEmail(TEST_CREDENTIALS.email);
      setPassword(TEST_CREDENTIALS.password);
    } else {
      setEmail('user@test.com');
      setPassword('user123');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100">
      <Card className="w-full max-w-md shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardContent className="p-8 space-y-8">
          {pendingApproval ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-yellow-800">
                      Account Pending Approval
                    </h3>
                    <div className="mt-2 text-yellow-700">
                      <p>The account for <span className="font-medium">{pendingEmail}</span> is pending administrator approval.</p>
                      <p className="mt-2">Please check back later to sign in. You will be notified when your account is approved.</p>
                    </div>
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPendingApproval(false);
                          setPendingEmail('');
                          setEmail('');
                          setPassword('');
                        }}
                      >
                        Back to Sign In
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
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
                  onClick={() => {
                    setActiveTab('signup');
                    setError('');
                  }}
                >
                  Sign Up
                </Button>
                <Button
                  type="button"
                  variant={activeTab === 'signin' ? 'default' : 'ghost'}
                  className="flex-1"
                  onClick={() => {
                    setActiveTab('signin');
                    setError('');
                  }}
                >
                  Sign In
                </Button>
                <Button
                  type="button"
                  variant={activeTab === 'admin' ? 'default' : 'ghost'}
                  className="flex-1"
                  onClick={() => {
                    setActiveTab('admin');
                    setError('');
                  }}
                >
                  Admin
                </Button>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <LoadingSpinner className="mr-2" />
                  ) : null}
                  {activeTab === 'signup'
                    ? 'Create Account'
                    : activeTab === 'admin'
                    ? 'Admin Login'
                    : 'Sign In'}
                </Button>

                {activeTab !== 'signup' && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={fillTestCredentials}
                  >
                    Fill Test Credentials
                  </Button>
                )}

                {activeTab === 'admin' && (
                  <div className="text-center text-xs text-gray-500">
                    <p className="font-medium">Test Admin Account:</p>
                    <p>Email: {TEST_CREDENTIALS.email}</p>
                    <p>Password: {TEST_CREDENTIALS.password}</p>
                  </div>
                )}
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
