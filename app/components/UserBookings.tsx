'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp, getDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/clientApp';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import LoadingSpinner from './LoadingSpinner';
import { useToast } from './ui/use-toast';
import ColorLabel from './ColorLabel';
import { onAuthStateChanged } from 'firebase/auth';
import UserBookingForm from './UserBookingForm';
import { Button } from './ui/button';
import { Clock, X, Check, AlertCircle } from 'lucide-react';
import { createGoogleCalendarUrl } from '../lib/calendar-utils';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

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
  rescheduledTo?: string;
}

interface UserBookingsProps {
  showPast?: boolean;
}

export default function UserBookings({ showPast = false }: UserBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; remainingSessions?: number } | null>(null);
  const [bookingSettings, setBookingSettings] = useState<{ timeLimit: number; cancelTimeLimit: number }>({ timeLimit: 48, cancelTimeLimit: 24 });
  const [isSubmitting, setIsSubmitting] = useState(false);
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
              email: user.email || 'No email provided',
              remainingSessions: userDoc.data().remainingSessions
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
        } else {
          // Use default settings if no settings document exists
          setBookingSettings({
            timeLimit: 48,
            cancelTimeLimit: 24
          });
        }
      } catch (error) {
        console.error('Error fetching booking settings:', error);
        // Use default settings on error
        setBookingSettings({
          timeLimit: 48,
          cancelTimeLimit: 24
        });
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

  const handleCancelBooking = async (id: string) => {
    try {
      await updateDoc(doc(db, 'bookings', id), {
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

  const handleRescheduleBooking = async (id: string) => {
    try {
      setIsSubmitting(true);
      const bookingRef = doc(db, 'bookings', id);
      await updateDoc(bookingRef, {
        status: 'rescheduled',
        updatedAt: new Date()
      });
      
      toast({
        title: "Booking Rescheduled",
        description: "Please create a new booking for your preferred time.",
      });
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      toast({
        title: "Error",
        description: "Failed to reschedule booking",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold tracking-tight">My Bookings</h2>
            {userInfo && (
              <div className="text-sm text-gray-500">
                Remaining sessions: {userInfo.remainingSessions || 0}
              </div>
            )}
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No bookings found.</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => {
                    const bookingDate = booking.date.toDate();
                    const isUpcoming = bookingDate > new Date();
                    const isWithinTimeLimit = isUpcoming && 
                      (bookingDate.getTime() - new Date().getTime()) / (1000 * 60 * 60) > bookingSettings.cancelTimeLimit;

                    return (
                      <TableRow key={booking.id}>
                        <TableCell>
                          {format(bookingDate, 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>{booking.time}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {booking.status === 'confirmed' ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : booking.status === 'cancelled' ? (
                              <X className="w-4 h-4 text-red-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-yellow-500" />
                            )}
                            <span className={cn(
                              "capitalize",
                              booking.status === 'confirmed' && "text-green-600",
                              booking.status === 'cancelled' && "text-red-600",
                              booking.status === 'rescheduled' && "text-yellow-600"
                            )}>
                              {booking.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {booking.status === 'confirmed' && isUpcoming && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <a
                                    href={createGoogleCalendarUrl({
                                      title: 'Your Booking',
                                      description: `Booking with ${booking.userName}`,
                                      startTime: `${format(bookingDate, 'yyyy-MM-dd')}T${booking.time}`,
                                      duration: 60
                                    })}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Clock className="w-4 h-4 mr-1" />
                                    Add to Calendar
                                  </a>
                                </Button>
                                {isWithinTimeLimit && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleCancelBooking(booking.id)}
                                  >
                                    Cancel
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
