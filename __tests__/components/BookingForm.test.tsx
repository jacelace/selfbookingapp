import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookingForm from '@/app/components/BookingForm';
import { AuthContext } from '@/app/contexts/auth-context';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth } from '@/app/firebase/clientApp';
import { toast } from '@/app/components/ui/use-toast';

// Mock Firebase functions
jest.mock('firebase/firestore');
jest.mock('@/app/firebase/clientApp', () => ({
  auth: {
    currentUser: {
      uid: 'test-uid',
      email: 'test@example.com',
    },
  },
  db: {},
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock toast
jest.mock('@/app/components/ui/use-toast', () => ({
  toast: jest.fn(),
}));

describe('BookingForm Component', () => {
  const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  const mockAuthContext = {
    user: mockUser,
    loading: false,
    error: null,
    signInWithTest: jest.fn(),
    signInWithCredentials: jest.fn(),
    logout: jest.fn(),
  };

  const defaultProps = {
    selectedDate: new Date('2024-01-01T00:00:00.000Z'),
    selectedSlot: '10:00',
    onCancel: jest.fn(),
  };

  const mockUserData = {
    isApproved: true,
    remainingBookings: 10,
    totalBookings: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getDoc as jest.Mock).mockResolvedValue({
      data: () => mockUserData,
      exists: () => true,
    });
    (addDoc as jest.Mock).mockResolvedValue({ id: 'test-booking-id' });
    (updateDoc as jest.Mock).mockResolvedValue(undefined);
  });

  const renderWithAuth = (component: React.ReactNode) => {
    return render(
      <AuthContext.Provider value={mockAuthContext}>
        {component}
      </AuthContext.Provider>
    );
  };

  it('renders the booking form correctly', () => {
    renderWithAuth(<BookingForm {...defaultProps} />);

    expect(screen.getByRole('heading', { name: /confirm booking/i })).toBeInTheDocument();
    expect(screen.getByText(defaultProps.selectedDate.toLocaleDateString())).toBeInTheDocument();
    expect(screen.getByText(defaultProps.selectedSlot)).toBeInTheDocument();
    expect(screen.getByLabelText(/make this a recurring weekly booking/i)).toBeInTheDocument();
  });

  it('handles single booking submission successfully', async () => {
    const user = userEvent.setup();
    renderWithAuth(<BookingForm {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /confirm booking/i }));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'test-uid',
          date: defaultProps.selectedDate,
          slot: defaultProps.selectedSlot,
          isRecurring: false,
        })
      );
      expect(updateDoc).toHaveBeenCalled();
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Success',
          description: 'Booking created successfully',
        })
      );
    });
  });

  it('handles recurring booking submission successfully', async () => {
    const user = userEvent.setup();
    renderWithAuth(<BookingForm {...defaultProps} />);

    await user.click(screen.getByRole('checkbox', { name: /make this a recurring weekly booking/i }));
    const weekSelect = screen.getByRole('combobox');
    await user.selectOptions(weekSelect, '4');
    await user.click(screen.getByRole('button', { name: /confirm booking/i }));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledTimes(4); // Called once for each week
      expect(updateDoc).toHaveBeenCalled();
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Success',
          description: 'Created 4 recurring bookings successfully',
        })
      );
    });
  });

  it('shows error when user is not approved', async () => {
    const user = userEvent.setup();
    (getDoc as jest.Mock).mockResolvedValue({
      data: () => ({ ...mockUserData, isApproved: false }),
      exists: () => true,
    });

    renderWithAuth(<BookingForm {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /confirm booking/i }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          description: 'Your account is not approved for booking',
        })
      );
    });
  });

  it('shows error when user has no remaining bookings', async () => {
    const user = userEvent.setup();
    (getDoc as jest.Mock).mockResolvedValue({
      data: () => ({ ...mockUserData, remainingBookings: 0 }),
      exists: () => true,
    });

    renderWithAuth(<BookingForm {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /confirm booking/i }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          description: 'You have no remaining booking sessions',
        })
      );
    });
  });

  it('shows error when user has insufficient sessions for recurring booking', async () => {
    const user = userEvent.setup();
    (getDoc as jest.Mock).mockResolvedValue({
      data: () => ({ ...mockUserData, remainingBookings: 2 }),
      exists: () => true,
    });

    renderWithAuth(<BookingForm {...defaultProps} />);
    
    await user.click(screen.getByRole('checkbox', { name: /make this a recurring weekly booking/i }));
    const weekSelect = screen.getByRole('combobox');
    await user.selectOptions(weekSelect, '4');
    await user.click(screen.getByRole('button', { name: /confirm booking/i }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          description: 'You need at least 4 remaining sessions for recurring bookings',
        })
      );
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderWithAuth(<BookingForm {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });
});
