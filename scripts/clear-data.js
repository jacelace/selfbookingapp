import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Admin email that should be preserved
const ADMIN_EMAIL = 'admin@therapybooking.com';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearData() {
  try {
    // Get admin user document
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    // Delete all users except admin
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      if (userData.email !== ADMIN_EMAIL) {
        await deleteDoc(doc(db, 'users', userDoc.id));
        console.log(`Deleted user: ${userData.email}`);
      } else {
        console.log(`Preserved admin user: ${userData.email}`);
      }
    }

    // Clear all bookings
    const bookingsRef = collection(db, 'bookings');
    const bookingsSnapshot = await getDocs(bookingsRef);
    for (const bookingDoc of bookingsSnapshot.docs) {
      await deleteDoc(doc(db, 'bookings', bookingDoc.id));
      console.log(`Deleted booking: ${bookingDoc.id}`);
    }

    console.log('Successfully cleared data while preserving admin credentials');
  } catch (error) {
    console.error('Error clearing data:', error);
    process.exit(1);
  }
}

clearData();
