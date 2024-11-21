'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, Users, Calendar, Tag, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { collection, query, doc, getDoc, setDoc, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase/clientApp';
import type { EnhancedUser, EnhancedBooking, Label as LabelType } from '../../types/shared';
import LoadingSpinner from '../LoadingSpinner';
import { TEST_CREDENTIALS } from '../../lib/constants';
import UserManagement from './UserManagement';
import LabelManagement from './LabelManagement';
import BookingManagement from './BookingManagement';
import BookingCalendar from './BookingCalendar';
import CreateUserForm from './CreateUserForm';
import { toast } from '../ui/use-toast';
import { useFirebase } from '../../FirebaseProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Separator } from '../ui/separator';
import { TimeOffManagement } from './TimeOffManagement';

const AdminDashboard: React.FC = () => {
  // Data states
  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [bookings, setBookings] = useState<EnhancedBooking[]>([]);
  const [labels, setLabels] = useState<LabelType[]>([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Firebase state
  const { user, isAdmin, loading: authLoading } = useFirebase();

  // Computed values
  const totalUsers = users.length;
  const pendingUsers = users.filter(user => !user.isApproved).length;
  const totalBookings = bookings.length;
  const upcomingBookings = bookings.filter(booking => 
    booking.date.toDate() >= new Date(new Date().setHours(0, 0, 0, 0))
  ).length;

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Set up real-time listener for users collection
  useEffect(() => {
    if (!isAdmin) return;

    let isMounted = true;

    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        if (!isMounted) return;

        try {
          const updatedUsers = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          })) as EnhancedUser[];
          
          setUsers(updatedUsers);
          if (loading) setLoading(false);

          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' && change.doc.data().status === 'pending') {
              toast({
                title: 'New User Signup',
                description: `${change.doc.data().email} is pending approval`,
                variant: 'default',
              });
            }
          });
        } catch (err) {
          console.error('Error processing users data:', err);
          setError('Failed to process user data');
        }
      },
      (err) => {
        console.error('Error listening to users collection:', err);
        if (isMounted) {
          setError('Failed to listen to user updates');
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isAdmin]);

  // Set up real-time listener for bookings collection
  useEffect(() => {
    if (!isAdmin) return;

    let isMounted = true;

    const bookingsQuery = query(
      collection(db, 'bookings'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        if (!isMounted) return;

        try {
          const updatedBookings = snapshot.docs.map(doc => {
            const data = doc.data();
            // Ensure all timestamp fields are properly handled
            return {
              ...data,
              id: doc.id,
              date: data.date instanceof Timestamp ? data.date : Timestamp.fromDate(new Date(data.date)),
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(new Date(data.createdAt)),
              updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.fromDate(new Date(data.updatedAt))
            } as EnhancedBooking;
          });
          
          setBookings(updatedBookings);
          if (loading) setLoading(false);

          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const bookingData = change.doc.data();
              try {
                const dateString = bookingData.date?.toDate?.()?.toLocaleDateString() || 'Invalid Date';
                
                toast({
                  title: 'New Booking Created',
                  description: `New booking for ${bookingData.userName || 'Unknown'} on ${dateString}`,
                  variant: 'default',
                });
              } catch (err) {
                console.error('Error formatting booking date:', err);
              }
            }
          });
        } catch (err) {
          console.error('Error processing bookings data:', err);
          setError('Failed to process booking data');
        }
      },
      (err) => {
        console.error('Error listening to bookings collection:', err);
        if (isMounted) {
          setError('Failed to listen to booking updates');
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isAdmin]);

  // Set up real-time listener for labels collection
  useEffect(() => {
    if (!isAdmin) return;

    let isMounted = true;

    const labelsQuery = query(collection(db, 'labels'));

    const unsubscribe = onSnapshot(
      labelsQuery,
      (snapshot) => {
        if (!isMounted) return;

        try {
          const updatedLabels = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          })) as LabelType[];
          
          setLabels(updatedLabels);
          if (loading) setLoading(false);
        } catch (err) {
          console.error('Error processing labels data:', err);
          setError('Failed to process label data');
        }
      },
      (err) => {
        console.error('Error listening to labels collection:', err);
        if (isMounted) {
          setError('Failed to listen to label updates');
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isAdmin]);

  // Admin check effect
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setError('Please log in to access the admin dashboard');
      setLoading(false);
      return;
    }

    // Only set error if we're sure the user is not an admin after loading
    if (!isAdmin && !authLoading) {
      setError('Access denied: Only administrators can access this page');
      setLoading(false);
      return;
    }

    // Clear any previous error if user is admin
    if (isAdmin) {
      setError(null);
    }

    setLoading(false);
  }, [user, isAdmin, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Only show error if we're not loading and there's an actual error
  if (!loading && !authLoading && (error || !user || !isAdmin)) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Access Denied! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <Link href="/" className="mt-4 inline-block">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 mt-16">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your therapy booking system</p>
        </div>
        <Link href="/">
          <Button variant="outline" size="sm" className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50">
            <ArrowLeft className="mr-2 h-3 w-3" />
            Back to Home
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-3 py-2 rounded-lg text-sm" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalUsers}</div>
            <p className="text-xs text-blue-600/80">
              {pendingUsers} pending approval
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalBookings}</div>
            <p className="text-xs text-purple-600/80">
              {upcomingBookings} upcoming
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Labels</CardTitle>
            <Tag className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">{labels.length}</div>
            <p className="text-xs text-pink-600/80">
              Active categories
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-50 to-orange-50 border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calendar</CardTitle>
            <Calendar className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{upcomingBookings}</div>
            <p className="text-xs text-rose-600/80">
              Upcoming sessions
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-auto bg-gradient-to-r from-slate-50 to-gray-50 p-1 rounded-lg">
          <TabsTrigger 
            value="bookings"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-md py-3 text-sm font-medium"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Bookings
          </TabsTrigger>
          <TabsTrigger 
            value="users"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-md py-3 text-sm font-medium"
          >
            <Users className="w-4 h-4 mr-2" />
            Calendar/Users
          </TabsTrigger>
          <TabsTrigger 
            value="labels"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-md py-3 text-sm font-medium"
          >
            <Tag className="w-4 h-4 mr-2" />
            Labels
          </TabsTrigger>
          <TabsTrigger 
            value="timeoff"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-md py-3 text-sm font-medium"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Time Off
          </TabsTrigger>
        </TabsList>

        <style jsx global>{`
          /* Bookings section buttons */
          [data-state="active"][value="bookings"] ~ * button:not([variant="outline"]):not([variant="destructive"]) {
            background-image: linear-gradient(to right, var(--tw-gradient-from-blue-500), var(--tw-gradient-to-purple-500));
          }
          
          /* Users section buttons */
          [data-state="active"][value="users"] ~ * button:not([variant="outline"]):not([variant="destructive"]) {
            background-image: linear-gradient(to right, var(--tw-gradient-from-purple-500), var(--tw-gradient-to-pink-500));
          }
          
          /* Labels section buttons */
          [data-state="active"][value="labels"] ~ * button:not([variant="outline"]):not([variant="destructive"]) {
            background-image: linear-gradient(to right, var(--tw-gradient-from-pink-500), var(--tw-gradient-to-rose-500));
          }
          
          /* Time Off section buttons */
          [data-state="active"][value="timeoff"] ~ * button:not([variant="outline"]):not([variant="destructive"]) {
            background-image: linear-gradient(to right, var(--tw-gradient-from-rose-500), var(--tw-gradient-to-orange-500));
          }

          /* Hover states */
          [data-state="active"][value="bookings"] ~ * button:not([variant="outline"]):not([variant="destructive"]):hover {
            background-image: linear-gradient(to right, var(--tw-gradient-from-blue-600), var(--tw-gradient-to-purple-600));
          }
          
          [data-state="active"][value="users"] ~ * button:not([variant="outline"]):not([variant="destructive"]):hover {
            background-image: linear-gradient(to right, var(--tw-gradient-from-purple-600), var(--tw-gradient-to-pink-600));
          }
          
          [data-state="active"][value="labels"] ~ * button:not([variant="outline"]):not([variant="destructive"]):hover {
            background-image: linear-gradient(to right, var(--tw-gradient-from-pink-600), var(--tw-gradient-to-rose-600));
          }
          
          [data-state="active"][value="timeoff"] ~ * button:not([variant="outline"]):not([variant="destructive"]):hover {
            background-image: linear-gradient(to right, var(--tw-gradient-from-rose-600), var(--tw-gradient-to-orange-600));
          }
        `}</style>

        <TabsContent value="users" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-slate-50 to-gray-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Booking Calendar</CardTitle>
                <CardDescription className="text-sm">View upcoming sessions</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <BookingCalendar bookings={bookings} />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-50 to-gray-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Create New User</CardTitle>
                <CardDescription className="text-sm">Add a new user to the system</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <CreateUserForm 
                  labels={labels}
                  isSubmitting={isSubmitting}
                  setIsSubmitting={setIsSubmitting}
                  onSuccess={() => {
                    toast({
                      title: 'Success',
                      description: 'User created successfully',
                    });
                  }}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-br from-slate-50 to-gray-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">User Management</CardTitle>
              <CardDescription className="text-sm">Manage existing users and their sessions</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <UserManagement 
                users={users}
                labels={labels}
                setUsers={setUsers}
                isSubmitting={isSubmitting}
                setIsSubmitting={setIsSubmitting}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <BookingManagement
            users={users}
            bookings={bookings}
            labels={labels}
            setBookings={setBookings}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
          />
        </TabsContent>

        <TabsContent value="labels">
          <Card className="bg-gradient-to-br from-slate-50 to-gray-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Label Management</CardTitle>
              <CardDescription className="text-sm">Manage therapy categories and labels</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <LabelManagement 
                labels={labels}
                setLabels={setLabels}
                isSubmitting={isSubmitting}
                setIsSubmitting={setIsSubmitting}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeoff" className="space-y-4">
          <TimeOffManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
