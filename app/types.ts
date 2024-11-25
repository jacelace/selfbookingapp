import { Timestamp } from 'firebase/firestore';

export interface EnhancedUser {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  remainingBookings: number;
  totalBookings?: number;
  totalSessions?: number;
  sessions?: number;
  status?: string;
  isApproved?: boolean;
  isAdmin?: boolean;
  role?: string;
  labelId?: string;
  userLabel?: string;
  labelColor?: string;
  labelName?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type TimeString = '10:00 AM' | '11:00 AM' | '12:00 PM' | '1:00 PM' | '2:00 PM' | '3:00 PM';

export type RecurringType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface EnhancedBooking {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userLabel?: string;
  userLabelColor?: string;
  labelId?: string;
  date: Timestamp;
  time: TimeString;
  status: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  recurring?: RecurringType;
  recurringCount?: number;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  isDefault?: boolean;
  createdAt?: Timestamp;
}
