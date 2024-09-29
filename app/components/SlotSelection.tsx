'use client';

import React, { useState, useEffect } from 'react';

interface Slot {
  time: string;
  isBooked: boolean;
}

interface SlotSelectionProps {
  date: Date | null;
  onSlotSelect: (time: string) => void;
  initialTime?: string;
}

const SlotSelection: React.FC<SlotSelectionProps> = ({ date, onSlotSelect, initialTime }) => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(initialTime || null);

  const to12HourFormat = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getEndTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const endHour = (hour + 1) % 24;
    return `${endHour.toString().padStart(2, '0')}:${minutes}`;
  };

  useEffect(() => {
    if (date) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
        setSlots([
          { time: '10:00', isBooked: false },
          { time: '11:00', isBooked: false },
          { time: '12:00', isBooked: false },
          { time: '13:00', isBooked: false },
          { time: '14:00', isBooked: false },
        ]);
      } else {
        setSlots([]); // No slots available on weekends
      }
    }
  }, [date]);

  useEffect(() => {
    setSelectedTime(initialTime || null);
  }, [initialTime]);

  if (!date) {
    return <p>Please select a date to view available time slots.</p>;
  }

  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) { // Saturday or Sunday
    return <p>Bookings are only available from Monday to Friday.</p>;
  }

  const handleSlotSelect = (time: string) => {
    setSelectedTime(time);
    onSlotSelect(time);
  };

  return (
    <div>
      <p className="mb-2">Available 50-minute slots:</p>
      <div className="grid grid-cols-2 gap-2">
        {slots.map((slot) => (
          <button
            key={slot.time}
            className={`p-2 text-sm rounded ${
              slot.isBooked
                ? 'bg-gray-300 cursor-not-allowed'
                : selectedTime === slot.time
                ? 'bg-green-500 text-white'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            onClick={() => !slot.isBooked && handleSlotSelect(slot.time)}
            disabled={slot.isBooked}
          >
            {to12HourFormat(slot.time)} - {to12HourFormat(getEndTime(slot.time))}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SlotSelection;