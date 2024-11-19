'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/clientApp';
import { toast } from '../components/ui/use-toast';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../components/LoadingSpinner';
import UserBookings from '../components/UserBookings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar, Clock, User } from 'lucide-react';

interface UserData {
  name: string;
  email: string;
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

        // If there's a labelId, fetch the label details
        if (userDataFromDb.labelId) {
          const labelDoc = await getDoc(doc(db, 'labels', userDataFromDb.labelId));
          if (labelDoc.exists()) {
            const labelData = labelDoc.data();
            userDataFromDb.labelName = labelData.name;
            userDataFromDb.labelColor = labelData.color;
          }
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
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-500">
              Unable to load user data. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 mt-16">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Booking Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your therapy sessions</p>
        </div>
      </div>

      {/* User Info Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Profile</CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{userData.name}</div>
            <p className="text-xs text-blue-600/80">{userData.email}</p>
            {userData.labelName && (
              <div className="mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                   style={{ backgroundColor: userData.labelColor + '20', color: userData.labelColor }}>
                {userData.labelName}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{userData.remainingBookings}</div>
            <p className="text-xs text-purple-600/80">Available bookings</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-rose-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Session</CardTitle>
            <Clock className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-700">-</div>
            <p className="text-xs text-pink-600/80">Upcoming appointment</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your Bookings</CardTitle>
          <CardDescription>
            Manage your therapy sessions and appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming" className="space-y-4">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past Sessions</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="space-y-4">
              <UserBookings />
            </TabsContent>
            <TabsContent value="past" className="space-y-4">
              <UserBookings showPast />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
