import { Timestamp } from 'firebase/firestore';

export function createGoogleCalendarUrl(booking: {
  date: Timestamp;
  time: string;
  title?: string;
  description?: string;
}) {
  // Parse the date and time
  const bookingDate = booking.date.toDate();
  const [hours, minutes] = booking.time.match(/(\d+):(\d+)/)?.slice(1).map(Number) || [0, 0];
  const isPM = booking.time.toLowerCase().includes('pm');
  
  // Convert to 24-hour format if PM
  const hour24 = isPM && hours !== 12 ? hours + 12 : hours;

  // Set start and end times
  const startTime = new Date(bookingDate);
  startTime.setHours(hour24, minutes);
  
  const endTime = new Date(startTime);
  endTime.setHours(startTime.getHours() + 1); // 1-hour duration

  // Format dates for Google Calendar URL
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '');
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: booking.title || 'Booking Session',
    dates: `${formatDate(startTime)}/${formatDate(endTime)}`,
    details: booking.description || 'Booking session created via Self Booking App',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
