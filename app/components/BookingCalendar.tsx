'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/clientApp';
import { format, isSameDay } from 'date-fns';
import { Calendar } from './ui/calendar';
import { Button } from './ui/button';
import { Clock } from 'lucide-react';
import { BOOKING_TIMES, TimeString } from '../lib/constants';
import { cn } from '../lib/utils';
import { toast } from './ui/use-toast';
import ColorLabel from './ColorLabel';
import { createGoogleCalendarUrl } from '../lib/calendar-utils';

interface TimeOff {
  id: string;
  startDate: Timestamp;
  endDate: Timestamp;
  reason: string;
}

interface Booking {
  id: string;
  userId: string;
  userName: string;
  userLabel: string;
  userLabelColor: string;
  date: Timestamp;
  time: TimeString;
  status: 'confirmed' | 'cancelled' | 'pending';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface BookingCalendarProps {
  userData: {
    name: string;
    email: string;
    remainingBookings: number;
    userLabel?: string;
    labelColor?: string;
  };
  onRefresh?: () => void;
}

export default function BookingCalendar({ userData, onRefresh }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<TimeString | null>(null);
  const [timeOffPeriods, setTimeOffPeriods] = useState<TimeOff[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      if (!auth.currentUser) return;

      try {
        const q = query(
          collection(db, 'bookings'),
          where('userId', '==', auth.currentUser.uid)
        );
        const snapshot = await getDocs(q);
        const bookingsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Booking[];
        setBookings(bookingsData);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };

    fetchBookings();
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
    if (!selectedDate || !selectedTime || !auth.currentUser) {
      toast({
        title: "Error",
        description: "Please select a date and time for your booking",
        variant: "destructive",
      });
      return;
    }

    if (userData.remainingBookings <= 0) {
      toast({
        title: "Error",
        description: "You have no remaining bookings",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create new booking
      const newBooking = {
        userId: auth.currentUser.uid,
        userName: userData.name,
        userLabel: userData.userLabel || 'Client',
        userLabelColor: userData.labelColor || '#808080',
        date: Timestamp.fromDate(selectedDate),
        time: selectedTime,
        status: 'confirmed' as const,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await addDoc(collection(db, 'bookings'), newBooking);

      // Update user's remaining bookings
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        remainingBookings: userData.remainingBookings - 1
      });

      setSelectedTime(null);
      onRefresh?.();

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendar and Time Slots */}
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
                  disabled={loading || userData.remainingBookings <= 0}
                >
                  Book Session
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Bookings */}
      <div className="space-y-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Your Upcoming Bookings</h3>
            {bookings.length === 0 ? (
              <p className="text-muted-foreground">No upcoming bookings</p>
            ) : (
              <div className="space-y-4">
                {bookings
                  .filter(booking => {
                    const bookingDate = booking.date instanceof Timestamp ? booking.date.toDate() : new Date(booking.date);
                    return bookingDate >= new Date() && booking.status !== 'cancelled';
                  })
                  .sort((a, b) => {
                    const dateA = a.date instanceof Timestamp ? a.date.toDate() : new Date(a.date);
                    const dateB = b.date instanceof Timestamp ? b.date.toDate() : new Date(b.date);
                    return dateA.getTime() - dateB.getTime();
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
                      <div>
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
  );
}
