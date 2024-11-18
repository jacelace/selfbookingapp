'use client';

import { useState } from 'react';
import { Calendar } from './ui/calendar';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { collection, addDoc, updateDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/clientApp';
import type { TimeString, RecurringOption } from '../types/shared';
import LoadingSpinner from './LoadingSpinner';
import { useToast } from './ui/use-toast';

const timeSlots: TimeString[] = [
  '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM'
];

export default function UserBookingForm() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<TimeString | ''>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCreateBooking = async () => {
    if (!selectedTime) {
      setError('Please select a time');
      return;
    }

    if (!selectedDate) {
      setError('Please select a date');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError('You must be logged in to create a booking');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get user data to check remaining bookings
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      if (!userData) {
        throw new Error('User data not found');
      }

      if (userData.remainingBookings <= 0) {
        throw new Error('You have no remaining booking sessions');
      }

      const now = Timestamp.now();
      const newBooking = {
        userId: currentUser.uid,
        userName: userData.name || '',
        userLabel: userData.userLabel || '',
        userLabelColor: userData.labelColor || '#808080',
        date: Timestamp.fromDate(selectedDate),
        time: selectedTime,
        recurring: isRecurring ? 'weekly' as RecurringOption : 'none' as RecurringOption,
        ...(isRecurring && { recurringCount: 1 }),
        status: 'confirmed' as const,
        createdAt: now,
        updatedAt: now,
        createdBy: currentUser.uid
      };

      // Create the booking
      const docRef = await addDoc(collection(db, 'bookings'), newBooking);
      console.log('Created booking with ID:', docRef.id);

      // Update user's remaining bookings
      await updateDoc(userRef, {
        remainingBookings: userData.remainingBookings - 1,
        totalBookings: (userData.totalBookings || 0) + 1,
      });

      // Reset form
      setSelectedTime('');
      setIsRecurring(false);
      setSelectedDate(new Date()); // Reset date to today

      toast({
        title: 'Success',
        description: 'Booking created successfully',
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      setError(error instanceof Error ? error.message : 'Failed to create booking');
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create booking',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3); // Allow booking up to 3 months in advance

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Booking</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Date Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Date</label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
              disabled={(date) => 
                date < today || 
                date > maxDate || 
                date.getDay() === 0 || // Sunday
                date.getDay() === 6    // Saturday
              }
            />
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Time</label>
            <Select value={selectedTime} onValueChange={(value) => setSelectedTime(value as TimeString)}>
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recurring Option */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
              />
              <label htmlFor="recurring" className="text-sm font-medium">
                Make it recurring (weekly)
              </label>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <Button
            onClick={handleCreateBooking}
            disabled={loading || !selectedTime || !selectedDate}
            className="w-full"
          >
            {loading ? <LoadingSpinner /> : 'Create Booking'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
