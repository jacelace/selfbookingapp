'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/clientApp';
import type { EnhancedUser, Label as LabelType } from '../../types/shared';
import LoadingSpinner from '../LoadingSpinner';
import { TEST_CREDENTIALS } from '../../lib/constants';

interface UserManagementProps {
  users: EnhancedUser[];
  labels: LabelType[];
  setUsers: React.Dispatch<React.SetStateAction<EnhancedUser[]>>;
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  labels,
  setUsers,
  isSubmitting,
  setIsSubmitting
}) => {
  // Form states
  const [newUserName, setNewUserName] = useState('');
  const [newUserLabelId, setNewUserLabelId] = useState('');
  const [newUserTotalBookings, setNewUserTotalBookings] = useState('');
  const [newUserSessions, setNewUserSessions] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserLabelId) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Check if we're logged in as admin
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.email !== TEST_CREDENTIALS.email) {
        throw new Error('Unauthorized: Only admins can add users');
      }

      // Get label name for user
      const label = labels.find(l => l.id === newUserLabelId);
      if (!label) throw new Error('Label not found');

      // Create user document with all required fields
      const userData = {
        name: newUserName,
        email: '', // Empty for manually created users
        labelId: newUserLabelId,
        userLabel: label.name,
        totalBookings: 0,
        remainingBookings: parseInt(newUserTotalBookings || '0'),
        sessions: parseInt(newUserSessions || '0'),
        totalSessions: parseInt(newUserSessions || '0'),
        isAdmin: false,
        isApproved: true,
        role: 'user' as const,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.uid
      };

      // Add the document
      const docRef = await addDoc(collection(db, 'users'), userData);

      // Update with ID
      await updateDoc(docRef, {
        id: docRef.id
      });

      // Update local state
      setUsers(prevUsers => [...prevUsers, { ...userData, id: docRef.id }]);

      // Reset form
      setNewUserName('');
      setNewUserLabelId('');
      setNewUserTotalBookings('');
      setNewUserSessions('');

      console.log('User added successfully:', userData);
    } catch (err) {
      console.error('Error adding user:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add user. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Check if we're logged in as admin
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.email !== TEST_CREDENTIALS.email) {
        throw new Error('Unauthorized: Only admins can delete users');
      }

      // Delete the user document
      await deleteDoc(doc(db, 'users', userId));

      // Update local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      console.log('User deleted successfully');
    } catch (err) {
      console.error('Error deleting user:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to delete user. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="Enter user name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Select value={newUserLabelId} onValueChange={setNewUserLabelId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a label" />
              </SelectTrigger>
              <SelectContent>
                {labels.map((label) => (
                  <SelectItem key={label.id} value={label.id}>
                    {label.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalBookings">Total Bookings</Label>
            <Input
              id="totalBookings"
              type="number"
              min="0"
              value={newUserTotalBookings}
              onChange={(e) => setNewUserTotalBookings(e.target.value)}
              placeholder="Enter total bookings"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sessions">Sessions</Label>
            <Input
              id="sessions"
              type="number"
              min="0"
              value={newUserSessions}
              onChange={(e) => setNewUserSessions(e.target.value)}
              placeholder="Enter sessions"
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <LoadingSpinner /> : 'Add User'}
          </Button>
        </form>

        <div className="mt-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.userLabel}</TableCell>
                  <TableCell>{user.sessions}/{user.totalSessions}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={isSubmitting || user.isAdmin}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
