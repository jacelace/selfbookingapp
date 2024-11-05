'use client';

import AdminDashboard from '../../components/admindashboard';
import { useFirebase } from '../../FirebaseProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/signin');
    }
  }, [user, loading, router]);

  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return <AdminDashboard />;
}
