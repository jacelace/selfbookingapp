'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User } from 'firebase/auth';
import { useFirebase } from '../FirebaseProvider';
import { Button } from './ui/button';
import LoadingSpinner from './LoadingSpinner';

export default function Navbar() {
  const { user, logout, loading } = useFirebase();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-white/75 backdrop-blur-sm">
        <div className="container mx-auto h-full px-4">
          <div className="flex h-full items-center justify-between">
            <div className="flex items-center">
              <span className="text-xl font-semibold text-gray-900">
                Therapy Booking
              </span>
            </div>
            <div className="flex items-center">
              <LoadingSpinner size="sm" />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-white/75 backdrop-blur-sm">
      <div className="container mx-auto h-full px-4">
        <div className="flex h-full items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-semibold text-gray-900">
                Therapy Booking
              </span>
            </Link>
          </div>
          <div className="flex items-center">
            {user ? (
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="ml-4"
              >
                Logout
              </Button>
            ) : (
              <Link href="/login">
                <Button
                  variant="default"
                  size="sm"
                  className="ml-4"
                >
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}