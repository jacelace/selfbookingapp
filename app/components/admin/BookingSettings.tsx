'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/clientApp';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from '../ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';

export const BookingSettings: React.FC = () => {
  const [bookingTimeLimit, setBookingTimeLimit] = useState<number>(48);
  const [cancelTimeLimit, setCancelTimeLimit] = useState<number>(24);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'booking'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setBookingTimeLimit(data.timeLimit || 48);
          setCancelTimeLimit(data.cancelTimeLimit || 24);
        }
      } catch (error) {
        console.error('Error fetching booking settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load booking settings',
          variant: 'destructive',
        });
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await setDoc(doc(db, 'settings', 'booking'), {
        timeLimit: bookingTimeLimit,
        cancelTimeLimit: cancelTimeLimit,
        updatedAt: new Date(),
      });

      toast({
        title: 'Success',
        description: 'Booking settings updated successfully',
      });
    } catch (error) {
      console.error('Error updating booking settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update booking settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <label htmlFor="timeLimit" className="text-sm font-medium">
              Booking Time Limit (hours)
            </label>
            <Input
              id="timeLimit"
              type="number"
              min="1"
              max="168"
              value={bookingTimeLimit}
              onChange={(e) => setBookingTimeLimit(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-sm text-gray-500">
              Users can only make appointments up to this many hours in advance
            </p>
          </div>

          <Separator className="my-4" />

          <div className="space-y-4">
            <label htmlFor="cancelTimeLimit" className="text-sm font-medium">
              Cancellation Time Limit (hours)
            </label>
            <Input
              id="cancelTimeLimit"
              type="number"
              min="1"
              max="168"
              value={cancelTimeLimit}
              onChange={(e) => setCancelTimeLimit(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-sm text-gray-500">
              Users must cancel their appointments at least this many hours before the scheduled time
            </p>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
