'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { collection, query, doc, getDoc, setDoc, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/clientApp';
import type { EnhancedUser, EnhancedBooking, Label as LabelType } from '../types/shared';
import LoadingSpinner from './LoadingSpinner';
import { TEST_CREDENTIALS } from '../lib/constants';
import { UserManagement } from './admin/UserManagement';
import { LabelManagement } from './admin/LabelManagement';
import { BookingManagement } from './admin/BookingManagement';
import { BookingCalendar } from './admin/BookingCalendar';
import { CreateUserForm } from './admin/CreateUserForm';
import { BookingSettings } from './admin/BookingSettings';
import { toast } from './ui/use-toast';
import { useFirebase } from '../FirebaseProvider';

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
  }, []);

  // Set up real-time listener for bookings collection
  useEffect(() => {
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
            return {
              ...data,
              id: doc.id,
              date: data.date,
              createdAt: data.createdAt || Timestamp.now(),
              updatedAt: data.updatedAt || Timestamp.now()
            };
          }) as EnhancedBooking[];
          
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
  }, []);

  // Set up real-time listener for labels collection
  useEffect(() => {
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
  }, []);

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
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="space-y-6">
        <BookingSettings />
        <div className="grid gap-8">
          {!loading && (
            <>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Create New User</h2>
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
                </div>
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Booking Calendar</h2>
                  <BookingCalendar bookings={bookings} />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">User Management</h2>
                <UserManagement 
                  users={users}
                  labels={labels}
                  setUsers={setUsers}
                  isSubmitting={isSubmitting}
                  setIsSubmitting={setIsSubmitting}
                />
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Label Management</h2>
                <LabelManagement 
                  labels={labels}
                  setLabels={setLabels}
                  isSubmitting={isSubmitting}
                  setIsSubmitting={setIsSubmitting}
                />
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Booking Management</h2>
                <BookingManagement
                  users={users}
                  bookings={bookings}
                  labels={labels}
                  setBookings={setBookings}
                  isSubmitting={isSubmitting}
                  setIsSubmitting={setIsSubmitting}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
