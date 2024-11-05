'use client';

import { Button } from './ui/button';
import { Calendar } from 'lucide-react';

export interface AddToGoogleCalendarProps {
  date: Date;
  slot: string;
  className?: string;
}

export default function AddToGoogleCalendar({ date, slot, className }: AddToGoogleCalendarProps) {
  const createGoogleCalendarUrl = () => {
    const [hours, minutes] = slot.split(':');
    const startDate = new Date(date);
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
      details: 'Your therapy session',
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
      <Calendar className="w-4 h-4 mr-2" />
      Add to Google Calendar
    </Button>
  );
}
