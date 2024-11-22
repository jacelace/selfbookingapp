import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EnhancedBooking } from '../types';

interface CustomCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  bookings: EnhancedBooking[];
}

export const CustomCalendar: React.FC<CustomCalendarProps> = ({ selectedDate, onDateSelect, bookings }) => {
  const [currentMonth, setCurrentMonth] = useState<number>(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState<number>(selectedDate.getFullYear());

  useEffect(() => {
    setCurrentMonth(selectedDate.getMonth());
    setCurrentYear(selectedDate.getFullYear());
  }, [selectedDate]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const handlePrevMonth = (): void => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = (): void => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (day: number): void => {
    onDateSelect(new Date(currentYear, currentMonth, day));
  };

  const getBookingsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return bookings.filter(booking => {
      const bookingDate = booking.date instanceof Date 
        ? booking.date.toISOString() 
        : booking.date.toDate().toISOString();
      return bookingDate.split('T')[0] === dateString;
    });
  };

  const getBookingColor = (userLabel?: string): string => {
    if (!userLabel) return 'bg-gray-500';
    switch (userLabel.toLowerCase()) {
      case 'vip':
        return 'bg-yellow-200';
      case 'regular':
        return 'bg-blue-200';
      default:
        return 'bg-gray-200';
    }
  };

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-200" aria-label="Previous month">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-lg font-semibold">
          {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-200" aria-label="Next month">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map((day) => (
          <div key={day} className="font-medium text-sm p-2">
            {day}
          </div>
        ))}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="p-2"></div>
        ))}
        {days.map((day) => {
          const currentDate = new Date(currentYear, currentMonth, day);
          const dayBookings = getBookingsForDate(currentDate);
          return (
            <button
              key={day}
              className={`p-2 h-auto ${
                selectedDate.toDateString() === currentDate.toDateString()
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-200'
              }`}
              onClick={() => handleDateClick(day)}
            >
              <div className="relative w-full aspect-square flex flex-col justify-between">
                <span>{day}</span>
                {dayBookings.length > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-1">
                    {dayBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className={`w-2 h-2 rounded-full ${getBookingColor(booking.userLabel)}`}
                        title={`${booking.userName} (${booking.userLabel}): ${booking.time}`}
                      ></div>
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
