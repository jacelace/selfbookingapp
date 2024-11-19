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

  const baseNavClasses = "fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700";

  if (loading) {
    return (
      <nav className={baseNavClasses}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
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
    <nav className={baseNavClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                Therapy Booking
              </span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link
                href="/"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-white border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-700"
              >
                Home
              </Link>
              {user && (
                <Link
                  href="/admin/dashboard"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-white border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-700"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {user ? (
              <Button
                onClick={handleLogout}
                variant="outline"
                className="ml-4 px-4 py-2 text-sm font-medium"
              >
                Logout
              </Button>
            ) : (
              <Link href="/login">
                <Button
                  variant="default"
                  className="ml-4 px-4 py-2 text-sm font-medium"
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
