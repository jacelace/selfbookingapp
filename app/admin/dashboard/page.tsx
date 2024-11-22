'use client';

import AdminDashboard from '../../components/admin/AdminDashboard';
import { useFirebase } from '../../FirebaseProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function DashboardPage() {
  const { user, loading, isAdmin } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');  // Redirect to login page if not authenticated
    } else if (!loading && !isAdmin) {
      router.push('/');  // Redirect to main page if authenticated but not admin
    }
  }, [user, loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return <AdminDashboard />;
}
