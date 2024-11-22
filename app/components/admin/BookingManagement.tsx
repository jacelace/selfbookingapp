'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { collection, Timestamp } from 'firebase/firestore';
import { db } from '@/app/firebase/firebaseInit';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { EnhancedBooking, EnhancedUser, Label } from '@/app/types';

interface BookingManagementProps {
  users: EnhancedUser[];
  bookings: EnhancedBooking[];
  labels: Label[];
  setBookings: React.Dispatch<React.SetStateAction<EnhancedBooking[]>>;
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
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
  setBookings,
  isSubmitting,
  setIsSubmitting
}) => {
  return (
    <div>
      <div className="rounded-md border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recurring
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Label
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {booking.user?.name || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatDate(booking.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {booking.time}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    {
                      'bg-yellow-100 text-yellow-800': booking.status === 'pending',
                      'bg-green-100 text-green-800': booking.status === 'confirmed',
                      'bg-red-100 text-red-800': booking.status === 'cancelled',
                      'bg-blue-100 text-blue-800': booking.status === 'completed'
                    }
                  )}>
                    {booking.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    {
                      'bg-gray-100 text-gray-800': booking.recurring === 'none',
                      'bg-blue-100 text-blue-800': booking.recurring === 'weekly',
                      'bg-purple-100 text-purple-800': booking.recurring === 'biweekly',
                      'bg-indigo-100 text-indigo-800': booking.recurring === 'monthly'
                    }
                  )}>
                    {booking.recurring}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {booking.label?.name || 'None'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    className="text-indigo-600 hover:text-indigo-900"
                    onClick={() => {/* Handle edit */}}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingManagement;
