'use client';

import * as React from 'react';
import { useState } from 'react';
import { Calendar } from '../ui/calendar';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { collection, addDoc, updateDoc, Timestamp, doc } from 'firebase/firestore';
import { db, auth } from '../../firebase/clientApp';
import type { EnhancedBooking, EnhancedUser, TimeString, BookingStatus } from '../../types/shared';
import LoadingSpinner from '../LoadingSpinner';
import { TEST_CREDENTIALS } from '../../lib/constants';

const availableTimes: TimeString[] = [
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM'
];

interface BookingManagementProps {
  users: EnhancedUser[];
  bookings: EnhancedBooking[];
  setBookings: React.Dispatch<React.SetStateAction<EnhancedBooking[]>>;
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
}

// Helper function to format dates
const formatDate = (date: Date | Timestamp | string) => {
  if (date instanceof Timestamp) {
    return date.toDate().toLocaleDateString();
  }
  if (date instanceof Date) {
    return date.toLocaleDateString();
  }
  return new Date(date).toLocaleDateString();
};

export const BookingManagement: React.FC<BookingManagementProps> = ({
  users,
  bookings,
  setBookings,
  isSubmitting,
  setIsSubmitting
}) => {
  // States
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<TimeString | ''>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  const handleAddBooking = async (userId: string) => {
    if (!selectedTime) {
      setError('Please select a time');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.email !== TEST_CREDENTIALS.email) {
        throw new Error('Unauthorized: Only admins can add bookings');
      }

      const user = users.find(u => u.id === userId);
      if (!user) throw new Error('User not found');

      // Check if user has remaining sessions
      if (user.remainingBookings <= 0) {
        throw new Error('User has no remaining booking sessions');
      }

      const now = Timestamp.now();
      const newBooking: Omit<EnhancedBooking, 'id'> = {
        userId,
        userName: user.name,
        userLabel: user.userLabel,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        recurring: isRecurring ? 'weekly' : 'none',
        recurringCount: isRecurring ? 1 : undefined,
        status: 'confirmed',
        createdAt: now,
        updatedAt: now,
        createdBy: currentUser.uid
      };

      // Create the booking
      const docRef = await addDoc(collection(db, 'bookings'), newBooking);
      const bookingWithId = { ...newBooking, id: docRef.id };
      
      // Update user's booking information
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        remainingBookings: user.remainingBookings - 1,
        totalBookings: (user.totalBookings || 0) + 1,
        lastBooking: {
          id: docRef.id,
          date: selectedDate,
          time: selectedTime,
          status: 'confirmed',
          isRecurring: isRecurring
        },
        updatedAt: now
      });

      // Update local state
      setBookings(prev => [...prev, bookingWithId]);
      setSelectedTime('');
      setIsRecurring(false);

      console.log('Booking added successfully:', bookingWithId);
    } catch (err) {
      console.error('Error adding booking:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add booking. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBooking = async (bookingId: string, userId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.email !== TEST_CREDENTIALS.email) {
        throw new Error('Unauthorized: Only admins can cancel bookings');
      }

      const user = users.find(u => u.id === userId);
      if (!user) throw new Error('User not found');

      const now = Timestamp.now();
      
      // Update booking status
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: 'cancelled',
        updatedAt: now,
        cancelledBy: currentUser.uid,
        cancelledAt: now
      });

      // Refund the user's booking session
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        remainingBookings: user.remainingBookings + 1,
        updatedAt: now
      });

      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'cancelled' }
          : booking
      ));

      console.log('Booking cancelled successfully');
    } catch (err) {
      console.error('Error cancelling booking:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to cancel booking. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBookings = bookings.filter(booking => 
    filterStatus === 'all' || booking.status === filterStatus
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </div>

          <div>
            <Select value={selectedTime} onValueChange={(value) => setSelectedTime(value as TimeString)}>
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {availableTimes.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="recurring"
              checked={isRecurring}
              onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
            />
            <label htmlFor="recurring">Recurring weekly</label>
          </div>

          {error && <p className="text-red-500">{error}</p>}

          <div>
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as BookingStatus | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.userName}</TableCell>
                    <TableCell>{formatDate(booking.date)}</TableCell>
                    <TableCell>{booking.time}</TableCell>
                    <TableCell>{booking.status}</TableCell>
                    <TableCell>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddBooking(booking.userId)}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? <LoadingSpinner /> : 'Book Again'}
                        </Button>
                        {booking.status === 'confirmed' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelBooking(booking.id, booking.userId)}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
