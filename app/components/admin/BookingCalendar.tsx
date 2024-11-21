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

const BookingCalendar: React.FC = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timeOffPeriods, setTimeOffPeriods] = useState<TimeOff[]>([]);
  const [bookings, setBookings] = useState<EnhancedBooking[]>([]);

  // Fetch time-off periods
  useEffect(() => {
    const fetchTimeOffPeriods = async () => {
      try {
        const timeOffSnapshot = await getDocs(collection(db, 'timeOff'));
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

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const bookingDate = safeGetDate(booking.date);
      return bookingDate && isSameDay(bookingDate, date);
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date && !isDateInTimeOff(date)) {
      setSelectedDate(date);
      setIsDialogOpen(true);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Booking Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            month={date}
            onMonthChange={setDate}
            className="rounded-md border w-full"
            classNames={{
              months: "space-y-4",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-14 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
              day: "h-14 w-14 p-0 font-normal aria-selected:opacity-100",
              day_range_end: "day-range-end",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
            components={{
              DayContent: ({ date: dayDate }) => {
                const dayBookings = getBookingsForDate(dayDate);
                const isTimeOff = isDateInTimeOff(dayDate);
                return (
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      {dayDate.getDate()}
                    </div>
                    {!isTimeOff && dayBookings.length > 0 && (
                      <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
                        {Array.from({ length: Math.min(dayBookings.length, 3) }).map((_, i) => (
                          <div
                            key={i}
                            className="w-1 h-1 rounded-full bg-primary"
                          />
                        ))}
                        {dayBookings.length > 3 && (
                          <div className="w-1 h-1 rounded-full bg-primary opacity-50" />
                        )}
                      </div>
                    )}
                    {isTimeOff && (
                      <div className="absolute inset-0 bg-destructive/20 rounded-md" />
                    )}
                  </div>
                );
              }
            }}
          />
        </div>
      </CardContent>
      <DayBookingsDialog
        date={selectedDate || new Date()}
        bookings={bookings}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </Card>
  );
}

export default BookingCalendar;
