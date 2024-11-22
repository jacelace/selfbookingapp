'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { collection, Timestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '@/app/firebase/firebaseInit';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { EnhancedBooking, EnhancedUser, Label } from '@/app/types';

interface BookingManagementProps {
  users: EnhancedUser[];
  bookings: EnhancedBooking[];
  labels: Label[];
  onRefresh?: () => void;
}

// Helper function to format dates
const formatDate = (date: Date | Timestamp | string) => {
  if (date instanceof Timestamp) {
    return format(date.toDate(), 'PPP');
  } else if (date instanceof Date) {
    return format(date, 'PPP');
  } else {
    return format(new Date(date), 'PPP');
  }
};

const BookingManagement: React.FC<BookingManagementProps> = ({
  users,
  bookings,
  labels,
  onRefresh
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Function to handle booking updates
  const handleBookingUpdate = async (bookingId: string, updates: Partial<EnhancedBooking>) => {
    setIsLoading(true);
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await setDoc(bookingRef, updates, { merge: true });
      onRefresh?.();
    } catch (error) {
      console.error('Error updating booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Bookings</h3>
            <button
              onClick={() => onRefresh?.()}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Refresh
            </button>
          </div>
          <div className="mt-4">
            <div className="rounded-md border">
              <div className="grid grid-cols-6 gap-4 p-4 font-medium">
                <div>Date</div>
                <div>Time</div>
                <div>User</div>
                <div>Label</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              <div className="divide-y">
                {bookings.map((booking) => {
                  const user = users.find(u => u.id === booking.userId);
                  const label = labels.find(l => l.id === booking.labelId);
                  
                  return (
                    <div key={booking.id} className="grid grid-cols-6 gap-4 p-4">
                      <div>{formatDate(booking.date)}</div>
                      <div>{booking.time}</div>
                      <div>{user?.name || 'Unknown User'}</div>
                      <div>
                        {label && (
                          <>
                            <span
                              className="inline-block w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: label.color }}
                            />
                            {label.name}
                          </>
                        )}
                      </div>
                      <div>
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          booking.status === 'confirmed' && "bg-green-100 text-green-800",
                          booking.status === 'pending' && "bg-yellow-100 text-yellow-800",
                          booking.status === 'cancelled' && "bg-red-100 text-red-800"
                        )}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="space-x-2">
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleBookingUpdate(booking.id, { status: 'confirmed' })}
                              disabled={isLoading}
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleBookingUpdate(booking.id, { status: 'cancelled' })}
                              disabled={isLoading}
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 px-3"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingManagement;
