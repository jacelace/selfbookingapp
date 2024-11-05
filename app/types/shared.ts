export interface Label {
  id: string;
  name: string;
  color: string;
}

export type TimeString = 
  | '10:00 AM'
  | '11:00 AM'
  | '12:00 PM'
  | '1:00 PM'
  | '2:00 PM'
  | '3:00 PM';

export type RecurringOption = 'none' | 'weekly';

export type BookingStatus = 'confirmed' | 'cancelled';

export type BookingCount = number & { readonly __brand: unique symbol };
export type SessionCount = number & { readonly __brand: unique symbol };

export type UserRole = 'admin' | 'user';

export interface EnhancedUser {
  id: string;
  name: string;
  email: string;
  sessions: SessionCount;
  label: Label;
  totalBookings: BookingCount;
  remainingBookings: BookingCount;
  totalSessions: SessionCount;
  isAdmin: boolean;
  isApproved: boolean;
  role: UserRole;
}

export interface EnhancedBooking {
  id: string;
  userId: string;
  userName: string;
  userLabel: string;
  date: string;
  time: TimeString;
  recurring: RecurringOption;
  recurringCount?: number;
  status: BookingStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BookingFormData {
  date: Date;
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
}

export interface LabelFormData {
  name: string;
  color: string;
}
