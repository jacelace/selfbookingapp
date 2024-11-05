'use client';

import { useState } from 'react';
import { addDoc, collection, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/clientApp';
import BookingCalendar from '../components/BookingCalendar';
import { toast } from '../components/ui/use-toast';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../components/LoadingSpinner';

interface RecurringBookingInfo {
  isRecurring: boolean;
  weeks: number;
}

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("10:00 AM");
  const [recurringInfo, setRecurringInfo] = useState<RecurringBookingInfo>({
    isRecurring: false,
    weeks: 4
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const createRecurringBookings = async (userId: string, userData: any) => {
    const bookings = [];
    let currentDate = new Date(selectedDate!);
    let remainingBookings = userData.remainingBookings;

    // Create bookings for the specified number of weeks
    for (let i = 0; i < recurringInfo.weeks && remainingBookings > 0; i++) {
      const bookingData = {
        userId,
        date: new Date(currentDate),
        slot: selectedTime,
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
        isRecurring: true,
        recurringGroupId: `${userId}-${currentDate.getTime()}-${selectedTime}`,
      };

      bookings.push(bookingData);
      remainingBookings--;
      
      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7);
    }

    try {
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
          slot: selectedTime,
          status: 'confirmed',
          isRecurring: true,
        },
      });

      return bookings.length;
    } catch (error) {
      console.error('Error creating recurring bookings:', error);
      throw new Error('Failed to create recurring bookings');
    }
  };

  const handleBookingSubmit = async () => {
    if (!auth.currentUser || !selectedDate) {
      toast({
        title: 'Error',
        description: 'Please sign in and select a date',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

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
      if (recurringInfo.isRecurring && userData.remainingBookings < recurringInfo.weeks) {
        throw new Error(`You need at least ${recurringInfo.weeks} remaining sessions for recurring bookings`);
      }

      let bookingsCreated = 0;

      if (recurringInfo.isRecurring) {
        // Handle recurring bookings
        bookingsCreated = await createRecurringBookings(auth.currentUser.uid, userData);
        toast({
          title: 'Success',
          description: `Created ${bookingsCreated} recurring bookings successfully`,
        });
      } else {
        // Create single booking
        const bookingData = {
          userId: auth.currentUser.uid,
          date: selectedDate,
          slot: selectedTime,
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
            slot: selectedTime,
            status: 'confirmed',
            isRecurring: false,
          },
        });

        bookingsCreated = 1;
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
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size={32} />
          <p className="mt-4 text-lg text-gray-600">Creating your booking{recurringInfo.isRecurring ? 's' : ''}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <BookingCalendar
        onDateSelect={handleDateSelect}
        onTimeSelect={handleTimeSelect}
        onBookingSubmit={handleBookingSubmit}
        onRecurringChange={(isRecurring, weeks) => 
          setRecurringInfo({ isRecurring, weeks })
        }
      />
    </div>
  );
}
