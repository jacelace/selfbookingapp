'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp, getDoc, doc, addDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/clientApp';
import LoadingSpinner from './LoadingSpinner';
import { useToast } from './ui/use-toast';
import ColorLabel from './ColorLabel';
import { onAuthStateChanged } from 'firebase/auth';
import { Button } from './ui/button';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';
import { createGoogleCalendarUrl } from '../lib/calendar-utils';
import { cn } from '../lib/utils';
import { format, isSameDay } from 'date-fns';
import { Calendar } from './ui/calendar';
import { BOOKING_TIMES, TimeString } from '../lib/constants';

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
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; remainingBookings?: number; userLabel?: string; labelColor?: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<TimeString | null>(null);
  const [timeOffPeriods, setTimeOffPeriods] = useState<TimeOff[]>([]);
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
              remainingBookings: userDoc.data().remainingBookings,
              userLabel: userDoc.data().userLabel,
              labelColor: userDoc.data().labelColor
            });
          }
        } catch (error) {
          console.error('Error fetching user info:', error);
        }
      } else {
        setLoading(false);
        setError('Please log in to view and make bookings');
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

  const isTimeSlotBooked = (date: Date, timeSlot: TimeString) => {
    return bookings.some(booking => {
      const bookingDate = booking.date instanceof Timestamp ? booking.date.toDate() : new Date(booking.date);
      return isSameDay(bookingDate, date) && booking.time === timeSlot && booking.status !== 'cancelled';
    });
  };

  const handleBookSession = async () => {
    if (!selectedDate || !selectedTime || !currentUser || !userInfo) {
      toast({
        title: "Error",
        description: "Please select a date and time for your booking",
        variant: "destructive",
      });
      return;
    }

    if (!userInfo.remainingBookings || userInfo.remainingBookings <= 0) {
      toast({
        title: "Error",
        description: "You have no remaining bookings available",
        variant: "destructive",
      });
      return;
    }

    try {
      const newBooking = {
        userId: currentUser.uid,
        userName: userInfo.name,
        userLabel: userInfo.userLabel || 'Client',
        userLabelColor: userInfo.labelColor || '#808080',
        date: Timestamp.fromDate(selectedDate),
        time: selectedTime,
        status: 'confirmed' as const,
        recurring: 'none' as const,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await addDoc(collection(db, 'bookings'), newBooking);

      // Update user's remaining bookings
      const userRef = doc(db, 'users', currentUser.uid);
      await getDoc(userRef).then(async (docSnap) => {
        if (docSnap.exists()) {
          const currentBookings = docSnap.data().remainingBookings || 0;
          await updateDoc(userRef, {
            remainingBookings: currentBookings - 1
          });
        }
      });

      setSelectedTime(null);
      toast({
        title: "Success",
        description: "Your session has been booked successfully",
      });
    } catch (error) {
      console.error('Error booking session:', error);
      toast({
        title: "Error",
        description: "Failed to book session. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Book a Session</h2>
          {userInfo?.remainingBookings !== undefined && (
            <p className="text-sm text-gray-500">
              Remaining bookings: {userInfo.remainingBookings}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar Section */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Select Date</h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={isDateDisabled}
                className="rounded-md border"
              />
            </div>
          </div>

          {selectedDate && (
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="p-6">
                <h3 className="text-lg font-medium mb-4">Available Time Slots</h3>
                <div className="grid grid-cols-2 gap-2">
                  {BOOKING_TIMES.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      className={cn(
                        "w-full",
                        isTimeSlotBooked(selectedDate, time) && "opacity-50 cursor-not-allowed"
                      )}
                      disabled={isTimeSlotBooked(selectedDate, time)}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>

                {selectedTime && (
                  <Button
                    className="w-full mt-4"
                    onClick={handleBookSession}
                    disabled={!userInfo?.remainingBookings || userInfo.remainingBookings <= 0}
                  >
                    Book Session
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Upcoming Bookings Section */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Upcoming Bookings</h3>
              {bookings.length === 0 ? (
                <p className="text-muted-foreground">No upcoming bookings</p>
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
                            <ColorLabel name={booking.userLabel} color={booking.userLabelColor} />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <a
                            href={createGoogleCalendarUrl({
                              date: booking.date,
                              time: booking.time,
                              title: 'Training Session',
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
    </div>
  );
}
