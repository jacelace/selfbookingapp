import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/firebaseInit';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button';
import BookingCalendar from './BookingCalendar';
import TimeSlotSelector from './TimeSlotSelector';
import { TimeString } from '../lib/constants';

interface UserBookingFormProps {
  userId: string;
  remainingSessions: number;
}

export default function UserBookingForm({ userId, remainingSessions }: UserBookingFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<TimeString | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime || remainingSessions <= 0) {
      toast({
        title: 'Error',
        description: 'Please select both a date and time. Also ensure you have remaining sessions.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingDate = new Date(selectedDate);
      const [hours, minutes] = selectedTime.match(/\d+/g)!;
      const isPM = selectedTime.includes('PM');
      
      let hour = parseInt(hours);
      if (isPM && hour !== 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
      
      bookingDate.setHours(hour, parseInt(minutes), 0, 0);

      await addDoc(collection(db, 'bookings'), {
        userId,
        date: bookingDate,
        time: selectedTime,
        status: 'confirmed',
        createdAt: new Date(),
      });

      toast({
        title: 'Success',
        description: 'Your booking has been confirmed!',
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to create booking. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Select Date</h2>
        <BookingCalendar
          mode="single"
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
          className="rounded-md border"
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Select Time</h2>
        <TimeSlotSelector
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onTimeSelect={setSelectedTime}
        />
      </div>

      {remainingSessions <= 0 && (
        <p className="text-red-500">
          You have no remaining sessions. Please purchase more sessions to book appointments.
        </p>
      )}

      <Button
        type="submit"
        disabled={!selectedDate || !selectedTime || remainingSessions <= 0 || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Creating Booking...' : 'Confirm Booking'}
      </Button>
    </form>
  );
}
