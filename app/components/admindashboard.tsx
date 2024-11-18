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
import { toast } from './ui/use-toast';

const AdminDashboard: React.FC = () => {
  // Data states
  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [bookings, setBookings] = useState<EnhancedBooking[]>([]);
  const [labels, setLabels] = useState<LabelType[]>([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Auth state
  const [user, setUser] = useState<any>(null);

  // Set up real-time listener for users collection
  useEffect(() => {
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc') // Show newest users first
    );

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const updatedUsers = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as EnhancedUser[];
        
        setUsers(updatedUsers);
        if (loading) setLoading(false);

        // Show toast for new pending users
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' && change.doc.data().status === 'pending') {
            toast({
              title: 'New User Signup',
              description: `${change.doc.data().email} is pending approval`,
              variant: 'default',
            });
          }
        });
      },
      (error) => {
        console.error('Error listening to users collection:', error);
        setError('Failed to listen to user updates');
        if (loading) setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [loading]);

  // Set up real-time listener for bookings collection
  useEffect(() => {
    const bookingsQuery = query(
      collection(db, 'bookings'),
      orderBy('createdAt', 'desc') // Show newest bookings first
    );

    const unsubscribe = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        const updatedBookings = snapshot.docs.map(doc => {
          const data = doc.data();
          // Ensure date fields are properly handled as Timestamps
          return {
            ...data,
            id: doc.id,
            date: data.date, // This is already a Timestamp
            createdAt: data.createdAt || Timestamp.now(),
            updatedAt: data.updatedAt || Timestamp.now()
          };
        }) as EnhancedBooking[];
        
        setBookings(updatedBookings);
        if (loading) setLoading(false);

        // Show toast for new bookings
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const bookingData = change.doc.data();
            try {
              const dateString = bookingData.date && bookingData.date.toDate 
                ? bookingData.date.toDate().toLocaleDateString() 
                : 'Invalid Date';
              
              toast({
                title: 'New Booking Created',
                description: `New booking for ${bookingData.userName || 'Unknown'} on ${dateString}`,
                variant: 'default',
              });
            } catch (error) {
              console.error('Error formatting booking date:', error);
              toast({
                title: 'New Booking Created',
                description: `New booking for ${bookingData.userName || 'Unknown'}`,
                variant: 'default',
              });
            }
          }
        });
      },
      (error) => {
        console.error('Error listening to bookings collection:', error);
        setError('Failed to listen to booking updates');
        if (loading) setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [loading]);

  // Set up real-time listener for labels collection
  useEffect(() => {
    const labelsQuery = query(collection(db, 'labels'));

    const unsubscribe = onSnapshot(
      labelsQuery,
      (snapshot) => {
        const updatedLabels = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as LabelType[];
        
        setLabels(updatedLabels);
        if (loading) setLoading(false);
      },
      (error) => {
        console.error('Error listening to labels collection:', error);
        setError('Failed to listen to label updates');
        if (loading) setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [loading]);

  // Auth check effect
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (!user || user.email !== TEST_CREDENTIALS.email) {
        setError('Unauthorized: Only admins can access this page');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || user.email !== TEST_CREDENTIALS.email) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Unauthorized!</strong>
          <span className="block sm:inline"> Only admins can access this page.</span>
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

      <div className="grid gap-8">
        <BookingCalendar bookings={bookings} />
        
        <UserManagement 
          users={users}
          labels={labels}
          setUsers={setUsers}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
        />

        <LabelManagement 
          labels={labels}
          setLabels={setLabels}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
        />

        <BookingManagement
          users={users}
          bookings={bookings}
          labels={labels}
          setBookings={setBookings}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
