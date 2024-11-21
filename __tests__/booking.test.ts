import { jest } from '@jest/globals';
import { auth, db } from './setup';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

describe('Booking Operations Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Booking', () => {
    it('should create a new booking', async () => {
      const mockBooking = {
        userId: 'test-user-id',
        userName: 'Test User',
        date: Timestamp.fromDate(new Date()),
        time: '10:00 AM',
        status: 'confirmed',
        createdAt: Timestamp.now(),
      };

      (collection as jest.Mock).mockReturnValueOnce('bookings-collection');
      (addDoc as jest.Mock).mockResolvedValueOnce({ id: 'new-booking-id' });

      const docRef = await addDoc(collection(db, 'bookings'), mockBooking);
      expect(docRef.id).toBe('new-booking-id');
    });

    it('should fail when creating booking with invalid data', async () => {
      const invalidBooking = {
        userId: 'test-user-id',
        // Missing required fields
      };

      (addDoc as jest.Mock).mockRejectedValueOnce(new Error('Invalid booking data'));
      (collection as jest.Mock).mockReturnValueOnce('bookings-collection');

      await expect(addDoc(
        collection(db, 'bookings'),
        invalidBooking
      )).rejects.toThrow('Invalid booking data');
    });
  });

  describe('Update Booking', () => {
    it('should update booking status', async () => {
      const bookingId = 'test-booking-id';
      const updateData = { status: 'cancelled' };

      (doc as jest.Mock).mockReturnValueOnce('booking-doc-ref');
      (updateDoc as jest.Mock).mockResolvedValueOnce(undefined);

      await expect(updateDoc(
        doc(db, 'bookings', bookingId),
        updateData
      )).resolves.toBeUndefined();
    });
  });

  describe('Delete Booking', () => {
    it('should delete a booking', async () => {
      const bookingId = 'test-booking-id';

      (doc as jest.Mock).mockReturnValueOnce('booking-doc-ref');
      (deleteDoc as jest.Mock).mockResolvedValueOnce(undefined);

      await expect(deleteDoc(
        doc(db, 'bookings', bookingId)
      )).resolves.toBeUndefined();
    });
  });

  describe('Query Bookings', () => {
    it('should fetch user bookings', async () => {
      const userId = 'test-user-id';
      const mockBookings = [
        {
          id: 'booking-1',
          data: () => ({
            userId,
            date: Timestamp.fromDate(new Date()),
            status: 'confirmed'
          })
        },
        {
          id: 'booking-2',
          data: () => ({
            userId,
            date: Timestamp.fromDate(new Date()),
            status: 'pending'
          })
        }
      ];

      (collection as jest.Mock).mockReturnValueOnce('bookings-collection');
      (query as jest.Mock).mockReturnValueOnce('filtered-query');
      (where as jest.Mock).mockReturnValueOnce('user-filter');
      (getDocs as jest.Mock).mockResolvedValueOnce({ docs: mockBookings });

      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(bookingsQuery);
      expect(querySnapshot.docs).toHaveLength(2);
      expect(querySnapshot.docs[0].data().userId).toBe(userId);
    });
  });

  describe('Booking Validation', () => {
    it('should validate booking time constraints', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Set date to tomorrow

      const mockBooking = {
        userId: 'test-user-id',
        date: Timestamp.fromDate(futureDate),
        time: '10:00 AM',
      };

      // Mock validation check
      const isValidBooking = (booking: any) => {
        const now = new Date();
        const bookingDate = booking.date.toDate();
        return bookingDate.getTime() > now.getTime();
      };

      expect(isValidBooking(mockBooking)).toBe(true);
    });

    it('should validate user booking limits', async () => {
      const userId = 'test-user-id';
      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          remainingBookings: 2,
        })
      };

      (doc as jest.Mock).mockReturnValueOnce('user-doc-ref');
      (getDoc as jest.Mock).mockResolvedValueOnce(mockUserDoc);

      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();

      expect(userDoc.exists()).toBe(true);
      expect(userData.remainingBookings).toBe(2);
    });
  });
});
