'use client';

import React, { useState } from 'react';
import { doc, updateDoc, query, collection, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseInit';
import { EnhancedUser } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { toast } from './ui/use-toast';
import { Search, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { LoadingSpinner } from './ui/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface UserManagementProps {
  users: EnhancedUser[];
  labels: string[];
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  onDeleteUser: (userId: string) => void;
  onRefresh: () => void;
  error?: string | null;
}

const UserManagement: React.FC<UserManagementProps> = ({ 
  users, 
  labels, 
  isSubmitting, 
  setIsSubmitting, 
  onDeleteUser, 
  onRefresh,
  error 
}) => {
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Filter users based on search query and selected label
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLabel = selectedLabel === null || user.labelName === selectedLabel;
    
    return matchesSearch && matchesLabel;
  });

  const handleUpdateUser = async (user: EnhancedUser, changes: Partial<EnhancedUser>) => {
    try {
      setUpdating(user.id);
      setLocalError(null);
      const userRef = doc(db, 'users', user.id);
      
      // If changing approval status or sessions, update remaining bookings and status
      if ('isApproved' in changes || 'sessions' in changes) {
        const newSessions = changes.sessions ?? user.sessions;
        const newIsApproved = changes.isApproved ?? user.isApproved;
        
        // Calculate remaining bookings based on current bookings
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('userId', '==', user.id),
          where('status', '==', 'confirmed')
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);
        const confirmedBookings = bookingsSnapshot.docs.length;
        
        changes.remainingBookings = newIsApproved ? Math.max(0, newSessions - confirmedBookings) : 0;
        changes.status = newIsApproved ? 'approved' : 'pending';
        changes.updatedAt = Timestamp.now();
      }

      await updateDoc(userRef, changes);
      onRefresh?.();
      
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
    } catch (error) {
      console.error('Error updating user:', error);
      setLocalError(error instanceof Error ? error.message : 'Failed to update user');
      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  // Get unique labels
  const uniqueLabels = Array.from(new Set(users.map(user => user.labelName).filter(Boolean)));

  if (error || localError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error || localError}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLocalError(null);
              onRefresh();
            }}
            className="ml-4"
          >
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isSubmitting) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-muted-foreground">Loading users...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedLabel === null ? "secondary" : "outline"}
            size="sm"
            onClick={() => setSelectedLabel(null)}
          >
            All
          </Button>
          {uniqueLabels.map((label) => (
            <Button
              key={label}
              variant={selectedLabel === label ? "secondary" : "outline"}
              size="sm"
              onClick={() => setSelectedLabel(label)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Booking Privileges</th>
              <th className="p-2 text-left">Sessions</th>
              <th className="p-2 text-left">Label</th>
              <th className="p-2 text-left">Remaining</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-muted-foreground">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr 
                  key={user.id} 
                  className={`border-b hover:bg-muted/50 ${user.status === 'pending' ? 'bg-yellow-100 hover:bg-yellow-200/70' : ''}`}
                >
                  <td className="p-2">{user.name}</td>
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.isApproved}
                        onCheckedChange={(checked) => 
                          handleUpdateUser(user, { isApproved: checked })
                        }
                        disabled={updating === user.id}
                      />
                      {updating === user.id && (
                        <LoadingSpinner size="sm" />
                      )}
                    </div>
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={user.sessions}
                      onChange={(e) => {
                        const sessions = parseInt(e.target.value);
                        if (!isNaN(sessions) && sessions >= 0) {
                          handleUpdateUser(user, { sessions });
                        }
                      }}
                      className="w-20"
                      disabled={updating === user.id}
                    />
                  </td>
                  <td className="p-2">
                    <div 
                      className="inline-block px-2 py-1 rounded" 
                      style={{ backgroundColor: user.labelColor || '#808080', color: 'white' }}
                    >
                      {user.labelName || 'No Label'}
                    </div>
                  </td>
                  <td className="p-2">{user.remainingBookings}</td>
                  <td className="p-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDeleteUser(user.id)}
                      disabled={updating === user.id}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
