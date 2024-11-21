// Mock data
export const mockUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User'
};

export const mockAuth = {
  currentUser: mockUser,
  signOut: jest.fn()
};

export const mockDocRef = {
  id: 'test-doc-id'
};

export const mockCollectionRef = {
  id: 'test-collection-id'
};

export const mockDocSnapshot = {
  exists: jest.fn(() => true),
  data: jest.fn(() => ({ ...mockUser })),
  id: 'test-doc-id'
};

export const mockQuerySnapshot = {
  docs: [mockDocSnapshot],
  empty: false,
  size: 1,
  forEach: jest.fn((callback) => {
    callback(mockDocSnapshot);
  })
};

// Mock Firestore instance
const mockFirestoreInstance = {
  collection: jest.fn(() => mockCollectionRef),
  doc: jest.fn(() => mockDocRef),
  _delete: jest.fn(),
  app: {
    _getProvider: jest.fn(() => ({
      getImmediate: jest.fn(() => mockFirestoreInstance)
    }))
  }
};

// Mock Firebase instance
const mockFirebaseInstance = {
  _getProvider: jest.fn(() => ({
    getImmediate: jest.fn(() => mockFirestoreInstance)
  })),
  _removeServiceInstance: jest.fn(),
  _addComponent: jest.fn(),
  _addOrOverwriteComponent: jest.fn(),
  _registerComponent: jest.fn(),
  options: {
    apiKey: 'test-api-key',
    authDomain: 'test-auth-domain',
    projectId: 'test-project-id',
    storageBucket: 'test-storage-bucket',
    messagingSenderId: 'test-sender-id',
    appId: 'test-app-id',
  },
  name: '[DEFAULT]',
  automaticDataCollectionEnabled: false
};

// Firebase App mocks
export const initializeApp = jest.fn(() => mockFirebaseInstance);
export const getApp = jest.fn(() => mockFirebaseInstance);
export const getApps = jest.fn(() => []);

// Firebase Auth mocks
export const getAuth = jest.fn(() => mockAuth);
export const signInWithEmailAndPassword = jest.fn().mockResolvedValue({ user: mockUser });
export const createUserWithEmailAndPassword = jest.fn().mockResolvedValue({ user: mockUser });
export const signOut = jest.fn().mockResolvedValue(undefined);
export const onAuthStateChanged = jest.fn((auth, callback) => {
  callback(mockUser);
  return () => {};
});

// Firestore mocks
export const getFirestore = jest.fn(() => mockFirestoreInstance);
export const collection = jest.fn(() => mockCollectionRef);
export const doc = jest.fn(() => mockDocRef);
export const getDoc = jest.fn().mockResolvedValue(mockDocSnapshot);
export const getDocs = jest.fn().mockResolvedValue(mockQuerySnapshot);
export const setDoc = jest.fn().mockResolvedValue(undefined);
export const addDoc = jest.fn().mockResolvedValue(mockDocRef);
export const updateDoc = jest.fn().mockResolvedValue(undefined);
export const deleteDoc = jest.fn().mockResolvedValue(undefined);

// Query mocks
export const query = jest.fn(() => ({}));
export const where = jest.fn(() => ({}));
export const orderBy = jest.fn(() => ({}));
export const limit = jest.fn(() => ({}));

// Timestamp mock
export class Timestamp {
  seconds: number;
  nanoseconds: number;

  constructor(seconds: number, nanoseconds: number = 0) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }

  static now() {
    return new Timestamp(Math.floor(Date.now() / 1000));
  }

  static fromDate(date: Date) {
    return new Timestamp(Math.floor(date.getTime() / 1000));
  }

  toDate() {
    return new Date(this.seconds * 1000);
  }
}
