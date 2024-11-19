'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Calendar } from '../ui/calendar';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { collection, addDoc, updateDoc, Timestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/clientApp';
import type { EnhancedBooking, EnhancedUser, TimeString, BookingStatus, Label as LabelType } from '../../types/shared';
import LoadingSpinner from '../LoadingSpinner';
import { TEST_CREDENTIALS } from '../../lib/constants';
import { toast } from '../ui/use-toast';
import ColorLabel from '../ColorLabel';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

const timeSlots: TimeString[] = [
  '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM'
];

interface BookingManagementProps {
  users: EnhancedUser[];
  bookings: EnhancedBooking[];
  labels: LabelType[];
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
  labels,
  setBookings,
  isSubmitting,
  setIsSubmitting
}) => {
  // States
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<TimeString | ''>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);
  
  // Booking Settings states
  const [bookingTimeLimit, setBookingTimeLimit] = useState<number>(48);
  const [cancelTimeLimit, setCancelTimeLimit] = useState<number>(24);
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);

  // Fetch booking settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'booking'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setBookingTimeLimit(data.timeLimit || 48);
          setCancelTimeLimit(data.cancelTimeLimit || 24);
        }
      } catch (error) {
        console.error('Error fetching booking settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load booking settings',
          variant: 'destructive',
        });
      }
    };

    fetchSettings();
  }, []);

  // Handle settings update
  const handleSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingsLoading(true);

    try {
      await setDoc(doc(db, 'settings', 'booking'), {
        timeLimit: bookingTimeLimit,
        cancelTimeLimit: cancelTimeLimit,
        updatedAt: new Date(),
      });

      toast({
        title: 'Success',
        description: 'Booking settings updated successfully',
      });
    } catch (error) {
      console.error('Error updating booking settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update booking settings',
        variant: 'destructive',
      });
    } finally {
      setIsSettingsLoading(false);
    }
  };

  const handleAddBooking = async () => {
    if (!selectedTime) {
      setError('Please select a time');
      return;
    }

    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.email !== TEST_CREDENTIALS.email) {
        throw new Error('Unauthorized: Only admins can add bookings');
      }

      const user = users.find(u => u.id === selectedUser);
      if (!user) throw new Error('User not found');

      // Get user's label
      const userLabel = labels.find(l => l.id === user.labelId);

      // Check if user has remaining sessions
      if (user.remainingBookings <= 0) {
        throw new Error('User has no remaining booking sessions');
      }

      const now = Timestamp.now();
      console.log('Creating booking for user:', {
        userId: selectedUser,
        userName: user.name,
        currentUser: currentUser.uid
      });

      const newBooking: Omit<EnhancedBooking, 'id'> = {
        userId: selectedUser,
        userName: user.name || '',
        userLabel: userLabel?.name || '',
        userLabelColor: userLabel?.color || '#808080',
        date: Timestamp.fromDate(selectedDate),
        time: selectedTime as TimeString,
        recurring: isRecurring ? 'weekly' : 'none',
        ...(isRecurring && { recurringCount: 1 }),
        status: 'confirmed',
        createdAt: now,
        updatedAt: now,
        createdBy: currentUser.uid
      };

      console.log('New booking data:', newBooking);

      // Create the booking
      const docRef = await addDoc(collection(db, 'bookings'), newBooking);
      console.log('Created booking with ID:', docRef.id);
      const bookingWithId = { ...newBooking, id: docRef.id };
      
      // Update user's booking information
      const userRef = doc(db, 'users', selectedUser);
      await updateDoc(userRef, {
        remainingBookings: user.remainingBookings - 1,
        totalBookings: (user.totalBookings || 0) + 1,
      });

      // Update local state
      setBookings(prev => [...prev, bookingWithId]);
      
      // Reset form
      setSelectedTime('');
      setSelectedUser('');
      setIsRecurring(false);
      
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
      setIsSubmitting(false);
    }
  };

  // Filter bookings based on status
  const filteredBookings = bookings.filter(booking => 
    filterStatus === 'all' ? true : booking.status === filterStatus
  ).sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

  return (
    <div className="space-y-6">
      {/* Booking Settings Section */}
      <Card className="w-full max-w-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Booking Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSettingsUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="timeLimit" className="text-sm font-medium">
                  Booking Time Limit
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    id="timeLimit"
                    type="number"
                    min="1"
                    max="168"
                    value={bookingTimeLimit}
                    onChange={(e) => setBookingTimeLimit(Number(e.target.value))}
                    className="h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
                  />
                  <span className="text-sm text-gray-500">hrs</span>
                </div>
                <p className="text-xs text-gray-500">
                  Maximum hours in advance for bookings
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="cancelTimeLimit" className="text-sm font-medium">
                  Cancel Time Limit
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    id="cancelTimeLimit"
                    type="number"
                    min="1"
                    max={bookingTimeLimit}
                    value={cancelTimeLimit}
                    onChange={(e) => setCancelTimeLimit(Number(e.target.value))}
                    className="h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
                  />
                  <span className="text-sm text-gray-500">hrs</span>
                </div>
                <p className="text-xs text-gray-500">
                  Hours required before cancellation
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button 
                type="submit" 
                disabled={isSettingsLoading}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {isSettingsLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Booking Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* User Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select User</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.remainingBookings} sessions)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                      disabled={(date) => 
                        date < new Date() || // No past dates
                        date.getDay() === 0 || date.getDay() === 6 || // No weekends
                        date > new Date(new Date().setMonth(new Date().getMonth() + 3)) // Max 3 months ahead
                      }
                    />
                  </PopoverContent>
                </Popover>
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
                <label className="text-sm font-medium">Recurring Booking</label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recurring"
                    checked={isRecurring}
                    onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
                  />
                  <label htmlFor="recurring" className="text-sm font-medium">
                    Make it recurring
                  </label>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}

            <Button
              onClick={handleAddBooking}
              disabled={isSubmitting || !selectedTime || !selectedUser}
              size="sm"
              className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {isSubmitting ? <LoadingSpinner /> : 'Create Booking'}
            </Button>
          </div>

          {/* Existing Bookings Table */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Existing Bookings</h3>
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as BookingStatus | 'all')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bookings</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.userName}</TableCell>
                    <TableCell>
                      <ColorLabel color={booking.userLabelColor || '#808080'}>
                        {booking.userLabel || 'No Label'}
                      </ColorLabel>
                    </TableCell>
                    <TableCell>{formatDate(booking.date)}</TableCell>
                    <TableCell>{booking.time}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        booking.status === 'confirmed' && "bg-green-100 text-green-800",
                        booking.status === 'cancelled' && "bg-red-100 text-red-800",
                        booking.status === 'completed' && "bg-blue-100 text-blue-800"
                      )}>
                        {booking.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        booking.recurring === 'weekly' 
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      )}>
                        {booking.recurring === 'weekly' ? 'Weekly' : 'One-time'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingManagement;
