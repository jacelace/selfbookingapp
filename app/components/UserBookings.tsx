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
import { Calendar as CalendarIcon, Clock, X, Check, AlertCircle } from 'lucide-react';
import { createGoogleCalendarUrl } from '../lib/calendar-utils';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <div className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
            <Check className="w-3 h-3 mr-1" />
            Confirmed
          </div>
        );
      case 'cancelled':
        return (
          <div className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
            <X className="w-3 h-3 mr-1" />
            Cancelled
          </div>
        );
      case 'rescheduled':
        return (
          <div className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            Rescheduled
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700">
            <AlertCircle className="w-3 h-3 mr-1" />
            {status}
          </div>
        );
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  const filteredBookings = bookings
    .filter(booking => {
      const bookingDate = booking.date.toDate();
      const now = new Date();
      return showPast ? bookingDate < now : bookingDate >= now;
    })
    .sort((a, b) => {
      const dateA = a.date.toDate();
      const dateB = b.date.toDate();
      return showPast ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
    });

  if (filteredBookings.length === 0) {
    return (
      <div className="text-center py-8">
        <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No bookings</h3>
        <p className="mt-1 text-sm text-gray-500">
          {showPast ? "You don't have any past sessions." : "Get started by creating a new booking."}
        </p>
        {!showPast && (
          <div className="mt-6">
            <UserBookingForm
              userId={currentUser?.uid}
              remainingSessions={userInfo?.remainingSessions || 0}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!showPast && (
        <UserBookingForm
          userId={currentUser?.uid}
          remainingSessions={userInfo?.remainingSessions || 0}
        />
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">
                  {format(booking.date.toDate(), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>{booking.time}</TableCell>
                <TableCell>{getStatusBadge(booking.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    {booking.status === 'confirmed' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(createGoogleCalendarUrl(booking), '_blank')}
                          className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 border-blue-200"
                        >
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          Add to Calendar
                        </Button>
                        {!showPast && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRescheduleBooking(booking.id)}
                              className="bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700 border-purple-200"
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Reschedule
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelBooking(booking.id)}
                              className="bg-gradient-to-r from-rose-50 to-rose-100 hover:from-rose-100 hover:to-rose-200 text-rose-700 border-rose-200"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
