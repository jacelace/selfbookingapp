'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { EnhancedBooking, EnhancedUser, TimeString, RecurringType } from '../types';
import { Timestamp } from 'firebase/firestore';

interface EditBookingFormProps {
  booking: EnhancedBooking & { date: Timestamp };
  users: EnhancedUser[];
  onSave: (updatedBooking: EnhancedBooking) => Promise<void>;
  onCancel: () => void;
}

const EditBookingForm: React.FC<EditBookingFormProps> = ({ booking, users, onSave, onCancel }) => {
  const [updatedBooking, setUpdatedBooking] = useState<EnhancedBooking & { date: Timestamp }>(booking);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeSlots: TimeString[] = [
    '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM'
  ] as TimeString[];

  const recurringOptions: RecurringType[] = ['none', 'weekly', 'biweekly', 'monthly'];

  const handleInputChange = (field: keyof EnhancedBooking, value: string | number) => {
    setUpdatedBooking(prev => {
      if (field === 'date') {
        // Convert the date string to a Timestamp
        return {
          ...prev,
          date: Timestamp.fromDate(new Date(value as string))
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const handleUserChange = (userId: string) => {
    const selectedUser = users.find(user => user.id === userId);
    if (selectedUser) {
      setUpdatedBooking(prev => ({
        ...prev,
        userId: selectedUser.id,
        userName: selectedUser.name,
        userLabel: selectedUser.userLabel
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSave(updatedBooking);
    } catch (err) {
      console.error('Error updating booking:', err);
      setError('Failed to update booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Convert Timestamp to date string format (YYYY-MM-DD)
  const formatDateForInput = (date: Timestamp) => {
    const d = date.toDate();
    return d.toISOString().split('T')[0];
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Edit Booking</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">User</label>
          <select
            value={updatedBooking.userId}
            onChange={(e) => handleUserChange(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={loading}
          >
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.userLabel})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <Input
            type="date"
            value={formatDateForInput(updatedBooking.date)}
            onChange={(e) => handleInputChange('date', e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Time</label>
          <select
            value={updatedBooking.time}
            onChange={(e) => handleInputChange('time', e.target.value as TimeString)}
            className="w-full p-2 border rounded"
            disabled={loading}
          >
            {timeSlots.map(time => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Recurring</label>
          <select
            value={updatedBooking.recurring}
            onChange={(e) => handleInputChange('recurring', e.target.value as RecurringType)}
            className="w-full p-2 border rounded"
            disabled={loading}
          >
            {recurringOptions.map(option => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {updatedBooking.recurring !== 'none' && (
          <div>
            <label className="block text-sm font-medium mb-1">Number of Occurrences</label>
            <Input
              type="number"
              min="1"
              max="12"
              value={updatedBooking.recurringCount}
              onChange={(e) => handleInputChange('recurringCount', parseInt(e.target.value))}
              disabled={loading}
            />
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default EditBookingForm;
