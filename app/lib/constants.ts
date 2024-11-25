export const BOOKING_TIMES = [
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM'
] as const;

export type TimeString = typeof BOOKING_TIMES[number];

export type RecurringType = 'none' | 'weekly' | 'biweekly' | 'monthly';

export const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'testpassword123'
};
