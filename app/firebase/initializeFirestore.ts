'use client';

import { collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from './clientApp';
import { Label } from '../types/shared';

const defaultLabels: Omit<Label, 'id'>[] = [
  { name: 'Regular', color: '#4CAF50' },
  { name: 'Premium', color: '#2196F3' },
  { name: 'VIP', color: '#9C27B0' }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function initializeFirestore() {
  try {
    // Add a small delay to ensure Firebase is fully initialized
    await delay(1000);

    // First, try to read from labels collection to test connection
    console.log('Testing Firestore connection...');
    const labelsRef = collection(db, 'labels');
    const labelsSnapshot = await getDocs(labelsRef);

    // If labels collection is empty, initialize with default data
    if (labelsSnapshot.empty) {
      console.log('Creating default labels...');
      for (const label of defaultLabels) {
        await addDoc(labelsRef, {
          ...label,
          createdAt: new Date().toISOString()
        });
      }
      console.log('Default labels created successfully');
    } else {
      console.log('Labels collection already exists');
    }

    // Initialize or verify collections
    const collections = ['users', 'bookings'];
    for (const collectionName of collections) {
      const collRef = collection(db, collectionName);
      const snapshot = await getDocs(collRef);

      if (snapshot.empty) {
        console.log(`Initializing ${collectionName} collection...`);
        // Create a dummy document to initialize the collection
        await setDoc(doc(collRef, 'dummy'), {
          isDummy: true,
          createdAt: new Date().toISOString()
        });
      }
      console.log(`${collectionName} collection verified`);
    }

    return { success: true, message: 'Firestore initialized successfully' };
  } catch (error: any) {
    console.error('Error initializing Firestore:', error);
    // Add more specific error handling
    if (error.code === 'permission-denied') {
      return { 
        success: false, 
        message: 'Permission denied. Please check Firestore rules.'
      };
    }
    if (error.code === 'unavailable') {
      return { 
        success: false, 
        message: 'Firestore is currently unavailable. Please try again later.'
      };
    }
    return { 
      success: false, 
      message: `Failed to initialize Firestore: ${error.message}`
    };
  }
}
