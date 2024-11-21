import { Timestamp } from 'firebase/firestore';

export interface Label {
  id: string;
  name: string;
  color: string;
  isDefault?: boolean;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
}

export type TimeString = 
  | '10:00 AM'
  | '11:00 AM'
  | '12:00 PM'
  | '1:00 PM'
  | '2:00 PM'
  | '3:00 PM';

export type RecurringOption = 'none' | 'weekly' | 'biweekly' | 'monthly';

export type BookingStatus = 'confirmed' | 'cancelled';

export type BookingCount = number;
export type SessionCount = number;

export type UserRole = 'admin' | 'user';

export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface EnhancedUser {
  id: string;
  name: string;
  email: string;
  sessions: SessionCount;
  labelId: string;
  userLabel: string;
  labelColor: string;
  totalBookings: BookingCount;
  remainingBookings: BookingCount;
  totalSessions: SessionCount;
  isAdmin: boolean;
  isApproved: boolean;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
}

export interface EnhancedBooking {
  id: string;
  userId: string;
  userName: string;
  userLabel: string;
  userLabelColor: string;
  date: Timestamp;
  time: TimeString;
  recurring: RecurringOption;
  recurringCount?: number;
  status: BookingStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
}

export interface BookingFormData {
  date: Timestamp;
  time: TimeString;
  recurring: RecurringOption;
  recurringCount?: number;
}

export interface UserFormData {
  name: string;
  email: string;
  labelId: string;
  totalBookings: number;
  isAdmin?: boolean;
  isApproved?: boolean;
  role?: UserRole;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
}

export interface LabelFormData {
  name: string;
  color: string;
  isDefault?: boolean;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
}
