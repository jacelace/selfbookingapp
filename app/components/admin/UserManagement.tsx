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
import { toast } from '../ui/use-toast';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';

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

  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const pendingUsers = users.filter(user => user.status === 'pending');
  const displayUsers = showPendingOnly ? pendingUsers : users;

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
        createdBy: currentUser.uid,
        status: 'pending'
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

  const handleApprovalChange = async (userId: string, isApproved: boolean) => {
    setIsSubmitting(true);
    try {
      if (isApproved) {
        // Prompt for number of sessions
        const sessions = window.prompt('Enter number of sessions to allocate:', '0');
        if (sessions === null) {
          return; // User cancelled
        }
        
        const numSessions = parseInt(sessions);
        if (isNaN(numSessions) || numSessions < 0) {
          toast({
            title: 'Error',
            description: 'Please enter a valid number of sessions',
            variant: 'destructive',
          });
          return;
        }

        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          status: 'approved',
          remainingBookings: numSessions,
          totalBookings: numSessions,
          updatedAt: new Date().toISOString()
        });

        // Update local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { 
                  ...user, 
                  status: 'approved',
                  remainingBookings: numSessions,
                  totalBookings: numSessions
                }
              : user
          )
        );

        toast({
          title: 'Success',
          description: `User approved with ${numSessions} sessions`,
        });
      } else {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          status: 'pending',
          updatedAt: new Date().toISOString()
        });

        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, status: 'pending' }
              : user
          )
        );

        toast({
          title: 'Success',
          description: 'User status set to pending',
        });
      }
    } catch (error) {
      console.error('Error updating user approval:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {pendingUsers.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-yellow-800">Pending Approvals</CardTitle>
                <p className="text-sm text-yellow-700 mt-1">
                  {pendingUsers.length} user{pendingUsers.length !== 1 ? 's' : ''} waiting for approval
                </p>
              </div>
              <Button
                variant="outline"
                className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                onClick={() => setShowPendingOnly(!showPendingOnly)}
              >
                {showPendingOnly ? 'Show All Users' : 'Show Pending Only'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-yellow-200"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-gray-500">
                      Signed up {new Date(user.createdAt).toLocaleDateString()} at{' '}
                      {new Date(user.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprovalChange(user.id, true)}
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Approve & Set Sessions
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={isSubmitting}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All Users</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {users.length} total user{users.length !== 1 ? 's' : ''} •{' '}
                {pendingUsers.length} pending •{' '}
                {users.filter(user => user.status === 'approved').length} approved
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Name/Email</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Signed Up</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayUsers.map((user) => (
                <TableRow 
                  key={user.id}
                  className={user.status === 'pending' ? 'bg-yellow-50' : ''}
                >
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          user.status === 'pending' ? 'bg-yellow-400' : 'bg-green-400'
                        }`}
                      />
                      <span className={`text-sm font-medium ${
                        user.status === 'pending' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {user.status === 'pending' ? 'Pending' : 'Approved'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{user.name || 'No name'}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.status === 'approved' ? (
                      <div className="text-sm">
                        <span className="font-medium">{user.remainingBookings}</span>
                        <span className="text-gray-500"> remaining</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Not allocated</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {user.status === 'pending' ? (
                        <Button
                          size="sm"
                          onClick={() => handleApprovalChange(user.id, true)}
                          disabled={isSubmitting}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Approve
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprovalChange(user.id, false)}
                          disabled={isSubmitting}
                        >
                          Unapprove
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={isSubmitting}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
