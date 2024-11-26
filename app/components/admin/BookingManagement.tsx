'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { collection, Timestamp, doc, setDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseInit';
import { format, isSameDay } from 'date-fns';
import { cn } from '../../lib/utils';
import { EnhancedBooking, EnhancedUser, Label } from '../../types';
import { toast } from '../../components/ui/use-toast';
import { Calendar } from '../ui/calendar';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search, Clock, Check, X, AlertCircle } from 'lucide-react';
import { BOOKING_TIMES } from '../../lib/constants';
import ColorLabel from '../ColorLabel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface BookingManagementProps {
  users: EnhancedUser[];
  bookings: EnhancedBooking[];
  labels: Label[];
  onRefresh?: () => void;
}

const BookingManagement: React.FC<BookingManagementProps> = ({
  users,
  bookings,
  labels,
  onRefresh
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Function to handle booking updates
  const handleBookingUpdate = async (bookingId: string, updates: Partial<EnhancedBooking>) => {
    setIsLoading(true);
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      const booking = bookings.find(b => b.id === bookingId);
      const user = users.find(u => u.id === booking?.userId);
      
      if (!booking || !user) {
        throw new Error('Booking or user not found');
      }

      // If status is being updated
      if (updates.status) {
        const userRef = doc(db, 'users', user.id);
        const userUpdates: any = {};
        
        // Handle remaining bookings based on status
        if (updates.status === 'confirmed' && booking.status !== 'confirmed') {
          userUpdates.remainingBookings = (user.remainingBookings || 0) - 1;
        } else if (booking.status === 'confirmed' && updates.status !== 'confirmed') {
          userUpdates.remainingBookings = (user.remainingBookings || 0) + 1;
        }
        
        // Update user if needed
        if (Object.keys(userUpdates).length > 0) {
          await setDoc(userRef, userUpdates, { merge: true });
        }
      }

      // Update booking with timestamp
      const bookingUpdates = {
        ...updates,
        updatedAt: Timestamp.now()
      };
      
      await setDoc(bookingRef, bookingUpdates, { merge: true });
      onRefresh?.();
      
      toast({
        title: "Success",
        description: "Booking updated successfully",
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "Failed to update booking",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle adding a new booking
  const handleAddBooking = async () => {
    if (!selectedDate || !selectedTime || !selectedUserId) {
      toast({
        title: "Error",
        description: "Please select a date, time, and user",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const user = users.find(u => u.id === selectedUserId);
      if (!user) throw new Error('User not found');

      const newBooking = {
        userId: user.id,
        userName: user.name,
        userLabel: user.label || 'Client',
        userLabelColor: user.labelColor || '#808080',
        date: Timestamp.fromDate(selectedDate),
        time: selectedTime,
        status: 'confirmed',
        recurring: 'none',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await addDoc(collection(db, 'bookings'), newBooking);
      
      // Update user's remaining bookings
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, {
        remainingBookings: (user.remainingBookings || 0) - 1
      }, { merge: true });

      onRefresh?.();
      setSelectedTime(null);
      setSelectedUserId(null);
      
      toast({
        title: "Success",
        description: "Booking added successfully",
        variant: "default",
      });
    } catch (error) {
      console.error('Error adding booking:', error);
      toast({
        title: "Error",
        description: "Failed to add booking",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get bookings for selected date
  const selectedDateBookings = selectedDate
    ? bookings.filter(booking => {
        const bookingDate = booking.date instanceof Timestamp ? booking.date.toDate() : booking.date;
        return isSameDay(bookingDate, selectedDate);
      }).sort((a, b) => {
        const timeA = BOOKING_TIMES.indexOf(a.time);
        const timeB = BOOKING_TIMES.indexOf(b.time);
        return timeA - timeB;
      })
    : [];

  // Check if a time slot is booked
  const isTimeSlotBooked = (timeSlot: string) => {
    return selectedDateBookings.some(booking => booking.time === timeSlot);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Booking Management</h2>
        <Button onClick={() => onRefresh?.()} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Select Date</h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </div>
          </div>
        </div>

        {/* Time Slots and User Selection */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Available Time Slots</h3>
              {selectedDate ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {BOOKING_TIMES.map(time => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        className={cn(
                          "w-full",
                          isTimeSlotBooked(time) && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={isTimeSlotBooked(time)}
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Select User</h4>
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="mb-2"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {filteredUsers.map(user => (
                        <Button
                          key={user.id}
                          variant={selectedUserId === user.id ? "default" : "outline"}
                          className="w-full justify-start"
                          onClick={() => setSelectedUserId(user.id)}
                        >
                          <div className="flex items-center space-x-2">
                            <span>{user.name}</span>
                            <ColorLabel name={user.label || 'Client'} color={user.labelColor || '#808080'} />
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    disabled={!selectedTime || !selectedUserId || isLoading}
                    onClick={handleAddBooking}
                  >
                    Add Booking
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">Please select a date to view available time slots</p>
              )}
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">
                {selectedDate 
                  ? `Bookings for ${format(selectedDate, 'MMMM d, yyyy')}`
                  : 'All Bookings'
                }
              </h3>
              
              {selectedDateBookings.length > 0 ? (
                <div className="space-y-4">
                  {selectedDateBookings.map(booking => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{booking.time}</span>
                        </div>
                        <div className="mt-1">
                          <span className="text-sm text-muted-foreground">{booking.userName}</span>
                          <ColorLabel name={booking.userLabel} color={booking.userLabelColor} />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-sm",
                          booking.status === 'confirmed' ? "bg-green-100 text-green-800" :
                          booking.status === 'cancelled' ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"
                        )}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                        {booking.status === 'confirmed' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleBookingUpdate(booking.id, { status: 'cancelled' })}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  {selectedDate 
                    ? 'No bookings for this date'
                    : 'Please select a date to view bookings'
                  }
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingManagement;
