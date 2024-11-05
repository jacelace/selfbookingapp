'use client';

import React, { useState } from 'react';
import { Trash2, Edit, Calendar } from 'lucide-react';
import { EnhancedUser, EnhancedBooking, TimeString } from '../types/shared';
import AddToGoogleCalendar from './AddToGoogleCalendar';
import { Button } from './ui/button';

// Admin interface
interface AdminBookingSummaryProps {
  bookings: EnhancedBooking[];
  date: string;
  onDeleteBooking: (bookingId: string) => void;
  onEditBooking: (booking: EnhancedBooking) => void;
  onRescheduleBooking: (booking: EnhancedBooking, newDate: string, newTime: TimeString) => void;
  users: EnhancedUser[];
}

// User interface
interface UserBookingSummaryProps {
  date: Date;
  details: {
    name: string;
    email: string;
    phone: string;
    time: string;
    notes: string;
  };
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
}

type BookingSummaryProps = AdminBookingSummaryProps | UserBookingSummaryProps;

const isAdminSummary = (props: BookingSummaryProps): props is AdminBookingSummaryProps => {
  return 'bookings' in props;
};

const BookingSummary: React.FC<BookingSummaryProps> = (props) => {
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);

  if (isAdminSummary(props)) {
    const { bookings, date, onDeleteBooking, onEditBooking, onRescheduleBooking, users } = props;
    const sortedBookings = [...bookings].sort((a, b) => a.time.localeCompare(b.time));

    const handleDeleteClick = (bookingId: string): void => {
      setDeletingBookingId(bookingId);
    };

    const handleConfirmDelete = (): void => {
      if (deletingBookingId) {
        onDeleteBooking(deletingBookingId);
        setDeletingBookingId(null);
      }
    };

    const handleCancelDelete = (): void => {
      setDeletingBookingId(null);
    };

    const to12HourFormat = (date: Date): string => {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2 text-dark-purple">
          Bookings for {new Date(date).toLocaleDateString()}
        </h3>
        {sortedBookings.length === 0 ? (
          <p className="text-purple">No bookings for this date.</p>
        ) : (
          <ul className="space-y-2">
            {sortedBookings.map((booking) => {
              const user = users.find(u => u.id === booking.userId);
              const bookingDate = new Date(date);
              const [hours, minutes] = booking.time.split(':');
              bookingDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
              const endDate = new Date(bookingDate.getTime() + 60 * 60 * 1000);

              return (
                <li key={booking.id} className="bg-light-brown p-2 rounded flex flex-col">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-dark-purple">
                          {to12HourFormat(bookingDate)} - {to12HourFormat(endDate)}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          booking.userLabel === 'VIP' ? 'bg-yellow-200' : 'bg-purple text-white'
                        }`}>
                          {booking.userLabel}
                        </span>
                      </div>
                      <div className="text-purple">{booking.userName}</div>
                      {user && (
                        <div className="text-xs text-dark-purple">
                          Total Sessions: {user.totalSessions}, Remaining: {user.remainingBookings}
                        </div>
                      )}
                      {booking.recurring !== 'none' && (
                        <div className="text-xs text-dark-purple">
                          Recurring ({booking.recurring} for {booking.recurringCount} sessions)
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEditBooking(booking)}
                        className="text-purple hover:text-dark-purple"
                        aria-label="Edit booking"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(booking.id)}
                        className="text-red-500 hover:text-red-700"
                        aria-label="Delete booking"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <AddToGoogleCalendar booking={booking} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {deletingBookingId && (
          <div className="fixed inset-0 bg-dark-purple bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg leading-6 font-medium text-dark-purple">Delete Booking</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-purple">
                    Are you sure you want to delete this booking? This action cannot be undone.
                  </p>
                </div>
                <div className="items-center px-4 py-3">
                  <button
                    id="ok-btn"
                    className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                    onClick={handleConfirmDelete}
                  >
                    Delete
                  </button>
                  <button
                    id="cancel-btn"
                    className="px-4 py-2 bg-purple text-white text-base font-medium rounded-md w-24 hover:bg-dark-purple focus:outline-none focus:ring-2 focus:ring-purple"
                    onClick={handleCancelDelete}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // User booking summary
  const { date, details, onConfirm, onBack, loading } = props;

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Appointment Details</h3>
        <div className="space-y-2">
          <p><span className="font-medium">Date:</span> {date.toLocaleDateString()}</p>
          <p><span className="font-medium">Time:</span> {details.time}</p>
          <p><span className="font-medium">Name:</span> {details.name}</p>
          <p><span className="font-medium">Email:</span> {details.email}</p>
          <p><span className="font-medium">Phone:</span> {details.phone}</p>
          {details.notes && (
            <p><span className="font-medium">Notes:</span> {details.notes}</p>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={loading}
        >
          Back
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Confirming...' : 'Confirm Booking'}
        </Button>
      </div>
    </div>
  );
};

export default BookingSummary;
