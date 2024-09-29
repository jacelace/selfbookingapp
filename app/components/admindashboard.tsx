'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CustomCalendar } from './CustomCalendar';
import { ColorLabel } from './ColorLabel';
import { UserManagement } from './UserManagement';
import { LabelManagement } from './LabelManagement';
import { BookingSummary } from './BookingSummary';
import { BookingForm } from './BookingForm';
import { EditBookingForm } from './EditBookingForm';
import { SearchBar } from './SearchBar';

interface User {
  id: string;
  name: string;
  label: {
    id: string;
    name: string;
    color: string;
  };
  totalBookings: number;
  remainingBookings: number;
  totalSessions: number;
}

interface Booking {
  id: string;
  userId: string;
  date: Date;
  time: string;
}

interface ColorLabelType {
  id: string;
  name: string;
  color: string;
}

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'John Doe', label: { id: '1', name: 'VIP', color: '#FFD700' }, totalBookings: 10, remainingBookings: 8, totalSessions: 18 },
    { id: '2', name: 'Jane Smith', label: { id: '2', name: 'Regular', color: '#87CEEB' }, totalBookings: 5, remainingBookings: 3, totalSessions: 8 }
  ]);
  const [bookings, setBookings] = useState<Booking[]>([
    { id: '1', userId: '1', date: new Date(2024, 8, 16), time: '10:00' }, // Monday
    { id: '2', userId: '2', date: new Date(2024, 8, 17), time: '14:00' }  // Tuesday
  ]);
  const [labels, setLabels] = useState<ColorLabelType[]>([
    { id: '1', name: 'VIP', color: '#FFD700' },
    { id: '2', name: 'Regular', color: '#87CEEB' }
  ]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'calendar' | 'users' | 'labels'>('calendar');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleAddUser = (newUser: Omit<User, 'id'>) => {
    setUsers(prevUsers => [
      ...prevUsers,
      { ...newUser, id: (prevUsers.length + 1).toString() }
    ]);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prevUsers => prevUsers.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
  };

  const handleAddLabel = (newLabel: Omit<ColorLabelType, 'id'>) => {
    setLabels(prevLabels => [
      ...prevLabels,
      { ...newLabel, id: (prevLabels.length + 1).toString() }
    ]);
  };

  const isValidBookingTime = (date: Date, time: string): boolean => {
    const dayOfWeek = date.getDay();
    const [hours] = time.split(':').map(Number);
    return dayOfWeek >= 1 && dayOfWeek <= 5 && hours >= 10 && hours <= 14;
  };

  const handleAddBooking = (userId: string, date: Date, time: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user || user.remainingBookings <= 0) {
        setErrorMessage('User has no remaining bookings available');
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }

      if (!isValidBookingTime(date, time)) {
        setErrorMessage('Invalid booking time. Please select a time between 10 AM and 2 PM, Monday to Friday.');
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }

      const newBooking: Booking = {
        id: (bookings.length + 1).toString(),
        userId,
        date,
        time
      };
      setBookings(prevBookings => [...prevBookings, newBooking]);

      setUsers(users.map(u => 
        u.id === userId 
          ? { ...u, remainingBookings: u.remainingBookings - 1, totalBookings: u.totalBookings + 1 } 
          : u
      ));

      setSuccessMessage('Booking added successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage('Failed to add booking');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleDeleteBooking = (bookingId: string) => {
    try {
      const bookingToDelete = bookings.find(b => b.id === bookingId);
      if (bookingToDelete) {
        setBookings(prevBookings => prevBookings.filter(booking => booking.id !== bookingId));
        setUsers(users.map(user => 
          user.id === bookingToDelete.userId 
            ? { 
                ...user, 
                remainingBookings: user.remainingBookings + 1,
                totalBookings: user.totalBookings - 1
              } 
            : user
        ));
        setSuccessMessage('Booking deleted successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error) {
      setErrorMessage('Failed to delete booking');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleEditBooking = (bookingId: string, userId: string, date: Date, time: string) => {
    try {
      if (!isValidBookingTime(date, time)) {
        setErrorMessage('Invalid booking time. Please select a time between 10 AM and 2 PM, Monday to Friday.');
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }

      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId
            ? { ...booking, userId, date, time }
            : booking
        )
      );
      setEditingBooking(null);
      setSuccessMessage('Booking updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage('Failed to update booking');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const getBookingsWithUserInfo = () => {
    return bookings.map(booking => {
      const user = users.find(u => u.id === booking.userId);
      return {
        ...booking,
        userName: user?.name || 'Unknown',
        userLabel: user?.label.name || 'N/A'
      };
    });
  };

  const filteredBookings = useMemo(() => {
    const bookingsWithUserInfo = getBookingsWithUserInfo();
    if (!searchQuery) return bookingsWithUserInfo;
    
    return bookingsWithUserInfo.filter(booking => 
      booking.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.userLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.time.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.date.toLocaleDateString().includes(searchQuery)
    );
  }, [bookings, users, searchQuery]);

  const getBookingsForDate = (date: Date) => {
    return filteredBookings.filter(booking => 
      booking.date.toDateString() === date.toDateString()
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Link href="/booking" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Booking
        </Link>
      </div>

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2 border-b">
            {['calendar', 'users', 'labels'].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 font-medium ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab(tab as 'calendar' | 'users' | 'labels')}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <SearchBar onSearch={handleSearch} />
        </div>

        {activeTab === 'calendar' && (
          <div className="flex flex-col md:flex-row md:space-x-4">
            <div className="w-full md:w-1/2">
              <CustomCalendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                bookings={filteredBookings}
              />
              {editingBooking ? (
                <EditBookingForm
                  booking={editingBooking}
                  users={users}
                  onEditBooking={handleEditBooking}
                  onCancel={() => setEditingBooking(null)}
                />
              ) : (
                <BookingForm
                  users={users}
                  onAddBooking={handleAddBooking}
                  selectedDate={selectedDate}
                />
              )}
            </div>
            <div className="w-full md:w-1/2 mt-4 md:mt-0">
              <BookingSummary
                bookings={getBookingsForDate(selectedDate)}
                date={selectedDate}
                onDeleteBooking={handleDeleteBooking}
                onEditBooking={setEditingBooking}
                users={users}
              />
            </div>
          </div>
        )}
        {activeTab === 'users' && (
          <UserManagement users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} />
        )}
        {activeTab === 'labels' && (
          <LabelManagement labels={labels} onAddLabel={handleAddLabel} />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
