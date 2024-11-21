import { jest } from '@jest/globals';
import { auth } from './setup';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

describe('Authentication Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Sign Up', () => {
    it('should create a new regular user account', async () => {
      const mockUserCredential = {
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
        },
      };

      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce(mockUserCredential);
      (setDoc as jest.Mock).mockResolvedValueOnce(undefined);

      await expect(createUserWithEmailAndPassword(
        auth,
        'test@example.com',
        'password123'
      )).resolves.toEqual(mockUserCredential);
    });

    it('should fail with invalid email', async () => {
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(new Error('Invalid email'));

      await expect(createUserWithEmailAndPassword(
        auth,
        'invalid-email',
        'password123'
      )).rejects.toThrow('Invalid email');
    });
  });

  describe('User Sign In', () => {
    it('should sign in existing user', async () => {
      const mockUserCredential = {
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
        },
      };

      (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce(mockUserCredential);
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          role: 'user',
          email: 'test@example.com',
        }),
      });

      await expect(signInWithEmailAndPassword(
        auth,
        'test@example.com',
        'password123'
      )).resolves.toEqual(mockUserCredential);
    });

    it('should sign in admin user', async () => {
      const mockUserCredential = {
        user: {
          uid: 'admin-uid',
          email: 'admin@example.com',
        },
      };

      (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce(mockUserCredential);
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          role: 'admin',
          email: 'admin@example.com',
        }),
      });

      await expect(signInWithEmailAndPassword(
        auth,
        'admin@example.com',
        'password123'
      )).resolves.toEqual(mockUserCredential);
    });

    it('should fail with wrong credentials', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(
        new Error('Invalid credentials')
      );

      await expect(signInWithEmailAndPassword(
        auth,
        'test@example.com',
        'wrongpassword'
      )).rejects.toThrow('Invalid credentials');
    });
  });

  describe('User Sign Out', () => {
    it('should sign out user', async () => {
      (signOut as jest.Mock).mockResolvedValueOnce(undefined);
      await expect(signOut(auth)).resolves.not.toThrow();
    });
  });
});
