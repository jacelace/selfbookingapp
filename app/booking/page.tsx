'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/clientApp';
import { toast } from '../components/ui/use-toast';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../components/LoadingSpinner';
import UserBookings from '../components/UserBookings';
import BookingFlow from '../components/BookingFlow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar, Clock } from 'lucide-react';

interface UserData {
  name: string;
  email: string;
  phone: string;
  remainingBookings: number;
  status?: string;
  isApproved?: boolean;
  role?: string;
  labelId?: string;
  labelName?: string;
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
          labelId: userDoc.data()?.labelId,
          labelName: userDoc.data()?.labelName,
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

  const handleUserInfoUpdate = async (info: Partial<UserData>) => {
    if (!auth.currentUser) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, info);
      setUserData(prev => prev ? { ...prev, ...info } : null);
      toast({
        title: "Success",
        description: "User information updated successfully",
      });
    } catch (error) {
      console.error('Error updating user info:', error);
      toast({
        title: "Error",
        description: "Failed to update user information",
        variant: "destructive",
      });
    }
  };

  const handleBookingComplete = () => {
    if (!userData) return;
    
    setUserData(prev => prev ? {
      ...prev,
      remainingBookings: Math.max(0, prev.remainingBookings - 1)
    } : null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="book" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="book" className="space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Book Session</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="space-x-2">
              <Clock className="h-4 w-4" />
              <span>My Bookings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="book" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Book a New Session</CardTitle>
                <CardDescription>
                  You have {userData?.remainingBookings || 0} sessions remaining
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <BookingFlow
                  userData={userData}
                  onUserInfoUpdate={handleUserInfoUpdate}
                  onBookingComplete={handleBookingComplete}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>My Bookings</CardTitle>
                <CardDescription>
                  View and manage your upcoming sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserBookings />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
