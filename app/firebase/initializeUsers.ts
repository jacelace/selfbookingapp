'use client';

import { auth } from './clientApp';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, getFirestore } from 'firebase/firestore';
import { TEST_CREDENTIALS } from '../lib/constants';

const testUsers = {
  admin: {
    email: TEST_CREDENTIALS.email,
    password: TEST_CREDENTIALS.password,
    displayName: 'Admin User'
  },
  user: {
    email: 'user@test.com',
    password: 'user123',
    displayName: 'Test User'
  }
};

export async function initializeTestUsers() {
  const db = getFirestore();
  
  try {
    // Create admin user
    try {
      const adminUserCredential = await createUserWithEmailAndPassword(
        auth,
        TEST_CREDENTIALS.email,
        TEST_CREDENTIALS.password
      );
      
      // Set admin user document
      await setDoc(doc(db, 'users', adminUserCredential.user.uid), {
        email: TEST_CREDENTIALS.email,
        name: 'Admin',
        isAdmin: true,
        role: 'admin',
        isApproved: true,
        createdAt: new Date().toISOString(),
        totalBookings: 0,
        remainingBookings: 0,
        sessions: 0,
        totalSessions: 0
      });

      console.log('Admin user created successfully');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('Admin user already exists');
        // Sign in and ensure admin role
        const adminCredential = await signInWithEmailAndPassword(
          auth,
          TEST_CREDENTIALS.email,
          TEST_CREDENTIALS.password
        );

        const adminDoc = await getDoc(doc(db, 'users', adminCredential.user.uid));
        if (!adminDoc.exists()) {
          await setDoc(doc(db, 'users', adminCredential.user.uid), {
            email: TEST_CREDENTIALS.email,
            name: 'Admin',
            isAdmin: true,
            role: 'admin',
            isApproved: true,
            createdAt: new Date().toISOString(),
            totalBookings: 0,
            remainingBookings: 0,
            sessions: 0,
            totalSessions: 0
          });
        }
      } else {
        throw error;
      }
    }

    // Create regular test user
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        testUsers.user.email,
        testUsers.user.password
      );
      
      await updateProfile(userCredential.user, {
        displayName: testUsers.user.displayName
      });

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: testUsers.user.email,
        displayName: testUsers.user.displayName,
        isAdmin: false,
        createdAt: new Date().toISOString()
      });

      console.log('Test user created successfully');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('Test user already exists');
      } else {
        throw error;
      }
    }

    // Sign out after initialization
    await signOut(auth);
    console.log('Test users initialized successfully');
  } catch (error) {
    console.error('Error initializing test users:', error);
    throw error;
  }
}

export { testUsers };
