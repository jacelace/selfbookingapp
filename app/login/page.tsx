'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import LoadingSpinner from '../components/LoadingSpinner';
import { useFirebase } from '../FirebaseProvider';
import { toast } from '../components/ui/use-toast';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const router = useRouter();
  const { signInWithTest, signInWithCredentials, user, isAdmin } = useFirebase();

  useEffect(() => {
    if (user) {
      if (isAdmin) {
        router.push('/admin/dashboard');
      } else {
        router.push('/booking');
      }
    }
  }, [user, isAdmin, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    try {
      await signInWithCredentials(email, password);
      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });
    } catch (err: any) {
      if (err.message === 'Account pending approval') {
        setPendingApproval(true);
        setPendingEmail(email);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to login. Please check your credentials.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleTestLogin() {
    if (loading) return;
    
    setLoading(true);
    try {
      await signInWithTest();
      toast({
        title: 'Success',
        description: 'Logged in as admin',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to login with test credentials',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
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
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                    autoComplete="email"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                    className="w-full"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  Sign In
                </Button>
              </form>
            )}
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleTestLogin}
                disabled={loading}
              >
                Sign In as Test Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;
