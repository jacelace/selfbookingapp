'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/clientApp';
import { toast } from '../components/ui/use-toast';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../components/LoadingSpinner';
import UserBookings from '../components/UserBookings';
import { Card, CardContent } from '../components/ui/card';

interface UserData {
  name: string;
  email: string;
  remainingBookings: number;
  status?: string;
  isApproved?: boolean;
  role?: string;
}

export default function BookingPage() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkApprovalStatus = async () => {
      const currentUser = auth?.currentUser;
      if (!currentUser) {
        router.push('/');
        return;
      }

      try {
        console.log('Checking user status for:', currentUser.uid);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userDataFromDb = userDoc.data() as UserData;
        console.log('User data:', userDataFromDb);

        if (!userDataFromDb) {
          console.log('No user data found');
          toast({
            title: "Error",
            description: "User data not found",
            variant: "destructive",
          });
          router.push('/');
          return;
        }

        // Check if user is approved - either by isApproved flag or role being 'user'
        const isUserApproved = userDataFromDb.isApproved === true || userDataFromDb.role === 'user';
        console.log('Is user approved:', isUserApproved);

        if (!isUserApproved) {
          console.log('User not approved');
          toast({
            title: "Not Approved",
            description: "Your account is pending approval.",
            variant: "destructive",
          });
          router.push('/');
          return;
        }

        setUserData(userDataFromDb);
        setLoading(false);
      } catch (error) {
        console.error('Error checking approval status:', error);
        toast({
          title: "Error",
          description: "Failed to check approval status",
          variant: "destructive",
        });
        router.push('/');
      }
    };

    checkApprovalStatus();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!userData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-red-500">
            Unable to load user data. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Booking Management</h1>
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            You have {userData.remainingBookings} booking sessions remaining
          </p>
        </div>
        <UserBookings />
      </div>
    </div>
  );
}
