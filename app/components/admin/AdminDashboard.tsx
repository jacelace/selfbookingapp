'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, Users, Calendar, Tag, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { collection, query, doc, getDoc, setDoc, getDocs, orderBy, Timestamp, where } from 'firebase/firestore';
import { db, auth } from '../../firebase/clientApp';
import type { EnhancedUser, EnhancedBooking, Label as LabelType } from '../../types';
import LoadingSpinner from '../LoadingSpinner';
import { TEST_CREDENTIALS } from '../../lib/constants';
import UserManagement from './UserManagement';
import LabelManagement from './LabelManagement';
import BookingManagement from './BookingManagement';
import BookingCalendar from './BookingCalendar';
import CreateUserForm from './CreateUserForm';
import TimeOffManagement from './TimeOffManagement';
import { toast } from '../ui/use-toast';
import { useFirebase } from '../../FirebaseProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Separator } from '../ui/separator';

const AdminDashboard: React.FC = () => {
  // Data states
  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [bookings, setBookings] = useState<EnhancedBooking[]>([]);
  const [labels, setLabels] = useState<LabelType[]>([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLabelSubmitting, setIsLabelSubmitting] = useState(false);
  
  // Firebase state
  const { user: adminUser, isAdmin, loading: authLoading } = useFirebase();

  // Computed values
  const totalUsers = users.length;
  const pendingUsers = users.filter(user => user.status === 'pending' || !user.isApproved).length;
  const totalBookings = bookings.length;
  const upcomingBookings = bookings.filter(booking => {
    if (!booking.date) return false;
    const bookingDate = booking.date instanceof Timestamp ? booking.date.toDate() : new Date(booking.date);
    return bookingDate >= new Date(new Date().setHours(0, 0, 0, 0));
  }).length;

  // Error handling
  const handleError = (error: unknown, message: string) => {
    console.error(`${message}:`, error);
    setError(message);
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  };

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Fetch users data
  const fetchUsers = async () => {
    if (!isAdmin) return;
    
    try {
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(usersQuery);
      const updatedUsers = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          email: data.email || '',
          role: data.role || 'user',
          status: data.status || 'pending',
          isAdmin: data.isAdmin || false,
          isApproved: data.isApproved || false,
          labelId: data.labelId,
          userLabel: data.userLabel,
          labelColor: data.labelColor,
          totalBookings: data.totalBookings || 0,
          remainingBookings: data.remainingBookings || 0,
          totalSessions: data.totalSessions || 0,
          sessions: data.sessions || 0,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(new Date()),
          createdBy: data.createdBy || '',
          updatedAt: data.updatedAt || new Date().toISOString(),
          _timestamp: Date.now()
        } as EnhancedUser;
      });
      
      setUsers(updatedUsers);
    } catch (err) {
      handleError(err, 'Failed to fetch users');
    }
  };

  // Fetch bookings data
  const fetchBookings = async () => {
    if (!isAdmin) return;
    
    try {
      const bookingsQuery = query(
        collection(db, 'bookings'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(bookingsQuery);
      const updatedBookings = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId || '',
          userName: data.userName || '',
          userEmail: data.userEmail || '',
          date: data.date instanceof Timestamp ? data.date : Timestamp.fromDate(new Date(data.date || Date.now())),
          time: data.time || '10:00 AM',
          status: data.status || 'pending',
          recurring: data.recurring || 'none',
          recurringCount: data.recurringCount || 0,
          labelId: data.labelId || '',
          labelName: data.labelName || '',
          labelColor: data.labelColor || '#000000',
          notes: data.notes || '',
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(new Date()),
          createdBy: data.createdBy || '',
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.fromDate(new Date()),
          _timestamp: Date.now()
        } as EnhancedBooking;
      });
      
      setBookings(updatedBookings);
    } catch (err) {
      handleError(err, 'Failed to fetch bookings');
    }
  };

  // Fetch labels data
  const fetchLabels = async () => {
    if (!isAdmin) return;
    
    try {
      const labelsQuery = query(collection(db, 'labels'));
      const snapshot = await getDocs(labelsQuery);
      const updatedLabels = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          color: data.color || '#000000',
          isDefault: data.isDefault || false,
          createdAt: data.createdAt || new Date().toISOString(),
          createdBy: data.createdBy || '',
          updatedAt: data.updatedAt || new Date().toISOString(),
          _timestamp: Date.now()
        } as LabelType;
      });
      
      setLabels(updatedLabels);
    } catch (err) {
      handleError(err, 'Failed to fetch labels');
    }
  };

  // Initial data fetch and cache clearing
  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch fresh data
        await Promise.all([
          fetchUsers(),
          fetchBookings(),
          fetchLabels()
        ]);
      } catch (err) {
        handleError(err, 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  // Refresh data periodically
  useEffect(() => {
    if (!isAdmin) return;

    const refreshInterval = setInterval(() => {
      Promise.all([
        fetchUsers(),
        fetchBookings(),
        fetchLabels()
      ]).catch(err => handleError(err, 'Failed to refresh data'));
    }, 30000); // Increased refresh interval to 30 seconds

    return () => clearInterval(refreshInterval);
  }, [isAdmin]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!adminUser || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You do not have permission to access this page.</p>
          <Link href="/" className="mt-4 inline-block">
            <Button variant="default">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, bookings, and settings</p>
        </div>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {pendingUsers} pending approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              {upcomingBookings} upcoming
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bookings" className="space-y-4">
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

        <TabsContent value="bookings" className="space-y-4">
          <BookingManagement
            bookings={bookings}
            users={users}
            labels={labels}
            onRefresh={fetchBookings}
          />
        </TabsContent>
        <TabsContent value="users" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-slate-50 to-gray-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Booking Calendar</CardTitle>
                <CardDescription>View and manage upcoming bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <BookingCalendar
                  bookings={bookings}
                  onRefresh={fetchBookings}
                />
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-slate-50 to-gray-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">User Management</CardTitle>
                <CardDescription>View and manage user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagement
                  users={users}
                  labels={labels}
                  isSubmitting={isSubmitting}
                  setIsSubmitting={setIsSubmitting}
                  onRefresh={fetchUsers}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="labels" className="space-y-4">
          <LabelManagement
            labels={labels}
            setLabels={setLabels}
            isSubmitting={isLabelSubmitting}
            setIsSubmitting={setIsLabelSubmitting}
            onRefresh={fetchLabels}
          />
        </TabsContent>
        <TabsContent value="timeoff" className="space-y-4">
          <TimeOffManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
