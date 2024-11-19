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
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Booking Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="timeLimit" className="text-sm font-medium">
                Booking Time Limit
              </label>
              <div className="flex items-center space-x-2">
                <Input
                  id="timeLimit"
                  type="number"
                  min="1"
                  max="168"
                  value={bookingTimeLimit}
                  onChange={(e) => setBookingTimeLimit(Number(e.target.value))}
                  className="h-8"
                />
                <span className="text-sm text-gray-500">hrs</span>
              </div>
              <p className="text-xs text-gray-500">
                Maximum hours in advance for bookings
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="cancelTimeLimit" className="text-sm font-medium">
                Cancel Time Limit
              </label>
              <div className="flex items-center space-x-2">
                <Input
                  id="cancelTimeLimit"
                  type="number"
                  min="1"
                  max={bookingTimeLimit}
                  value={cancelTimeLimit}
                  onChange={(e) => setCancelTimeLimit(Number(e.target.value))}
                  className="h-8"
                />
                <span className="text-sm text-gray-500">hrs</span>
              </div>
              <p className="text-xs text-gray-500">
                Hours required before cancellation
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button 
              type="submit" 
              disabled={isLoading}
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
