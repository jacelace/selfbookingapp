import '@testing-library/jest-dom';
import { fireEvent, waitFor, render } from '@testing-library/react';
import * as firebaseMock from '../__mocks__/firebase';

// Mock process.env
process.env = {
  ...process.env,
  NEXT_PUBLIC_FIREBASE_API_KEY: 'test-api-key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test-auth-domain',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test-project-id',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'test-storage-bucket',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: 'test-sender-id',
  NEXT_PUBLIC_FIREBASE_APP_ID: 'test-app-id',
  TZ: 'UTC',
};

// Mock Firebase App
jest.mock('firebase/app', () => ({
  ...firebaseMock,
  initializeApp: firebaseMock.initializeApp,
  getApp: firebaseMock.getApp,
  getApps: firebaseMock.getApps
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  ...firebaseMock,
  getAuth: firebaseMock.getAuth,
  signInWithEmailAndPassword: firebaseMock.signInWithEmailAndPassword,
  createUserWithEmailAndPassword: firebaseMock.createUserWithEmailAndPassword,
  signOut: firebaseMock.signOut,
  onAuthStateChanged: firebaseMock.onAuthStateChanged
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  ...firebaseMock,
  getFirestore: firebaseMock.getFirestore,
  collection: firebaseMock.collection,
  doc: firebaseMock.doc,
  getDoc: firebaseMock.getDoc,
  getDocs: firebaseMock.getDocs,
  setDoc: firebaseMock.setDoc,
  addDoc: firebaseMock.addDoc,
  updateDoc: firebaseMock.updateDoc,
  deleteDoc: firebaseMock.deleteDoc,
  query: firebaseMock.query,
  where: firebaseMock.where,
  orderBy: firebaseMock.orderBy,
  limit: firebaseMock.limit,
  Timestamp: firebaseMock.Timestamp
}));

// Mock window methods
window.scrollTo = jest.fn();
window.scrollBy = jest.fn();

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;

// Mock IntersectionObserver
class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.IntersectionObserver = IntersectionObserver;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Export testing utilities and mocks
export { render, fireEvent, waitFor };
export {
  mockAuth,
  mockDocRef,
  mockCollectionRef,
  mockQuerySnapshot,
  mockDocSnapshot,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from '../__mocks__/firebase';
