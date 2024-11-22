import { Timestamp } from 'firebase/firestore';

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface EnhancedUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  labels?: Label[];
  createdAt: Timestamp;
}

export interface EnhancedBooking {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  date: Timestamp;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
  labels?: Label[];
}
