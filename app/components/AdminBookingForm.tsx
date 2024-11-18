'use client';

import React, { useState, useEffect } from 'react';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/clientApp';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from './ui/use-toast';
import { EnhancedUser } from '../types/shared';

interface AdminBookingFormProps {
  selectedDate: Date;
  users: EnhancedUser[];
  onCancel: () => void;
}

const AdminBookingForm: React.FC<AdminBookingFormProps> = ({
  selectedDate,
  users,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [userSessions, setUserSessions] = useState<number>(0);

  useEffect(() => {
    if (selectedUser) {
      const user = users.find(u => u.id === selectedUser);
      setUserSessions(user?.remainingBookings || 0);
    }
  }, [selectedUser, users]);

  const timeSlots = [
    '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM'
  ];

  const createRecurringBookings = async (userId: string, startDate: Date, slot: string, sessions: number) => {
    const selectedUserData = users.find(u => u.id === userId);
    const bookings = [];
    let currentDate = new Date(startDate);

    for (let i = 0; i < sessions; i++) {
      bookings.push({
        userId,
        userName: selectedUserData?.name || '',
        userLabel: selectedUserData?.userLabel || '',
        date: new Date(currentDate),
        slot,
        status: 'confirmed',
        isRecurring: true,
        recurringGroupId: `recurring-${userId}-${startDate.getTime()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      currentDate.setDate(currentDate.getDate() + 7); // Next week
    }

    return bookings;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      toast({
        title: 'Error',
        description: 'Please select a user',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedSlot) {
      toast({
        title: 'Error',
        description: 'Please select a time slot',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Fetching user document:', selectedUser);
      const userRef = doc(db, 'users', selectedUser);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      console.log('User data:', userData);

      if (!userData) {
        throw new Error('User not found');
      }

      if (isRecurring) {
        console.log('Creating recurring bookings...');
        if (userData.remainingBookings < 2) {
          throw new Error('Insufficient sessions for recurring bookings');
        }

        const recurringBookings = await createRecurringBookings(
          selectedUser,
          selectedDate,
          selectedSlot,
          userData.remainingBookings
        );
        console.log('Recurring bookings to create:', recurringBookings);

        // Create all recurring bookings
        for (const booking of recurringBookings) {
          console.log('Adding booking:', booking);
          const docRef = await addDoc(collection(db, 'bookings'), booking);
          console.log('Booking added with ID:', docRef.id);
        }

        // Update user's remaining bookings
        console.log('Updating user remaining bookings to 0');
        await updateDoc(userRef, {
          remainingBookings: 0,
          totalBookings: (userData.totalBookings || 0) + recurringBookings.length,
        });

        toast({
          title: 'Success',
          description: `Created ${recurringBookings.length} recurring bookings`,
        });
      } else {
        // Create single booking
        if (userData.remainingBookings < 1) {
          throw new Error('No remaining sessions');
        }

        const selectedUserData = users.find(u => u.id === selectedUser);
        console.log('Creating single booking...');
        await addDoc(collection(db, 'bookings'), {
          userId: selectedUser,
          userName: selectedUserData?.name || '',
          userLabel: selectedUserData?.userLabel || '',
          date: selectedDate,
          slot: selectedSlot,
          status: 'confirmed',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Update user's remaining bookings
        console.log('Updating user remaining bookings');
        await updateDoc(userRef, {
          remainingBookings: userData.remainingBookings - 1,
          totalBookings: (userData.totalBookings || 0) + 1,
        });

        toast({
          title: 'Success',
          description: 'Booking created successfully',
        });
      }

      onCancel();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create booking',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Admin Booking</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="font-medium mb-2">Select User:</p>
          <Select
            value={selectedUser}
            onValueChange={setSelectedUser}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} ({user.remainingBookings} sessions)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <p className="font-medium">Selected Date:</p>
          <p>{selectedDate.toLocaleDateString()}</p>
        </div>
        
        <div>
          <p className="font-medium mb-2">Select Time:</p>
          <Select
            value={selectedSlot}
            onValueChange={setSelectedSlot}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a time slot" />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((slot) => (
                <SelectItem key={slot} value={slot}>
                  {slot} (30 min)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={isRecurring}
            onCheckedChange={setIsRecurring}
          />
          <span>Make Recurring Weekly Booking</span>
        </div>

        {isRecurring && (
          <p className="text-sm text-gray-600">
            This will create {userSessions} weekly bookings and use all remaining sessions
          </p>
        )}
        
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Booking'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AdminBookingForm;
