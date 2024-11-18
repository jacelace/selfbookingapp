import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/clientApp';

export async function validateBookingTime(bookingTime: Date): Promise<{ isValid: boolean; error?: string }> {
  try {
    // Get the current booking settings
    const settingsDoc = await getDoc(doc(db, 'settings', 'booking'));
    const timeLimit = settingsDoc.exists() ? settingsDoc.data().timeLimit || 48 : 48;

    const now = new Date();
    const hoursDifference = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDifference > timeLimit) {
      return {
        isValid: false,
        error: `Bookings can only be made up to ${timeLimit} hours in advance`
      };
    }

    if (hoursDifference < 0) {
      return {
        isValid: false,
        error: 'Cannot book appointments in the past'
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Error validating booking time:', error);
    return {
      isValid: false,
      error: 'Failed to validate booking time'
    };
  }
}

export async function validateCancellation(bookingTime: Date): Promise<{ isValid: boolean; error?: string }> {
  try {
    // Get the current booking settings
    const settingsDoc = await getDoc(doc(db, 'settings', 'booking'));
    const cancelTimeLimit = settingsDoc.exists() ? settingsDoc.data().cancelTimeLimit || 24 : 24;

    const now = new Date();
    const hoursDifference = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDifference < cancelTimeLimit) {
      return {
        isValid: false,
        error: `Appointments must be cancelled at least ${cancelTimeLimit} hours before the scheduled time`
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Error validating cancellation:', error);
    return {
      isValid: false,
      error: 'Failed to validate cancellation time'
    };
  }
}
