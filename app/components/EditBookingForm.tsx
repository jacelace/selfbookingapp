import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import SlotSelection from './SlotSelection';

interface User {
  id: string;
  name: string;
}

interface Booking {
  id: string;
  userId: string;
  date: Date;
  time: string;
}

interface EditBookingFormProps {
  booking: Booking;
  users: User[];
  onEditBooking: (bookingId: string, userId: string, date: Date, time: string) => void;
  onCancel: () => void;
}

export const EditBookingForm: React.FC<EditBookingFormProps> = ({ booking, users, onEditBooking, onCancel }) => {
  const [userId, setUserId] = useState(booking.userId);
  const [date, setDate] = useState<Date | null>(booking.date);
  const [time, setTime] = useState(booking.time);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (date && time) {
      onEditBooking(booking.id, userId, date, time);
    }
  };

  const handleDateChange = (newDate: Date | null) => {
    setDate(newDate);
    setTime(''); // Reset time when date changes
  };

  const isWeekday = (date: Date) => {
    const day = date.getDay();
    return day !== 0 && day !== 6;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">Edit Booking</h3>
      <div>
        <label htmlFor="user" className="block text-sm font-medium text-gray-700">
          User
        </label>
        <select
          id="user"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          Date
        </label>
        <DatePicker
          selected={date}
          onChange={handleDateChange}
          filterDate={isWeekday}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          dateFormat="MMMM d, yyyy"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Time Slot
        </label>
        <SlotSelection
          date={date}
          onSlotSelect={(selectedTime: string) => setTime(selectedTime)}
          initialTime={time}
        />
      </div>
      <div className="flex space-x-2">
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Save Changes
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};