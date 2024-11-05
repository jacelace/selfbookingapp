'use client';

import { auth } from './clientApp';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, getAuth, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, getFirestore } from 'firebase/firestore';

const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'admin123',
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
        testUsers.admin.email,
        testUsers.admin.password
      );
      
      // Set admin user profile
      await updateProfile(adminUserCredential.user, {
        displayName: testUsers.admin.displayName
      });

      // Set admin custom claims in Firestore (since we can't set custom claims directly)
      await setDoc(doc(db, 'users', adminUserCredential.user.uid), {
        email: testUsers.admin.email,
        displayName: testUsers.admin.displayName,
        isAdmin: true,
        createdAt: new Date().toISOString()
      });

      console.log('Admin user created successfully');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('Admin user already exists');
        // Ensure admin user has proper role in Firestore
        const adminCredential = await signInWithEmailAndPassword(
          auth,
          testUsers.admin.email,
          testUsers.admin.password
        );
        await setDoc(doc(db, 'users', adminCredential.user.uid), {
          email: testUsers.admin.email,
          displayName: testUsers.admin.displayName,
          isAdmin: true,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        await signOut(auth);
      } else {
        throw error;
      }
    }

    // Create regular user
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        testUsers.user.email,
        testUsers.user.password
      );
      
      // Set user profile
      await updateProfile(userCredential.user, {
        displayName: testUsers.user.displayName
      });

      // Set user data in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: testUsers.user.email,
        displayName: testUsers.user.displayName,
        isAdmin: false,
        createdAt: new Date().toISOString()
      });

      console.log('Regular user created successfully');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('Regular user already exists');
        // Update regular user data in Firestore
        const userCredential = await signInWithEmailAndPassword(
          auth,
          testUsers.user.email,
          testUsers.user.password
        );
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: testUsers.user.email,
          displayName: testUsers.user.displayName,
          isAdmin: false,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        await signOut(auth);
      } else {
        throw error;
      }
    }

    // Sign out after creating/updating users
    await signOut(auth);
    
    return { success: true, message: 'Test users initialized successfully' };
  } catch (error: any) {
    console.error('Error initializing test users:', error);
    return { success: false, message: error.message };
  }
}

export { testUsers };
