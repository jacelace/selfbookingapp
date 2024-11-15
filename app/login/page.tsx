'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import LoadingSpinner from '../components/LoadingSpinner';
import { TEST_CREDENTIALS } from '../lib/constants';
import { useFirebase } from '../FirebaseProvider';
import { toast } from '../components/ui/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { error, signInWithTest, signInWithCredentials } = useFirebase();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    try {
      await signInWithCredentials(email, password);
      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });
      router.push('/admin/dashboard');
    } catch (err) {
      toast({
        title: 'Error',
        description: error || 'Failed to login',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      console.log('Starting test login...');
      await signInWithTest();
      toast({
        title: 'Success',
        description: 'Logged in as test admin',
      });
      router.push('/admin/dashboard');
    } catch (err) {
      console.error('Test login failed:', err);
      toast({
        title: 'Error',
        description: error || 'Failed to login with test account',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Use the test account below or sign in with your credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Button
              type="button"
              onClick={handleTestLogin}
              className="w-full"
              variant="outline"
              disabled={loading}
            >
              {loading ? (
                <LoadingSpinner size={16} />
              ) : (
                <>
                  Sign in as Test Admin
                  <span className="text-xs ml-2">
                    ({TEST_CREDENTIALS.email})
                  </span>
                </>
              )}
            </Button>
          </div>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                disabled={loading}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                disabled={loading}
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-500">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? <LoadingSpinner size={16} /> : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
