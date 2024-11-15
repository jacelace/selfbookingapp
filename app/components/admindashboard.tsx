'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { collection, getDocs, query, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/clientApp';
import type { EnhancedUser, EnhancedBooking, Label as LabelType } from '../types/shared';
import LoadingSpinner from './LoadingSpinner';
import { TEST_CREDENTIALS } from '../lib/constants';
import { UserManagement } from './admin/UserManagement';
import { LabelManagement } from './admin/LabelManagement';
import { BookingManagement } from './admin/BookingManagement';

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

  const fetchData = useCallback(async () => {
    try {
      // Fetch users
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as EnhancedUser[];
      setUsers(usersData);

      // Fetch bookings
      const bookingsQuery = query(collection(db, 'bookings'));
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookingsData = bookingsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as EnhancedBooking[];
      setBookings(bookingsData);

      // Fetch labels
      const labelsQuery = query(collection(db, 'labels'));
      const labelsSnapshot = await getDocs(labelsQuery);
      const labelsData = labelsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as LabelType[];
      setLabels(labelsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Please try again.');
    }
  }, []);

  const initializeAuth = useCallback(async () => {
    try {
      return auth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          
          // Check if user is admin
          if (firebaseUser.email === TEST_CREDENTIALS.email) {
            // Create admin user document if it doesn't exist
            const userRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
              await setDoc(userRef, {
                email: firebaseUser.email,
                name: 'Admin',
                isAdmin: true,
                role: 'admin',
                createdAt: new Date().toISOString()
              });
            }
            
            // Fetch data
            await fetchData();
          } else {
            setError('You do not have permission to access this page');
          }
          
          setLoading(false);
        } else {
          setUser(null);
          setError('Please sign in to access this page');
          setLoading(false);
        }
      });
    } catch (err) {
      console.error('Auth initialization error:', err);
      setError('Failed to initialize authentication');
      setLoading(false);
      return () => {};
    }
  }, [fetchData]);

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => {
      unsubscribe.then(fn => fn && fn());
    };
  }, [initializeAuth]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <p className="text-red-500">{error}</p>
        <Link href="/">
          <Button variant="outline" size="sm">
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
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
      </div>

      <BookingManagement
        users={users}
        bookings={bookings}
        setBookings={setBookings}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
      />
    </div>
  );
};

export default AdminDashboard;
