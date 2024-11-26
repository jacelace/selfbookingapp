'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/clientApp';
import { toast } from '../components/ui/use-toast';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../components/LoadingSpinner';
import BookingCalendar from '../components/BookingCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

interface UserData {
  name: string;
  email: string;
  phone: string;
  remainingBookings: number;
  status?: string;
  isApproved?: boolean;
  role?: string;
  userLabel?: string;
  labelColor?: string;
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

        if (!userDataFromDb.isApproved) {
          console.log('User not approved');
          toast({
            title: "Access Denied",
            description: "Your account is pending approval",
            variant: "destructive",
          });
          router.push('/');
          return;
        }

        const userData: UserData = {
          name: userDoc.data()?.name || '',
          email: userDoc.data()?.email || '',
          remainingBookings: userDoc.data()?.remainingBookings || 0,
          phone: userDoc.data()?.phone || '',
          status: userDoc.data()?.status,
          isApproved: userDoc.data()?.isApproved,
          role: userDoc.data()?.role,
          userLabel: userDoc.data()?.userLabel,
          labelColor: userDoc.data()?.labelColor,
        };

        setUserData(userData);
      } catch (error) {
        console.error('Error checking approval status:', error);
        toast({
          title: "Error",
          description: "Failed to check approval status",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    checkApprovalStatus();
  }, [router]);

  if (loading) return <LoadingSpinner />;

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please log in to access booking.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Book a Session</CardTitle>
          {userData.remainingBookings !== undefined && (
            <p className="text-sm text-muted-foreground">
              Remaining bookings: {userData.remainingBookings}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <BookingCalendar 
            userData={userData}
            onRefresh={() => {
              // Refresh user data after booking
              checkApprovalStatus();
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
