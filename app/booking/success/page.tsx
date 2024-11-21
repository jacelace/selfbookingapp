'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import Link from "next/link";
import { CheckCircle2, Calendar, Clock, ArrowRight, Home } from "lucide-react";
import { auth, db } from "../../firebase/clientApp";
import { collection, query, where, getDocs, orderBy, limit, getDoc, doc } from 'firebase/firestore';
import AddToGoogleCalendar from "../../components/AddToGoogleCalendar";
import LoadingSpinner from "../../components/LoadingSpinner";

interface Booking {
  date: { toDate: () => Date };
  slot: string;
  isRecurring: boolean;
  recurringGroupId?: string;
  type: string;
  duration: string;
}

interface UserData {
  name: string;
  email: string;
  remainingBookings: number;
}

export default function SuccessPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;

      try {
        // Fetch user data
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        }

        // Fetch bookings
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
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const latestBooking = bookings[0];
  const isRecurringBooking = bookings.some(booking => booking.isRecurring);
  const bookingCount = bookings.length;

  return (
    <div className="container flex items-center justify-center min-h-screen py-10 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-6 pb-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-green-100 rounded-full"></div>
            </div>
            <div className="relative flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-green-700">
              Booking Confirmed!
            </CardTitle>
            <CardDescription className="text-lg">
              {userData?.name}, your {isRecurringBooking ? 'sessions have' : 'session has'} been successfully scheduled
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Latest Booking Details */}
          <div className="bg-gray-50 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold">Appointment Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">
                    {latestBooking.date.toDate().toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">{latestBooking.slot} ({latestBooking.duration})</p>
                </div>
              </div>
            </div>

            <AddToGoogleCalendar
              booking={{
                id: '',  
                userId: auth.currentUser?.uid || '',
                userName: userData?.name || '',
                userLabel: '',
                userLabelColor: '',
                date: latestBooking.date,
                time: latestBooking.slot,
                recurring: 'none',
                status: 'confirmed',
                createdAt: latestBooking.date,
                updatedAt: latestBooking.date
              }}
              className="w-full mt-4"
            />
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4 text-blue-800">
              <p className="text-sm">
                <span className="font-medium">Sessions Remaining: </span>
                {userData?.remainingBookings} {userData?.remainingBookings === 1 ? 'session' : 'sessions'}
              </p>
            </div>

            <p className="text-center text-gray-600">
              A confirmation email has been sent to {userData?.email}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
            <Link href="/booking">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Calendar className="w-4 h-4 mr-2" />
                Book Another Session
              </Button>
            </Link>
            <Link href="/">
              <Button variant="default" size="lg" className="w-full sm:w-auto">
                <Home className="w-4 h-4 mr-2" />
                Return Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
