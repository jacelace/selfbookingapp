'use client';

import { useState, useEffect } from "react";
import { Calendar } from "./ui/calendar";
import { Card } from "./ui/card";
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/clientApp';

interface BookingCalendarProps {
  mode?: "single" | "multiple" | "range";
  selected?: Date | Date[] | undefined;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
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
  selected,
  onSelect,
  className
}: BookingCalendarProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [timeOffPeriods, setTimeOffPeriods] = useState<TimeOff[]>([]);

  // Fetch time-off periods
  useEffect(() => {
    const fetchTimeOffPeriods = async () => {
      try {
        const timeOffSnapshot = await getDocs(collection(db, 'timeoff'));
        const periods = timeOffSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TimeOff[];
        setTimeOffPeriods(periods);
      } catch (error) {
        console.error('Error fetching time-off periods:', error);
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

  // Get time-off reason for a date if it exists
  const getTimeOffReason = (date: Date) => {
    const period = timeOffPeriods.find(period => {
      const start = period.startDate.toDate();
      const end = period.endDate.toDate();
      return date >= start && date <= end;
    });
    return period?.reason;
  };

  // Get time-off title for a date if it exists
  const getTimeOffTitle = (date: Date) => {
    const period = timeOffPeriods.find(period => {
      const start = period.startDate.toDate();
      const end = period.endDate.toDate();
      return date >= start && date <= end;
    });
    return period?.title;
  };

  // Function to disable weekends
  const disableWeekends = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
  };

  return (
    <div className="relative">
      <Card className="w-full max-w-md mx-auto p-6 shadow-lg">
        <div className="flex items-center justify-between space-x-2">
          <button
            variant="outline"
            className="w-10 h-10 p-0"
            onClick={() => setDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="font-semibold">
            {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </div>
          <button
            variant="outline"
            className="w-10 h-10 p-0"
            onClick={() => setDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <Calendar
          mode={mode}
          selected={selected}
          onSelect={(date) => {
            if (date && !isDateInTimeOff(date)) {
              onSelect(date);
            }
          }}
          month={date}
          modifiers={{
            timeoff: (date) => isDateInTimeOff(date),
          }}
          modifiersStyles={{
            timeoff: { 
              backgroundColor: '#FEF3C7', 
              color: '#92400E',
              cursor: 'not-allowed' 
            }
          }}
          disabled={(date) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date < today || isDateInTimeOff(date) || disableWeekends(date);
          }}
          components={{
            DayContent: ({ date }) => (
              <div className="relative w-full h-full flex items-center justify-center">
                <span>{date.getDate()}</span>
                {isDateInTimeOff(date) && (
                  <div className="absolute bottom-0 left-0 right-0 text-[8px] text-amber-800 truncate px-1">
                    {getTimeOffTitle(date)}
                  </div>
                )}
              </div>
            )
          }}
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
      </Card>
    </div>
  );
}
