'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp, getDoc, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase/clientApp';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import LoadingSpinner from './LoadingSpinner';
import { useToast } from './ui/use-toast';
import ColorLabel from './ColorLabel';
import { onAuthStateChanged } from 'firebase/auth';
import { Button } from './ui/button';
import { Clock, X, Check, AlertCircle, Calendar as CalendarIcon, Search } from 'lucide-react';
import { createGoogleCalendarUrl } from '../lib/calendar-utils';
import { cn } from '../lib/utils';
import { format, isSameDay } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { BOOKING_TIMES, TimeString } from '../lib/constants';
import { Calendar } from './ui/calendar';

interface Booking {
  id: string;
  userId: string;
  userName: string;
  userLabel: string;
  userLabelColor: string;
  date: Timestamp;
  time: TimeString;
  recurring: 'none' | 'weekly';
  recurringCount?: number;
  status: 'confirmed' | 'cancelled' | 'rescheduled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  rescheduledTo?: string;
}

interface TimeOff {
  id: string;
  startDate: Timestamp;
  endDate: Timestamp;
  reason: string;
}

export default function UserBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; remainingSessions?: number } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeOffPeriods, setTimeOffPeriods] = useState<TimeOff[]>([]);
  const [showDayDialog, setShowDayDialog] = useState(false);
  const { toast } = useToast();

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
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

  // Fetch bookings
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', currentUser.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const bookingsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[];
      setBookings(bookingsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch time-off periods
  useEffect(() => {
    const fetchTimeOffPeriods = async () => {
      try {
        const timeOffSnapshot = await getDocs(collection(db, 'timeoff'));
        const periods = timeOffSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TimeOff[];
        setTimeOffPeriods(periods);
      } catch (error) {
        console.error('Error fetching time-off periods:', error);
      }
    };

    fetchTimeOffPeriods();
  }, []);

  const isDateInTimeOff = (date: Date) => {
    return timeOffPeriods.some(period => {
      const start = period.startDate.toDate();
      const end = period.endDate.toDate();
      return date >= start && date <= end;
    });
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    return date < today || isWeekend || isDateInTimeOff(date);
  };

  const getDayBookings = (date: Date) => {
    return bookings.filter(booking => {
      const bookingDate = booking.date instanceof Timestamp ? booking.date.toDate() : booking.date;
      return isSameDay(bookingDate, date);
    }).sort((a, b) => {
      const timeA = BOOKING_TIMES.indexOf(a.time);
      const timeB = BOOKING_TIMES.indexOf(b.time);
      return timeA - timeB;
    });
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">My Bookings</h2>
          {userInfo?.remainingSessions !== undefined && (
            <p className="text-sm text-gray-500">
              Remaining sessions: {userInfo.remainingSessions}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date: Date | null) => setSelectedDate(date)}
                disabled={isDateDisabled}
                className="rounded-md border"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Upcoming Bookings</h3>
              {bookings.length === 0 ? (
                <p className="text-gray-500">No bookings found</p>
              ) : (
                <div className="space-y-4">
                  {bookings
                    .filter(booking => {
                      const bookingDate = booking.date instanceof Timestamp ? booking.date.toDate() : new Date(booking.date);
                      return bookingDate >= new Date() && booking.status !== 'cancelled';
                    })
                    .map(booking => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              {format(booking.date instanceof Timestamp ? booking.date.toDate() : new Date(booking.date), 'PPP')}
                              {' at '}
                              {booking.time}
                            </span>
                          </div>
                          <div className="mt-1">
                            <ColorLabel color={booking.userLabelColor} text={booking.userLabel} />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <a
                            href={createGoogleCalendarUrl({
                              date: booking.date,
                              time: booking.time,
                              title: `Training Session`,
                              description: `Training session with ${booking.userName}`
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Add to Calendar
                          </a>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showDayDialog} onOpenChange={setShowDayDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && `Bookings for ${format(selectedDate, 'MMMM d, yyyy')}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDate && getDayBookings(selectedDate).map(booking => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center space-x-4">
                  <Clock className="w-4 h-4" />
                  <span>{booking.time}</span>
                  <ColorLabel color={booking.userLabelColor} text={booking.userLabel} />
                </div>
                <div className="flex items-center space-x-2">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-sm",
                    booking.status === 'confirmed' ? "bg-green-100 text-green-800" :
                    booking.status === 'cancelled' ? "bg-red-100 text-red-800" :
                    "bg-yellow-100 text-yellow-800"
                  )}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
            {selectedDate && getDayBookings(selectedDate).length === 0 && (
              <p className="text-gray-500 text-center py-4">No bookings for this date</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
