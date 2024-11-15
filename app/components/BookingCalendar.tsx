'use client';

import { useState } from "react";
import { Calendar } from "./ui/calendar";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { format } from "date-fns";

interface BookingCalendarProps {
  onDateSelect: (date: Date | undefined) => void;
  onTimeSelect: (time: string) => void;
  onBookingSubmit: () => void;
  onRecurringChange: (isRecurring: boolean, weeks: number) => void;
}

const TIME_SLOTS = [
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM"
];

export default function BookingCalendar({ 
  onDateSelect, 
  onTimeSelect, 
  onBookingSubmit,
  onRecurringChange 
}: BookingCalendarProps) {
  const [date, setDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState(TIME_SLOTS[0]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringWeeks, setRecurringWeeks] = useState(4);

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    onDateSelect(newDate);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    onTimeSelect(time);
  };

  const handleRecurringChange = (checked: boolean) => {
    setIsRecurring(checked);
    onRecurringChange(checked, recurringWeeks);
  };

  const handleWeeksChange = (weeks: number) => {
    setRecurringWeeks(weeks);
    onRecurringChange(isRecurring, weeks);
  };

  const handleBookingSubmit = () => {
    onBookingSubmit();
  };

  // Function to disable weekends
  const disableWeekends = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
  };

  return (
    <div className="relative">
      <Card className="w-full max-w-md mx-auto p-6 space-y-6 shadow-lg">
        <h1 className="text-2xl font-bold text-center">Book a 50-minute Session</h1>
        
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            className="rounded-md border"
            defaultMonth={new Date(2024, 9)} // October 2024
            disabled={disableWeekends}
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
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
          />
        </div>

        {date && (
          <div className="text-center py-3 border-t border-b border-gray-200 transition-all duration-300 ease-in-out transform translate-y-0 opacity-100">
            <div className="text-sm text-gray-600 mb-1">Selected Date</div>
            <div className="text-lg font-semibold text-purple-600">
              {format(date, 'EEEE, MMMM do, yyyy')}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Please select a time slot below
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {TIME_SLOTS.map((time) => (
            <Button
              key={time}
              variant={selectedTime === time ? "default" : "outline"}
              className={`w-full transition-colors duration-200 ${
                selectedTime === time 
                  ? "bg-purple-600 hover:bg-purple-700 text-white" 
                  : "hover:bg-gray-100"
              }`}
              onClick={() => handleTimeSelect(time)}
            >
              {time}
              <span className="text-xs ml-1 opacity-75">(50 min)</span>
            </Button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="recurring"
            checked={isRecurring}
            onCheckedChange={(checked) => handleRecurringChange(checked as boolean)}
          />
          <Label htmlFor="recurring">Make this a recurring weekly booking</Label>
        </div>

        {isRecurring && (
          <div className="flex items-center space-x-2">
            <Label htmlFor="weeks">Number of weeks:</Label>
            <select
              id="weeks"
              value={recurringWeeks}
              onChange={(e) => handleWeeksChange(Number(e.target.value))}
              className="border rounded p-1"
            >
              {[2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>{num} weeks</option>
              ))}
            </select>
          </div>
        )}

        <Button 
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg font-medium transition-colors duration-200"
          onClick={handleBookingSubmit}
          disabled={!date || !selectedTime}
        >
          Book Session{isRecurring ? 's' : ''}
        </Button>
      </Card>
    </div>
  );
}
