'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/clientApp';
import { useFirebase } from '../FirebaseProvider';
import { useToast } from '../components/ui/use-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import UserBookingForm from '../components/UserBookingForm';

interface UserData {
  name: string;
  email: string;
  remainingBookings: number;
  status?: string;
  isApproved?: boolean;
  role?: string;
  userLabel?: string;
  labelColor?: string;
}

export default function CreateBookingPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Get the current user's info
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData({
              name: data.name || '',
              email: data.email || '',
              remainingBookings: data.remainingSessions || 0,
              status: data.status,
              isApproved: data.isApproved,
              role: data.role,
              userLabel: data.userLabel,
              labelColor: data.labelColor
            });
          }
        } catch (error) {
          console.error('Error fetching user info:', error);
          toast({
            title: "Error",
            description: "Failed to fetch user information",
            variant: "destructive",
          });
        }
      }
    });

    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    const checkUser = async () => {
      if (!auth.currentUser) {
        toast({
          title: "Not Logged In",
          description: "Please sign in to create a booking",
          variant: "destructive",
        });
        router.push('/');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (!userDoc.exists()) {
          toast({
            title: "User Not Found",
            description: "Your user profile was not found",
            variant: "destructive",
          });
          router.push('/');
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Error checking user:', error);
        toast({
          title: "Error",
          description: "Failed to check user status",
          variant: "destructive",
        });
        router.push('/');
      }
    };

    checkUser();
  }, [router, toast]);

  if (loading || !userData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!auth.currentUser) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Please sign in to create a booking</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <UserBookingForm
        userId={auth.currentUser.uid}
        remainingSessions={userData.remainingBookings}
        userData={userData}
      />
    </div>
  );
}
