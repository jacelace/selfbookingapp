import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import SlotSelection from './SlotSelection';

interface User {
  id: string;
  name: string;
  totalSessions: number;
  remainingBookings: number;
}

interface BookingFormProps {
  users: User[];
  onAddBooking: (userId: string, date: Date, time: string) => void;
  selectedDate: Date;
}

export const BookingForm: React.FC<BookingFormProps> = ({ users, onAddBooking, selectedDate }) => {
  const [userId, setUserId] = useState('');
  const [date, setDate] = useState<Date | null>(selectedDate);
  const [time, setTime] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    setDate(selectedDate);
  }, [selectedDate]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!userId) newErrors.userId = 'Please select a user';
    if (!date) newErrors.date = 'Please select a date';
    if (!time) newErrors.time = 'Please select a time slot';

    const selectedUser = users.find(user => user.id === userId);
    if (selectedUser && selectedUser.remainingBookings <= 0) {
      newErrors.userId = 'This user has no remaining sessions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() && date && time) {
      onAddBooking(userId, date, time);
      setUserId('');
      setDate(selectedDate);
      setTime('');
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
    <form onSubmit={handleSubmit} className={`bg-white rounded-lg shadow-md p-6 space-y-6 transition-all duration-500 ease-in-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Booking</h3>
      <div>
        <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
          User
        </label>
        <select
          id="user"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className={`block w-full px-3 py-2 text-base border rounded-md focus:outline-none focus:ring-2 transition duration-150 ease-in-out ${errors.userId ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
        >
          <option value="">Select a user</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} (Remaining sessions: {user.remainingBookings})
            </option>
          ))}
        </select>
        {errors.userId && <p className="mt-1 text-sm text-red-500">{errors.userId}</p>}
      </div>
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
          Date
        </label>
        <DatePicker
          selected={date}
          onChange={handleDateChange}
          className={`block w-full px-3 py-2 text-base border rounded-md focus:outline-none focus:ring-2 transition duration-150 ease-in-out ${errors.date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
          dateFormat="MMMM d, yyyy"
        />
        {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Time Slot
        </label>
        <SlotSelection
          date={date}
          onSlotSelect={(selectedTime: string) => setTime(selectedTime)}
        />
        {errors.time && <p className="mt-1 text-sm text-red-500">{errors.time}</p>}
      </div>
      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
      >
        Add Booking
      </button>
    </form>
  );
};