'use client';

import React, { useState } from 'react';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
}

interface Booking {
  id: string;
  userId: string;
  date: Date;
  time: string;
}

const BookingCalendar: React.FC<{ onDateSelect: (date: Date) => void; selectedDate: Date | null, bookings: Booking[] }> = ({ onDateSelect, selectedDate, bookings }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const result: CalendarDay[] = [];

    // Add days from previous month
    for (let i = 0; i < firstDay.getDay(); i++) {
      const prevMonthDay = new Date(year, month, -i);
      result.unshift({ date: prevMonthDay, isCurrentMonth: false });
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      result.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Add days from next month
    const remainingDays = 42 - result.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonthDay = new Date(year, month + 1, i);
      result.push({ date: nextMonthDay, isCurrentMonth: false });
    }

    return result;
  };

  const days = getDaysInMonth(currentDate);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: CalendarDay) => {
    onDateSelect(day.date);
  };

  const hasBooking = (date: Date) => {
    return bookings.some(booking => booking.date.toDateString() === date.toDateString());
  };

  return (
    <div className="booking-calendar bg-white rounded-lg shadow-md text-sm w-full max-w-md">
      <div className="flex justify-between items-center p-4 border-b bg-gray-50">
        <button onClick={handlePrevMonth} className="text-blue-500 hover:text-blue-700 text-xl font-bold transition-colors duration-200">&lt;</button>
        <h2 className="text-xl font-semibold text-gray-800">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
        <button onClick={handleNextMonth} className="text-blue-500 hover:text-blue-700 text-xl font-bold transition-colors duration-200">&gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-1 p-4">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-center font-medium text-gray-500 mb-2">{day}</div>
        ))}
        {days.map((day, index) => (
          <div
            key={index}
            className={`calendar-day text-center p-2 cursor-pointer flex items-center justify-center rounded-full transition-all duration-200 ${
              day.isCurrentMonth ? 'hover:bg-blue-100' : 'text-gray-400'
            } ${
              selectedDate && day.date.toDateString() === selectedDate.toDateString()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : hasBooking(day.date) ? 'bg-green-200 hover:bg-green-300' : ''
            }`}
            onClick={() => handleDateClick(day)}
          >
            {day.date.getDate()}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingCalendar;