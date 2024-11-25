'use client';

import { useState, useEffect } from 'react';
import { db } from '../../firebase/clientApp';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { format, isSameDay } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Search } from 'lucide-react';
import type { EnhancedBooking, EnhancedUser } from '../../types';
import ColorLabel from '../ColorLabel';
import { cn } from '../../lib/utils';
import { Timestamp, addDoc } from 'firebase/firestore';
import { BOOKING_TIMES } from '../../lib/constants';
import { toast } from '../ui/use-toast';
import { Input } from "../../components/ui/input"

interface BookingCalendarProps {
  bookings: EnhancedBooking[];
  users?: EnhancedUser[];
  onRefresh?: () => void;
}

interface TimeOff {
  id: string;
  startDate: Timestamp;
  endDate: Timestamp;
  reason: string;
}

interface DayBookingsDialogProps {
  date: Date;
  bookings: EnhancedBooking[];
  users: EnhancedUser[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddBooking: (time: string, userId?: string) => void;
}

// Helper function to safely get Date from Timestamp or Date
const safeGetDate = (date: Date | Timestamp): Date => {
  return date instanceof Timestamp ? date.toDate() : date;
};

function DayBookingsDialog({ date, bookings, users, open, onOpenChange, onAddBooking }: DayBookingsDialogProps) {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset states when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedTime(null);
      setSelectedUserId(null);
      setSearchQuery('');
    }
  }, [open]);

  // Filter bookings for the selected date
  const dayBookings = bookings.filter(booking => {
    const bookingDate = safeGetDate(booking.date);
    return bookingDate && isSameDay(bookingDate, date);
  }).sort((a, b) => {
    const timeA = BOOKING_TIMES.indexOf(a.time);
    const timeB = BOOKING_TIMES.indexOf(b.time);
    return timeA - timeB;
  });

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddBooking = () => {
    if (selectedTime) {
      onAddBooking(selectedTime, selectedUserId || undefined);
      setSelectedTime(null);
      setSelectedUserId(null);
    }
  };

  const isTimeSlotBooked = (timeSlot: string) => {
    return dayBookings.some(booking => booking.time === timeSlot);
  };

  const selectedUser = users.find(user => user.id === selectedUserId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Bookings for {format(date, 'MMMM d, yyyy')}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Available Time Slots</h3>
            <div className="max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                {BOOKING_TIMES.map((timeSlot) => {
                  const booking = dayBookings.find(b => b.time === timeSlot);
                  const isBooked = isTimeSlotBooked(timeSlot);
                  const isSelected = selectedTime === timeSlot;

                  return (
                    <button
                      key={timeSlot}
                      onClick={() => !isBooked && setSelectedTime(isSelected ? null : timeSlot)}
                      disabled={isBooked}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-colors",
                        isBooked ? "bg-secondary/50" : "hover:bg-secondary/20",
                        isSelected && "ring-2 ring-primary",
                        !isBooked && "cursor-pointer"
                      )}
                    >
                      <div className="font-medium">{timeSlot}</div>
                      {booking ? (
                        <div className="mt-1 space-y-1">
                          <div className="text-sm">{booking.userName}</div>
                          <ColorLabel 
                            name={booking.userLabel || 'No Label'}
                            color={booking.userLabelColor || '#808080'}
                          />
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Available</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Select User</h3>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            {selectedUser && (
              <div className="p-4 rounded-lg border bg-secondary/20">
                <div className="font-medium">Selected User:</div>
                <div className="mt-2">
                  <div>{selectedUser.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                  {selectedUser.userLabel && (
                    <div className="mt-1">
                      <ColorLabel 
                        name={selectedUser.userLabel}
                        color={selectedUser.labelColor || ''}
                      />
                    </div>
                  )}
                  <div className="mt-2 text-sm">
                    <div>Sessions: {selectedUser.sessions}</div>
                    <div>Remaining: {selectedUser.remainingBookings}</div>
                  </div>
                </div>
              </div>
            )}
            <div className="max-h-[calc(60vh-8rem)] overflow-y-auto">
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-colors hover:bg-secondary/20",
                      selectedUserId === user.id && "ring-2 ring-primary",
                      user.remainingBookings === 0 && "opacity-50"
                    )}
                    disabled={user.remainingBookings === 0}
                  >
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    {user.userLabel && (
                      <div className="mt-1">
                        <ColorLabel 
                          name={user.userLabel}
                          color={user.labelColor || ''}
                        />
                      </div>
                    )}
                    <div className="mt-1 text-sm">
                      Remaining: {user.remainingBookings} / {user.sessions}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleAddBooking}
            disabled={!selectedTime || !selectedUserId || (selectedUser?.remainingBookings === 0)}
          >
            Add Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DayWithBookings({ date, bookings }: { date: Date; bookings: EnhancedBooking[] }) {
  const hasBookings = bookings.some(booking => {
    const bookingDate = safeGetDate(booking.date);
    return isSameDay(bookingDate, date);
  });

  return (
    <div className="relative">
      <div>{date.getDate()}</div>
      {hasBookings && (
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
        </div>
      )}
    </div>
  );
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({ bookings, users = [], onRefresh }) => {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  // Filter users based on search query and selected label
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLabel = selectedLabel === null || user.userLabel === selectedLabel;
    
    return matchesSearch && matchesLabel;
  });

  // Get unique labels from users
  const uniqueLabels = Array.from(new Set(users.map(user => user.userLabel).filter(Boolean)));

  const handleAddBooking = async (time: string, userId?: string) => {
    if (!selectedDate || !userId) return;

    try {
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error('User not found');

      const bookingData = {
        date: Timestamp.fromDate(selectedDate),
        time,
        userId,
        userName: user.name,
        userLabel: user.userLabel,
        userLabelColor: user.labelColor,
        status: 'confirmed',
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'bookings'), bookingData);
      toast({
        title: 'Success',
        description: 'Booking added successfully',
      });
      onRefresh?.();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error adding booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to add booking',
        variant: 'destructive',
      });
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsDialogOpen(true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => {
            const newDate = new Date(date);
            newDate.setMonth(date.getMonth() - 1);
            setDate(newDate);
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold">
          {format(date, 'MMMM yyyy')}
        </div>
        <Button
          variant="outline"
          onClick={() => {
            const newDate = new Date(date);
            newDate.setMonth(date.getMonth() + 1);
            setDate(newDate);
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleDateSelect}
        month={date}
        className="rounded-md border"
        components={{
          Day: ({ date }) => <DayWithBookings date={date} bookings={bookings} />
        }}
        modifiers={{
          booked: (date) => {
            return bookings.some(booking => {
              const bookingDate = safeGetDate(booking.date);
              return isSameDay(bookingDate, date);
            });
          }
        }}
        modifiersStyles={{
          booked: {
            backgroundColor: 'rgba(var(--primary), 0.1)'
          }
        }}
      />

      <DayBookingsDialog
        date={selectedDate || new Date()}
        bookings={bookings}
        users={filteredUsers}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAddBooking={handleAddBooking}
      />
    </div>
  );
};

export default BookingCalendar;
