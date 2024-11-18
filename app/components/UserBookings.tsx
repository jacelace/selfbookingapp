'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/clientApp';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import LoadingSpinner from './LoadingSpinner';
import { toast } from './ui/use-toast';
import ColorLabel from './ColorLabel';
import { onAuthStateChanged } from 'firebase/auth';
import UserBookingForm from './UserBookingForm';

interface Booking {
  id: string;
  userId: string;
  userName: string;
  userLabel: string;
  userLabelColor: string;
  date: Timestamp;
  time: string;
  recurring: 'none' | 'weekly';
  recurringCount?: number;
  status: 'confirmed' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export default function UserBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? `User ${user.uid}` : 'No user');
      setCurrentUser(user);
      if (!user) {
        setLoading(false);
        setError('Please log in to view your bookings');
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle bookings subscription
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    console.log('Setting up bookings listener for user:', currentUser.uid);
    
    // Create query for user's bookings
    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', currentUser.uid),
      orderBy('date', 'desc')  // Show newest bookings first
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q, 
      (querySnapshot) => {
        console.log('Received bookings:', querySnapshot.size);
        const userBookings = querySnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Booking data:', { id: doc.id, ...data });
          return {
            id: doc.id,
            ...data,
            date: data.date // Ensure date is properly handled as Timestamp
          } as Booking;
        });

        console.log('Processed bookings:', userBookings);
        setBookings(userBookings);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error in bookings listener:', error);
        // Check if the error is about missing index
        if (error.message?.includes('index')) {
          setError('System is being set up. Please try again in a few minutes.');
          // Create a simpler query without ordering as fallback
          const fallbackQuery = query(
            collection(db, 'bookings'),
            where('userId', '==', currentUser.uid)
          );
          
          // Set up fallback listener
          const fallbackUnsubscribe = onSnapshot(
            fallbackQuery,
            (snapshot) => {
              const userBookings = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date
              })) as Booking[];
              
              // Sort bookings client-side
              userBookings.sort((a, b) => b.date.toMillis() - a.date.toMillis());
              
              setBookings(userBookings);
              setLoading(false);
              setError(null);
            },
            (fallbackError) => {
              console.error('Error in fallback listener:', fallbackError);
              setLoading(false);
              setError('Failed to load bookings. Please try again later.');
            }
          );
          
          return () => fallbackUnsubscribe();
        }
        
        setLoading(false);
        setError('Failed to load bookings');
        toast({
          title: 'Error',
          description: 'Failed to load bookings. Please try again later.',
          variant: 'destructive',
        });
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-red-500">Please log in to view and create bookings</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <UserBookingForm />
      
      <Card>
        <CardHeader>
          <CardTitle>Your Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No bookings found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => {
                  console.log('Rendering booking:', booking);
                  return (
                    <TableRow key={booking.id}>
                      <TableCell>
                        {booking.date instanceof Timestamp 
                          ? booking.date.toDate().toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : new Date(booking.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                      </TableCell>
                      <TableCell>{booking.time}</TableCell>
                      <TableCell>
                        {booking.userLabel && (
                          <ColorLabel
                            name={booking.userLabel}
                            color={booking.userLabelColor || '#808080'}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm ${
                          booking.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {booking.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm ${
                          booking.recurring === 'weekly'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.recurring === 'weekly' ? 'Recurring' : 'Single'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
