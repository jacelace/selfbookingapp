import React, { useState } from 'react';
import { Trash2, Edit } from 'lucide-react';

interface User {
  id: string;
  name: string;
  totalSessions: number;
  remainingBookings: number;
}

interface Booking {
  id: string;
  userId: string;
  date: Date;
  time: string;
  recurring: boolean;
  userName: string;
  userLabel: string;
}

interface BookingSummaryProps {
  bookings: Booking[];
  date: Date;
  onDeleteBooking: (bookingId: string) => void;
  onEditBooking: (booking: Booking) => void;
  users: User[];
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({ bookings, date, onDeleteBooking, onEditBooking, users }) => {
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);
  const sortedBookings = [...bookings].sort((a, b) => a.time.localeCompare(b.time));

  const handleDeleteClick = (bookingId: string) => {
    setDeletingBookingId(bookingId);
  };

  const handleConfirmDelete = () => {
    if (deletingBookingId) {
      onDeleteBooking(deletingBookingId);
      setDeletingBookingId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeletingBookingId(null);
  };

  const to12HourFormat = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">
        Bookings for {date.toLocaleDateString()}
      </h3>
      {sortedBookings.length === 0 ? (
        <p>No bookings for this date.</p>
      ) : (
        <ul className="space-y-2">
          {sortedBookings.map((booking) => {
            const user = users.find(u => u.id === booking.userId);
            return (
              <li key={booking.id} className="bg-gray-100 p-2 rounded flex justify-between items-center">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{to12HourFormat(booking.time)}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      booking.userLabel === 'VIP' ? 'bg-yellow-200' : 'bg-blue-200'
                    }`}>
                      {booking.userLabel}
                    </span>
                  </div>
                  <div>{booking.userName}</div>
                  {user && (
                    <div className="text-xs text-gray-500">
                      Total Sessions: {user.totalSessions}, Remaining: {user.remainingBookings}
                    </div>
                  )}
                  {booking.recurring && (
                    <div className="text-xs text-gray-500">Recurring</div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEditBooking(booking)}
                    className="text-blue-500 hover:text-blue-700"
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
              </li>
            );
          })}
        </ul>
      )}
      {deletingBookingId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Booking</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
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
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
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
};