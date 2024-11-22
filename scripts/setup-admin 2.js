require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

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
const auth = getAuth(app);
const db = getFirestore(app);

const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@example.com';
const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

async function setupAdmin() {
  try {
    let user;
    
    try {
      // Try to create new admin user
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      user = userCredential.user;
      console.log('New admin user created');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        // If user exists, sign in and update their document
        const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        user = userCredential.user;
        console.log('Existing admin user found');
      } else {
        throw error;
      }
    }

    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    // Create or update admin document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: adminEmail,
      isAdmin: true,
      status: 'active',
      createdAt: userDoc.exists() ? userDoc.data().createdAt : new Date(),
      updatedAt: new Date(),
    }, { merge: true });

    console.log('Admin user document updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up admin user:', error);
    process.exit(1);
  }
}

setupAdmin();
