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
        description: 'Logged in as admin',
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleTestLogin}
              className="w-full mt-4"
              disabled={loading}
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Sign In as Admin'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
