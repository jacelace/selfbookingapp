'use client';

import React, { useState } from 'react';
import { addDoc, collection, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/clientApp';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Card } from './ui/card';
import { toast } from './ui/use-toast';
import { useRouter } from 'next/navigation';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

interface BookingFormProps {
  selectedDate: Date;
  selectedSlot: string;
  onCancel: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({
  selectedDate,
  selectedSlot,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringWeeks, setRecurringWeeks] = useState(4); // Default to 4 weeks
  const router = useRouter();

  const createRecurringBookings = async (userId: string, userData: any) => {
    const bookings = [];
    let currentDate = new Date(selectedDate);
    let remainingBookings = userData.remainingBookings;

    // Create bookings for the specified number of weeks
    for (let i = 0; i < recurringWeeks && remainingBookings > 0; i++) {
      const bookingData = {
        userId,
        date: new Date(currentDate),
        slot: selectedSlot,
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
        isRecurring: true,
        recurringGroupId: `${userId}-${currentDate.getTime()}-${selectedSlot}`,
      };

      bookings.push(bookingData);
      remainingBookings--;
      
      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7);
    }

    // Create all bookings
    const bookingRefs = await Promise.all(
      bookings.map(booking => addDoc(collection(db, 'bookings'), booking))
    );

    // Update user's remaining bookings
    await updateDoc(doc(db, 'users', userId), {
      remainingBookings,
      totalBookings: (userData.totalBookings || 0) + bookings.length,
      lastBooking: {
        id: bookingRefs[0].id,
        date: selectedDate,
        slot: selectedSlot,
        status: 'confirmed',
        isRecurring: true,
      },
    });

    return bookingRefs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      toast({
        title: 'Error',
        description: 'You must be logged in to book',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Check user's booking privileges and remaining sessions
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      if (!userData?.isApproved) {
        throw new Error('Your account is not approved for booking');
      }

      if (userData.remainingBookings <= 0) {
        throw new Error('You have no remaining booking sessions');
      }

      // Check if user has enough remaining sessions for recurring bookings
      if (isRecurring && userData.remainingBookings < recurringWeeks) {
        throw new Error(`You need at least ${recurringWeeks} remaining sessions for recurring bookings`);
      }

      if (isRecurring) {
        // Handle recurring bookings
        await createRecurringBookings(auth.currentUser.uid, userData);
        toast({
          title: 'Success',
          description: `Created ${recurringWeeks} recurring bookings successfully`,
        });
      } else {
        // Create single booking
        const bookingData = {
          userId: auth.currentUser.uid,
          date: selectedDate,
          slot: selectedSlot,
          status: 'confirmed',
          createdAt: new Date(),
          updatedAt: new Date(),
          isRecurring: false,
        };

        const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);

        // Update user's remaining bookings and store last booking details
        await updateDoc(userRef, {
          remainingBookings: userData.remainingBookings - 1,
          totalBookings: (userData.totalBookings || 0) + 1,
          lastBooking: {
            id: bookingRef.id,
            date: selectedDate,
            slot: selectedSlot,
            status: 'confirmed',
            isRecurring: false,
          },
        });

        toast({
          title: 'Success',
          description: 'Booking created successfully',
        });
      }
      
      router.push('/booking/success');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create booking',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Confirm Booking</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="font-medium">Selected Date:</p>
          <p>{selectedDate.toLocaleDateString()}</p>
        </div>
        <div>
          <p className="font-medium">Selected Time:</p>
          <p>{selectedSlot}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="recurring"
            checked={isRecurring}
            onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
          />
          <Label htmlFor="recurring">Make this a recurring weekly booking</Label>
        </div>

        {isRecurring && (
          <div className="flex items-center space-x-2">
            <Label htmlFor="weeks">Number of weeks:</Label>
            <select
              id="weeks"
              value={recurringWeeks}
              onChange={(e) => setRecurringWeeks(Number(e.target.value))}
              className="border rounded p-1"
            >
              {[2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>{num} weeks</option>
              ))}
            </select>
          </div>
        )}
        
        <div className="flex gap-4">
          <Button
            type="submit"
            variant="enhanced"
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Confirming...' : 'Confirm Booking'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default BookingForm;
