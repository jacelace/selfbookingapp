import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseInit';
import { BOOKING_TIMES, TimeString } from '../lib/constants';

interface TimeSlotSelectorProps {
  selectedDate: Date | null;
  onTimeSelect: (time: TimeString | null) => void;
  selectedTime: TimeString | null;
  onDateSelect?: (date: Date | null) => void;
}

export default function TimeSlotSelector({
  selectedDate,
  onTimeSelect,
  selectedTime,
  onDateSelect,
}: TimeSlotSelectorProps) {
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBookedSlots() {
      if (!selectedDate) return;

      setLoading(true);
      setError(null);
      try {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const bookingsRef = collection(db, 'bookings');
        const q = query(
          bookingsRef,
          where('date', '>=', startOfDay),
          where('date', '<=', endOfDay)
        );

        const querySnapshot = await getDocs(q);
        const booked = querySnapshot.docs.map(doc => {
          const data = doc.data();
          if (data.time) return data.time;
          return new Date(data.date.seconds * 1000).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }).toUpperCase();
        });
        
        setBookedSlots(booked);
      } catch (err) {
        console.error('Error fetching booked slots:', err);
        setError('Failed to load booked time slots. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchBookedSlots();
  }, [selectedDate]);

  const isTimeSlotAvailable = (time: string) => {
    const currentDate = new Date();
    if (selectedDate && selectedDate.toDateString() === currentDate.toDateString()) {
      const [hours, minutes, period] = time.match(/(\d+):(\d+)\s*(AM|PM)/)?.slice(1) || [];
      if (hours && period) {
        let hour = parseInt(hours);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        
        const slotTime = new Date(selectedDate);
        slotTime.setHours(hour, parseInt(minutes) || 0, 0, 0);
        
        if (slotTime <= currentDate) {
          return false;
        }
      }
    }
    return !bookedSlots.includes(time);
  };

  if (!selectedDate) {
    return <p className="text-gray-500">Please select a date first</p>;
  }

  if (loading) {
    return <p className="text-gray-500">Loading available time slots...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {BOOKING_TIMES.map((time) => (
          <button
            key={time}
            onClick={() => onTimeSelect(time)}
            disabled={!isTimeSlotAvailable(time)}
            className={`p-3 rounded-lg transition-colors ${
              selectedTime === time
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : isTimeSlotAvailable(time)
                ? 'bg-white hover:bg-gray-100 border border-gray-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {time}
            {!isTimeSlotAvailable(time) && <span className="block text-xs">(Booked)</span>}
          </button>
        ))}
      </div>
      {selectedTime && (
        <p className="text-sm text-gray-600">
          Selected time: <span className="font-medium">{selectedTime}</span>
        </p>
      )}
    </div>
  );
}
