'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp, getDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/clientApp';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import LoadingSpinner from './LoadingSpinner';
import { useToast } from './ui/use-toast';
import ColorLabel from './ColorLabel';
import { onAuthStateChanged } from 'firebase/auth';
import UserBookingForm from './UserBookingForm';
import { Button } from './ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { createGoogleCalendarUrl } from '../lib/calendar-utils';
import { cn } from '../lib/utils';

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
  status: 'confirmed' | 'cancelled' | 'rescheduled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  rescheduledTo?: string; // Reference to the new booking ID
}

export default function UserBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null);
  const [bookingSettings, setBookingSettings] = useState<{ timeLimit: number; cancelTimeLimit: number }>({ timeLimit: 48, cancelTimeLimit: 24 });
  const { toast } = useToast();

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? `User ${user.uid}` : 'No user');
      setCurrentUser(user);
      if (user) {
        // Fetch user info from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserInfo({
              name: userDoc.data().name || user.displayName || 'User',
              email: user.email || 'No email provided'
            });
          }
        } catch (error) {
          console.error('Error fetching user info:', error);
        }
      } else {
        setLoading(false);
        setError('Please log in to view your bookings');
        setUserInfo(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch booking settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'booking'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setBookingSettings({
            timeLimit: data.timeLimit || 48,
            cancelTimeLimit: data.cancelTimeLimit || 24
          });
        }
      } catch (error) {
        console.error('Error fetching booking settings:', error);
      }
    };

    fetchSettings();
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
      orderBy('date', 'desc')  // Sort by date as a fallback
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
            date: data.date
          } as Booking;
        });

        // Sort bookings with custom logic
        const sortedBookings = [...userBookings].sort((a, b) => {
          // First, sort by status (rescheduled bookings stay at top)
          if (a.status === 'rescheduled' && b.status !== 'rescheduled') return -1;
          if (a.status !== 'rescheduled' && b.status === 'rescheduled') return 1;
          
          // Then sort by date (newest first)
          const dateA = a.date instanceof Timestamp ? a.date.toDate() : new Date(a.date);
          const dateB = b.date instanceof Timestamp ? b.date.toDate() : new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });

        console.log('Processed bookings:', sortedBookings);
        setBookings(sortedBookings);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error in bookings listener:', error);
        setLoading(false);
        setError('Failed to load bookings');
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const isWithinTimeLimit = (booking: Booking, limitHours: number) => {
    const bookingDate = booking.date instanceof Timestamp ? booking.date.toDate() : new Date(booking.date);
    const now = new Date();
    const hoursDifference = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDifference >= limitHours;
  };

  const handleCancel = async (booking: Booking) => {
    if (!isWithinTimeLimit(booking, bookingSettings.cancelTimeLimit)) {
      toast({
        title: "Cannot Cancel Booking",
        description: `Bookings can only be cancelled ${bookingSettings.cancelTimeLimit} hours or more before the appointment.`,
        variant: "destructive"
      });
      return;
    }

    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: 'cancelled',
        updatedAt: new Date()
      });

      toast({
        title: "Booking Cancelled",
        description: "Your booking has been successfully cancelled.",
      });
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReschedule = async (booking: Booking) => {
    if (!isWithinTimeLimit(booking, bookingSettings.timeLimit)) {
      toast({
        title: "Cannot Reschedule",
        description: `Bookings can only be rescheduled ${bookingSettings.timeLimit} hours or more before the appointment.`,
        variant: "destructive"
      });
      return;
    }

    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: 'rescheduled',
        updatedAt: new Date()
      });

      toast({
        title: "Booking Ready for Reschedule",
        description: "Please use the booking form above to create your new booking.",
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: "Error",
        description: "Failed to prepare booking for rescheduling. Please try again.",
        variant: "destructive"
      });
    }
  };

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
      {userInfo && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome Back!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-center">
              <p className="text-xl font-medium">{userInfo.name}</p>
              <p className="text-sm text-muted-foreground">{userInfo.email}</p>
            </div>
          </CardContent>
        </Card>
      )}
      {error ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-500">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <UserBookingForm />
      )}
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => {
                  console.log('Rendering booking:', booking);
                  return (
                    <TableRow 
                      key={booking.id}
                      className={cn(
                        booking.status === 'rescheduled' && "line-through opacity-50",
                        booking.status === 'cancelled' && "opacity-50"
                      )}
                    >
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
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          booking.status === 'confirmed' && "bg-green-100 text-green-800",
                          booking.status === 'cancelled' && "bg-red-100 text-red-800",
                          booking.status === 'rescheduled' && "bg-yellow-100 text-yellow-800"
                        )}>
                          {booking.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm ${
                          booking.recurring === 'weekly'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.recurring === 'weekly' ? 'Weekly' : 'One-time'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {booking.status === 'confirmed' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReschedule(booking)}
                                disabled={!isWithinTimeLimit(booking, bookingSettings.timeLimit)}
                              >
                                Reschedule
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleCancel(booking)}
                                disabled={!isWithinTimeLimit(booking, bookingSettings.cancelTimeLimit)}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {booking.status !== 'cancelled' && booking.status !== 'rescheduled' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(createGoogleCalendarUrl(booking), '_blank')}
                            >
                              <CalendarIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
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
