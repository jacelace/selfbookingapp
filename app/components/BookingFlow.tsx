'use client';

import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/clientApp';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';
import TimeSlotSelector from './TimeSlotSelector';
import { TimeString } from '../lib/constants';

interface UserInfo {
  name: string;
  email: string;
  phone: string;
  remainingBookings?: number;
}

interface BookingFlowProps {
  userData: UserInfo | null;
  onUserInfoUpdate?: (info: UserInfo) => void;
  onBookingComplete?: () => void;
}

const BookingFlow: React.FC<BookingFlowProps> = ({ userData, onUserInfoUpdate, onBookingComplete }) => {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: userData?.name || '',
    email: userData?.email || '',
    phone: userData?.phone || '',
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<TimeString | null>(null);

  useEffect(() => {
    if (userData) {
      setUserInfo({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
      });
    }
  }, [userData]);

  const handleUserInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInfo.name || !userInfo.email || !userInfo.phone) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (onUserInfoUpdate) {
        onUserInfoUpdate(userInfo);
      }
      toast({
        title: 'Success',
        description: 'Information updated successfully',
      });
    } catch (error) {
      console.error('Error updating user info:', error);
      toast({
        title: 'Error',
        description: 'Failed to save user information',
        variant: 'destructive',
      });
    }
  };

  const handleBookingSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: 'Error',
        description: 'Please select both date and time',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (onBookingComplete) {
        onBookingComplete();
      }
      toast({
        title: 'Success',
        description: 'Booking submitted successfully',
      });
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit booking',
        variant: 'destructive',
      });
    }
  };

  if (!userData?.remainingBookings) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">No Available Bookings</h3>
            <p className="text-gray-600">
              You currently have no remaining bookings. Please contact the administrator for assistance.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* User Information Section */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUserInfoSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={userInfo.name}
                onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userInfo.email}
                onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                placeholder="Enter your email"
                disabled={!!userData?.email}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={userInfo.phone}
                onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                placeholder="Enter your phone number"
              />
            </div>
            <Button type="submit" className="w-full">
              Update Information
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Calendar and Booking Section */}
      <Card>
        <CardHeader>
          <CardTitle>Book a Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <TimeSlotSelector
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            selectedTime={selectedTime}
            onTimeSelect={setSelectedTime}
          />
          <Button 
            onClick={handleBookingSubmit}
            className="w-full"
            disabled={!selectedDate || !selectedTime || !userInfo.name || !userInfo.email || !userInfo.phone}
          >
            Confirm Booking
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingFlow;
