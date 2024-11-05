'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import Link from "next/link";
import { CheckCircle2, Calendar } from "lucide-react";
import { auth, db } from "../../firebase/clientApp";
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import AddToGoogleCalendar from "../../components/AddToGoogleCalendar";
import LoadingSpinner from "../../components/LoadingSpinner";

interface Booking {
  date: { toDate: () => Date };
  slot: string;
  isRecurring: boolean;
  recurringGroupId?: string;
}

export default function SuccessPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!auth.currentUser) return;

      try {
        const bookingsRef = collection(db, 'bookings');
        const q = query(
          bookingsRef,
          where('userId', '==', auth.currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        );

        const querySnapshot = await getDocs(q);
        const fetchedBookings = querySnapshot.docs.map(doc => doc.data() as Booking);
        setBookings(fetchedBookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const isRecurringBooking = bookings.some(booking => booking.isRecurring);
  const bookingCount = bookings.length;

  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-700">Booking Successful!</CardTitle>
          <CardDescription>
            {isRecurringBooking 
              ? `${bookingCount} recurring appointments have been confirmed`
              : 'Your appointment has been confirmed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {bookings.map((booking, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">
                  {booking.date.toDate().toLocaleDateString()} at {booking.slot}
                </p>
                {booking.isRecurring && (
                  <p className="text-sm text-gray-600">Part of recurring series</p>
                )}
                <AddToGoogleCalendar
                  date={booking.date.toDate()}
                  slot={booking.slot}
                  className="mt-2"
                />
              </div>
            ))}
          </div>

          <p className="text-center text-gray-600">
            You will receive a confirmation email shortly with your appointment details.
          </p>

          <div className="flex justify-center space-x-4">
            <Link href="/booking">
              <Button variant="outline" size="lg">
                Book Another
              </Button>
            </Link>
            <Link href="/">
              <Button variant="default" size="lg">
                Return Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
