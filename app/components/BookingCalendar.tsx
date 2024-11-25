'use client';

import { useState, useEffect } from "react";
import { Calendar } from "./ui/calendar";
import { Card } from "./ui/card";
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseInit';
import TimeSlotSelector from './TimeSlotSelector';
import { TimeString } from '../lib/constants';

interface BookingCalendarProps {
  mode: "single";  
  selectedDate?: Date;
  onSelect?: (date: Date | undefined) => void;
  onTimeSelect?: (time: TimeString | null) => void;
  selectedTime?: TimeString | null;
  className?: string;
  disabled?: (date: Date) => boolean;
}

interface TimeOff {
  id: string;
  startDate: any;
  endDate: any;
  title: string;
  reason: string;
}

export default function BookingCalendar({ 
  mode = "single",
  selectedDate,
  onSelect,
  onTimeSelect,
  selectedTime,
  className,
  disabled
}: BookingCalendarProps) {
  const [timeOffPeriods, setTimeOffPeriods] = useState<TimeOff[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch time-off periods
  useEffect(() => {
    const fetchTimeOffPeriods = async () => {
      setIsLoading(true);
      try {
        const timeOffSnapshot = await getDocs(collection(db, 'timeoff'));
        const periods = timeOffSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TimeOff[];
        setTimeOffPeriods(periods);
      } catch (error) {
        console.error('Error fetching time-off periods:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeOffPeriods();
  }, []);

  // Check if a date is within any time-off period
  const isDateInTimeOff = (date: Date) => {
    return timeOffPeriods.some(period => {
      const start = period.startDate.toDate();
      const end = period.endDate.toDate();
      return date >= start && date <= end;
    });
  };

  // Check if a date is disabled
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable weekends (0 = Sunday, 6 = Saturday)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    return date < today || isWeekend || isDateInTimeOff(date) || (disabled && disabled(date));
  };

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-md mx-auto p-6 shadow-lg">
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Select Date</h3>
          <p className="text-sm text-gray-500 mb-4">
            Choose an available date for your session
          </p>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onSelect}
            className={className}
            disabled={isDateDisabled}
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
              day_range_end: "day-range-end",
              day_selected: "bg-purple-600 text-white hover:bg-purple-600 hover:text-white focus:bg-purple-600 focus:text-white rounded-md",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "day-outside opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
              day_disabled: "text-muted-foreground opacity-50",
              day_hidden: "invisible",
            }}
          />
        </div>

        {selectedDate && onTimeSelect && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-medium mb-2">Select Time</h3>
            <p className="text-sm text-gray-500 mb-4">
              Choose an available time slot for your session
            </p>
            <TimeSlotSelector
              selectedDate={selectedDate}
              onTimeSelect={onTimeSelect}
              selectedTime={selectedTime}
              onDateSelect={onSelect}
            />
          </div>
        )}
      </Card>

      {isLoading && (
        <div className="text-center text-sm text-gray-500">
          Loading available dates...
        </div>
      )}
    </div>
  );
}
