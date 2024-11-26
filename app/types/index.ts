import { Timestamp } from 'firebase/firestore';

export type TimeString = 
  | '10:00 AM'
  | '11:00 AM'
  | '12:00 PM'
  | '1:00 PM'
  | '2:00 PM'
  | '3:00 PM';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type RecurringType = 'none' | 'weekly' | 'biweekly' | 'monthly';
export type UserRole = 'admin' | 'user';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export type BookingCount = number;
export type SessionCount = number;

export interface Label {
  id: string;
  name: string;
  color: string;
  isDefault?: boolean;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  sessions?: SessionCount;
  labelId?: string;
  userLabel?: string;
  labelColor?: string;
  totalBookings?: BookingCount;
  remainingBookings?: BookingCount;
  totalSessions?: SessionCount;
  isAdmin?: boolean;
  isApproved?: boolean;
  role: UserRole;
  status?: UserStatus;
  createdAt: Date | Timestamp;
  createdBy?: string;
  updatedAt?: string;
}

export interface Booking {
  id: string;
  userId: string;
  userName?: string;
  userLabel?: string;
  userLabelColor?: string;
  date: Date | Timestamp;
  time: TimeString;
  status: BookingStatus;
  recurring: RecurringType;
  recurringCount?: number;
  notes?: string;
  labelId?: string;
  createdAt?: Date | Timestamp;
  createdBy?: string;
  updatedAt?: Date | Timestamp;
}

export type EnhancedBooking = Booking & {
  user?: User;
  label?: Label;
};

export interface EnhancedUser extends User {
  bookings?: Booking[];
}

export interface BookingFormData {
  date: Timestamp;
  time: TimeString;
  recurring: RecurringType;
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
