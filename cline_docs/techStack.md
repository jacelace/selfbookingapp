# Technology Stack

## Frontend
- Next.js 14 (React Framework)
- TypeScript
- Tailwind CSS for styling
- shadcn/ui for UI components

## Backend
- Firebase Authentication for user management
- Firebase Firestore for database
- Firebase Cloud Functions for serverless operations

## Authentication & Authorization
- Firebase Authentication for user management
- Custom role-based access control
- Email verification through Firebase

## Database Schema

### Users Collection
```typescript
interface User {
  uid: string;
  email: string;
  displayName?: string;
  isApproved: boolean;
  role: 'admin' | 'user';
  createdAt: Timestamp;
  lastLogin: Timestamp;
  bookingLimit?: number;
}
```

### Bookings Collection
```typescript
interface Booking {
  id: string;
  userId: string;
  startTime: Timestamp;
  endTime: Timestamp;
  status: 'pending' | 'confirmed' | 'cancelled';
  type: 'regular' | 'recurring';
  recurringId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
}
```

### RecurringBookings Collection
```typescript
interface RecurringBooking {
  id: string;
  userId: string;
  dayOfWeek: number;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  createdAt: Timestamp;
  updatedAt: Timestamp;
  active: boolean;
}
```

## Development Tools
- VS Code as IDE
- Git for version control
- ESLint for code linting
- Prettier for code formatting

## Testing
- Jest for unit testing
- React Testing Library for component testing
- Firebase Emulator for local development

## Deployment
- Vercel for frontend hosting
- Firebase for backend services
