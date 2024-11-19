# Codebase Summary

## Key Components and Their Interactions

### Authentication Components
- FirebaseProvider: Manages authentication state and user context
- ErrorBoundary: Handles application-wide error catching
- Home Page: Implements a multi-tab authentication system (Sign Up, Sign In, Admin)

### Booking System Components
- BookingCalendar: Calendar interface for session selection
- BookingForm: User booking form with time slot selection
- AdminBookingForm: Enhanced booking management for administrators
- UserBookings: Displays user's booking history
- BookingSummary: Shows booking confirmation details

### Admin Components
- AdminDashboard: Central admin control panel
- UserManagement: User approval and session management
- BookingManagement: Booking oversight and modification
- LabelManagement: Customizable label system
- TimeOffManagement: Staff availability and time-off period management

### UI Components
- LoadingSpinner: Consistent loading state indicator
- Button: Enhanced button component with multiple variants including gradient styles
  - Purple to Pink gradient for User Management
  - Rose to Orange gradient for Time Off Management
  - Blue to Purple gradient for Booking Management
- Card, Input, Select: Shadcn/UI components for consistent styling
- Toast: Notification system for user feedback

## Data Flow
1. Authentication Flow:
   - User signs up → Pending approval state
   - Admin approves user → User gains booking access
   - Sign in redirects based on role (user/admin)

2. Booking Flow:
   - User selects date → Available time slots displayed
   - Time slot selection → Booking confirmation
   - Successful booking → Updates user's remaining sessions
   - Booking confirmation → Success page with details

3. Admin Flow:
   - User management: Approve/manage user permissions
   - Booking management: View/modify all bookings
   - Session management: Allocate/modify user sessions
   - Time-off management: Set staff availability periods

## External Dependencies
- Firebase Authentication: User management
- Firebase Firestore: Database storage
  - Enhanced security rules for all collections
  - Role-based access control
  - Collection-specific permissions
- Next.js 14: React framework
- Tailwind CSS: Styling
- shadcn/ui: UI component library
- TypeScript: Type safety

## Recent Significant Changes
1. Enhanced authentication system with approval workflow
2. Improved booking interface with real-time availability
3. Added admin dashboard with comprehensive management tools
4. Implemented toast notifications for better user feedback
5. Added gradient button styles for improved visual hierarchy
6. Implemented time-off management system
7. Updated Firebase security rules for all collections

## Code Organization
- /app: Next.js 14 app directory structure
  - /components: Reusable React components
  - /contexts: Application-wide state management
  - /firebase: Firebase configuration and utilities
  - /lib: Utility functions and constants
  - /types: TypeScript type definitions

## User Feedback Integration
- Toast notifications for all major actions
- Clear error messages for authentication issues
- Loading states for async operations
- Intuitive booking interface with real-time feedback
- Admin approval status notifications
