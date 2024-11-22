'use client';

import { Button } from './ui/button';
import { Calendar } from 'lucide-react';
import { EnhancedBooking } from '../types';

export interface AddToGoogleCalendarProps {
  booking: EnhancedBooking;
  className?: string;
}

export default function AddToGoogleCalendar({ booking, className }: AddToGoogleCalendarProps) {
  const createGoogleCalendarUrl = () => {
    const [hours, minutes] = booking.time.split(':');
    const startDate = new Date(booking.date instanceof Date ? booking.date : booking.date.toDate());
    startDate.setHours(parseInt(hours), parseInt(minutes), 0);
    
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 50); // 50-minute session

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: 'Therapy Session',
      dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
      details: `Therapy session with ${booking.userName || 'your therapist'}`,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={() => window.open(createGoogleCalendarUrl(), '_blank')}
    >
      <Calendar className="mr-2 h-4 w-4" />
      Add to Google Calendar
    </Button>
  );
}
