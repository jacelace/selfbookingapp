'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseInit';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button';
import BookingCalendar from './BookingCalendar';

interface UserBookingFormProps {
  userId: string;
  remainingSessions: number;
  userData: {
    name: string;
    email: string;
    remainingBookings: number;
    userLabel?: string;
    labelColor?: string;
  };
}

export default function UserBookingForm({ userId, remainingSessions, userData }: UserBookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const refreshUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        // You might want to update the parent component's state here
        // or handle the refresh in a different way
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Book Your Session</h2>
        <BookingCalendar
          userData={userData}
          onRefresh={refreshUserData}
        />
      </div>

      {remainingSessions <= 0 && (
        <p className="text-red-500">
          You have no remaining sessions. Please purchase more sessions to book appointments.
        </p>
      )}
    </div>
  );
}
