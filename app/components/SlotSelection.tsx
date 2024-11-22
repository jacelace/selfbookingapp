'use client';

import React from 'react';
import { TimeString } from '../types';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface SlotSelectionProps {
  date: string | null;
  onSlotSelect: (time: TimeString) => void;
  fetchBookedSlots: (date: string) => Promise<TimeString[]>;
  selectedTime: TimeString | null;
  isOpen: boolean;
  onClose: () => void;
}

const SlotSelection: React.FC<SlotSelectionProps> = ({ 
  date, 
  onSlotSelect, 
  fetchBookedSlots, 
  selectedTime,
  isOpen,
  onClose
}) => {
  const [slots, setSlots] = React.useState<Array<{ time: TimeString; isBooked: boolean }>>([]);

  const to12HourFormat = (time: TimeString): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  React.useEffect(() => {
    const fetchSlots = async () => {
      if (date) {
        const bookedSlots = await fetchBookedSlots(date);
        const availableSlots: Array<{ time: TimeString; isBooked: boolean }> = [
          '09:30', '10:00', '10:30', '11:00', '11:30', 
          '13:00', '13:30', '14:00', '14:30', '15:00'
        ].map(time => ({
          time: time as TimeString,
          isBooked: bookedSlots.includes(time as TimeString)
        }));
        setSlots(availableSlots);
      }
    };

    if (date) {
      fetchSlots();
    }
  }, [date, fetchBookedSlots]);

  if (!date) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Book Appointment</DialogTitle>
          <div className="text-center text-muted-foreground">
            {date && format(new Date(date), 'EEEE, MMMM dd, yyyy')}
          </div>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            {slots.map((slot) => (
              <button
                key={slot.time}
                onClick={() => {
                  if (!slot.isBooked) {
                    onSlotSelect(slot.time);
                    onClose();
                  }
                }}
                disabled={slot.isBooked}
                className={`
                  px-4 py-3 rounded-lg text-sm font-medium transition-all
                  ${slot.isBooked 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : selectedTime === slot.time
                      ? 'bg-gradient-primary text-white shadow-lg'
                      : 'bg-white hover:bg-gray-50 border border-gray-200'
                  }
                `}
              >
                {to12HourFormat(slot.time)}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SlotSelection;
