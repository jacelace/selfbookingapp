'use client';

import * as React from 'react';
import { useState } from 'react';
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

interface BookingCalendarProps {
  bookings: EnhancedBooking[];
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
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Get bookings for the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const monthBookings = bookings.filter(booking => {
    const bookingDate = safeGetDate(booking.date);
    return bookingDate && bookingDate >= monthStart && bookingDate <= monthEnd;
  });

  // Create a map of dates to booking counts
  const bookingCounts = monthBookings.reduce((acc, booking) => {
    const bookingDate = safeGetDate(booking.date);
    if (bookingDate) {
      const dateString = bookingDate.toDateString();
      acc[dateString] = (acc[dateString] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setDialogOpen(true);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Booking Calendar</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[130px] text-center font-medium">
              {format(currentMonth, 'MMMM yyyy')}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          month={currentMonth}
          className="rounded-md border"
          components={{
            DayContent: ({ date }) => {
              const count = bookingCounts[date.toDateString()];
              return (
                <div className="relative w-full h-full p-2">
                  <div className="absolute top-0 right-0 left-0 text-center">
                    {date.getDate()}
                  </div>
                  {count && (
                    <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                  )}
                </div>
              );
            },
          }}
        />
      </CardContent>
      {selectedDate && (
        <DayBookingsDialog
          date={selectedDate}
          bookings={bookings}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </Card>
  );
}
