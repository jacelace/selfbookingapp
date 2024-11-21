import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin with service account
const serviceAccount = {
  type: "service_account",
  project_id: "therapy-session-booking-app",
  private_key_id: "8c63f91310e7b7f9f6a2c1a2f0c9f9c9f9c9f9c9",
  private_key: process.env.FIREBASE_PRIVATE_KEY,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: "116825894772663913499",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-10si4%40therapy-session-booking-app.iam.gserviceaccount.com"
};

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(app);

async function clearData() {
  try {
    // Get admin user email for preservation
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.get();
    let adminEmail = '';
    
    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      if (userData.role === 'admin') {
        adminEmail = userData.email;
        console.log('Found admin email:', adminEmail);
      }
    });

    if (!adminEmail) {
      console.log('Warning: No admin user found!');
      return;
    }

    // Clear bookings collection
    const bookingsRef = db.collection('bookings');
    const bookingsSnapshot = await bookingsRef.get();
    console.log(`Deleting ${bookingsSnapshot.size} bookings...`);
    
    const bookingDeletePromises = bookingsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(bookingDeletePromises);
    console.log('All bookings deleted successfully');

    // Clear users collection except admin
    const userDocs = usersSnapshot.docs.filter(doc => doc.data().email !== adminEmail);
    console.log(`Deleting ${userDocs.length} non-admin users...`);
    
    const userDeletePromises = userDocs.map(doc => doc.ref.delete());
    await Promise.all(userDeletePromises);
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { getAuth, listUsers } from 'firebase/auth';

// Your Firebase configuration
const firebaseConfig = {
  // Add your config here from .env.local
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearData() {
  try {
    // Get admin user email for preservation
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    let adminEmail = '';
    
    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      if (userData.role === 'admin') {
        adminEmail = userData.email;
        console.log('Found admin email:', adminEmail);
      }
    });

    if (!adminEmail) {
      console.log('Warning: No admin user found!');
      return;
    }

    // Clear bookings collection
    const bookingsRef = collection(db, 'bookings');
    const bookingsSnapshot = await getDocs(bookingsRef);
    console.log(`Deleting ${bookingsSnapshot.size} bookings...`);
    
    for (const bookingDoc of bookingsSnapshot.docs) {
      await deleteDoc(doc(db, 'bookings', bookingDoc.id));
    }
    console.log('All bookings deleted successfully');

    // Clear users collection except admin
    const userDocs = usersSnapshot.docs.filter(doc => doc.data().email !== adminEmail);
    console.log(`Deleting ${userDocs.length} non-admin users...`);
    
    for (const userDoc of userDocs) {
      await deleteDoc(doc(db, 'users', userDoc.id));
    }
    console.log('All non-admin users deleted successfully');

    console.log('Data clearing completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing data:', error);
    process.exit(1);
  }
}

clearData();
