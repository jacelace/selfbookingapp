import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseInit';
import { BOOKING_TIMES, TimeString } from '../lib/constants';
import { Calendar } from './ui/calendar';
import { format, isSameDay } from 'date-fns';
import { cn } from '../lib/utils';

interface TimeSlotSelectorProps {
  selectedDate: Date | null;
  onTimeSelect: (time: TimeString | null) => void;
  selectedTime: TimeString | null;
  onDateSelect?: (date: Date | null) => void;
}

function DayWithBookings({ date, bookedDates }: { date: Date; bookedDates: Date[] }) {
  const hasBookings = bookedDates.some(bookedDate => isSameDay(bookedDate, date));

  return (
    <div className="relative">
      <div>{date.getDate()}</div>
      {hasBookings && (
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
        </div>
      )}
    </div>
  );
}

export default function TimeSlotSelector({
  selectedDate,
  onTimeSelect,
  selectedTime,
  onDateSelect,
}: TimeSlotSelectorProps) {
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  useEffect(() => {
    async function fetchBookedSlots() {
      if (!selectedDate) return;

      setLoading(true);
      setError(null);
      try {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const bookingsRef = collection(db, 'bookings');
        const q = query(
          bookingsRef,
          where('date', '>=', startOfDay),
          where('date', '<=', endOfDay)
        );

        const querySnapshot = await getDocs(q);
        const booked = querySnapshot.docs.map(doc => {
          const data = doc.data();
          if (data.time) return data.time;
          return new Date(data.date.seconds * 1000).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }).toUpperCase();
        });

        setBookedSlots(booked.filter(Boolean));
      } catch (err) {
        console.error('Error fetching booked slots:', err);
        setError('Failed to load booked time slots');
      } finally {
        setLoading(false);
      }
    }

    fetchBookedSlots();
  }, [selectedDate]);

  useEffect(() => {
    async function fetchBookedDates() {
      setLoading(true);
      setError(null);
      try {
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        const bookingsRef = collection(db, 'bookings');
        const q = query(
          bookingsRef,
          where('date', '>=', startOfMonth),
          where('date', '<=', endOfMonth)
        );

        const querySnapshot = await getDocs(q);
        const dates = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return new Date(data.date.seconds * 1000);
        });

        setBookedDates(dates);
      } catch (err) {
        console.error('Error fetching booked dates:', err);
        setError('Failed to load booked dates');
      } finally {
        setLoading(false);
      }
    }

    fetchBookedDates();
  }, [currentMonth]);

  return (
    <div className="space-y-6">
      <div className="rounded-md border">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          className="rounded-md"
          components={{
            Day: ({ date }) => <DayWithBookings date={date} bookedDates={bookedDates} />
          }}
          onMonthChange={setCurrentMonth}
        />
      </div>

      {selectedDate && (
        <div className="space-y-4">
          <h3 className="font-medium">Available Time Slots for {format(selectedDate, 'MMMM d, yyyy')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {BOOKING_TIMES.map((time) => {
              const isBooked = bookedSlots.includes(time);
              return (
                <button
                  key={time}
                  onClick={() => !isBooked && onTimeSelect(time)}
                  disabled={isBooked}
                  className={cn(
                    "p-2 text-sm rounded-md border transition-colors",
                    selectedTime === time
                      ? "bg-primary text-primary-foreground"
                      : isBooked
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "hover:bg-accent"
                  )}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
