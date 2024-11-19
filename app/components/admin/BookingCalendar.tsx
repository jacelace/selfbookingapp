'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Calendar } from '../ui/calendar';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import type { EnhancedBooking } from '../../types/shared';
import ColorLabel from '../ColorLabel';
import { cn } from '../../lib/utils';
import { Timestamp } from 'firebase/firestore';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/clientApp';

interface BookingCalendarProps {
  bookings: EnhancedBooking[];
}

interface TimeOff {
  id: string;
  startDate: Timestamp;
  endDate: Timestamp;
  reason: string;
}

interface DayBookingsDialogProps {
  date: Date;
  bookings: EnhancedBooking[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const timeSlots = [
  '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM'
].map(time => time);

// Helper function to safely convert Timestamp to Date
const safeGetDate = (date: Timestamp | undefined): Date | null => {
  if (!date || !date.toDate) return null;
  try {
    return date.toDate();
  } catch (error) {
    console.error('Error converting timestamp to date:', error);
    return null;
  }
};

function DayBookingsDialog({ date, bookings, open, onOpenChange }: DayBookingsDialogProps) {
  // Filter bookings for the selected date
  const dayBookings = bookings.filter(booking => {
    const bookingDate = safeGetDate(booking.date);
    return bookingDate && isSameDay(bookingDate, date);
  }).sort((a, b) => {
    const timeA = timeSlots.indexOf(a.time);
    const timeB = timeSlots.indexOf(b.time);
    return timeA - timeB;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Bookings for {format(date, 'MMMM d, yyyy')}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-4 -mr-4">
          <div className="space-y-4 p-4">
            {timeSlots.map((timeSlot) => {
              const booking = dayBookings.find(b => b.time === timeSlot);
              return (
                <div
                  key={timeSlot}
                  className={cn(
                    "p-3 rounded-lg border",
                    booking ? "bg-secondary/50" : "bg-background"
                  )}
                >
                  <div className="font-medium">{timeSlot}</div>
                  {booking ? (
                    <div className="mt-1 space-y-1">
                      <div className="text-sm">{booking.userName}</div>
                      <ColorLabel color={booking.userLabelColor || '#808080'}>
                        {booking.userLabel || 'No Label'}
                      </ColorLabel>
                      <div className="text-xs text-muted-foreground">
                        {booking.recurring === 'weekly' ? 'Recurring' : 'One-time'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Available</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function BookingCalendar({ bookings }: BookingCalendarProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timeOffPeriods, setTimeOffPeriods] = useState<TimeOff[]>([]);

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

  // Check if a date is within any time-off period
  const isDateInTimeOff = (date: Date) => {
    return timeOffPeriods.some(period => {
      const start = period.startDate.toDate();
      const end = period.endDate.toDate();
      return date >= start && date <= end;
    });
  };

  // Get time-off reason for a date if it exists
  const getTimeOffReason = (date: Date) => {
    const period = timeOffPeriods.find(period => {
      const start = period.startDate.toDate();
      const end = period.endDate.toDate();
      return date >= start && date <= end;
    });
    return period?.reason;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date && !isDateInTimeOff(date)) {
      setSelectedDate(date);
      setIsDialogOpen(true);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between space-x-2 py-2">
        <Button
          variant="outline"
          className="w-10 h-10 p-0"
          onClick={() => setDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold">
          {format(date, 'MMMM yyyy')}
        </div>
        <Button
          variant="outline"
          className="w-10 h-10 p-0"
          onClick={() => setDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleDateSelect}
        month={date}
        modifiers={{
          timeoff: (date) => isDateInTimeOff(date),
          booked: (date) => bookings.some(booking => {
            const bookingDate = safeGetDate(booking.date);
            return bookingDate && isSameDay(bookingDate, date);
          })
        }}
        modifiersStyles={{
          timeoff: { backgroundColor: '#FEF3C7', color: '#92400E' },
          booked: { backgroundColor: '#DBEAFE', color: '#1E40AF' }
        }}
        components={{
          DayContent: ({ date }) => (
            <div className="relative w-full h-full flex items-center justify-center">
              <span>{format(date, 'd')}</span>
              {isDateInTimeOff(date) && (
                <div className="absolute bottom-0 left-0 right-0 text-[8px] text-amber-800 truncate px-1">
                  {getTimeOffReason(date)}
                </div>
              )}
            </div>
          )
        }}
      />

      <DayBookingsDialog
        date={selectedDate || new Date()}
        bookings={bookings}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
