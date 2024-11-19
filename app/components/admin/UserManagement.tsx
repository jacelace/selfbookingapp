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
import { cn } from "@/lib/utils";

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
  const approvedUsers = users.filter(user => user.status === 'approved');
  // Combine pending users first, followed by approved users
  const sortedUsers = [...pendingUsers, ...approvedUsers];
  const displayUsers = showPendingOnly ? pendingUsers : sortedUsers;

  const handleUpdateUserLabel = async (userId: string, labelId: string) => {
    try {
      setIsSubmitting(true);
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { labelId });
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, labelId } : user
        )
      );
      
      toast({
        title: "Success",
        description: "User label updated successfully",
      });
    } catch (error) {
      console.error('Error updating user label:', error);
      toast({
        title: "Error",
        description: "Failed to update user label",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleAddSessions = async (userId: string, currentSessions: number) => {
    try {
      if (isSubmitting) return;
      setIsSubmitting(true);

      const sessionsToAdd = window.prompt('Enter number of sessions to add:', '1');
      if (!sessionsToAdd) {
        return; // User cancelled or entered empty string
      }

      const numSessions = parseInt(sessionsToAdd);
      if (isNaN(numSessions) || numSessions <= 0) {
        toast({
          title: 'Error',
          description: 'Please enter a valid number of sessions greater than 0',
          variant: 'destructive',
        });
        return;
      }

      const newTotal = currentSessions + numSessions;
      const userRef = doc(db, 'users', userId);
      
      // Update Firestore
      await updateDoc(userRef, {
        remainingBookings: newTotal,
        totalBookings: newTotal,
        updatedAt: new Date()
      });

      // Update local state
      setUsers((prevUsers) => 
        prevUsers.map((user) => 
          user.id === userId 
            ? {
                ...user,
                remainingBookings: newTotal,
                totalBookings: newTotal
              }
            : user
        )
      );

      toast({
        title: 'Success',
        description: `Added ${numSessions} sessions. New total: ${newTotal}`,
      });
    } catch (error) {
      console.error('Error adding sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to add sessions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="pending-filter"
            checked={showPendingOnly}
            onCheckedChange={setShowPendingOnly}
            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-500"
          />
          <Label htmlFor="pending-filter" className="text-sm">Show pending users only</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          {showPendingOnly ? `${pendingUsers.length} pending` : `${users.length} total`} users
        </p>
      </div>

      <div className="rounded-md border bg-gradient-to-br from-white to-gray-50">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[200px] text-xs">Name</TableHead>
              <TableHead className="w-[150px] text-xs">Label</TableHead>
              <TableHead className="w-[100px] text-xs">Sessions</TableHead>
              <TableHead className="w-[100px] text-xs">Status</TableHead>
              <TableHead className="text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-gray-50/50">
                <TableCell className="text-sm">{user.name || user.email}</TableCell>
                <TableCell>
                  <Select
                    value={user.labelId || ''}
                    onValueChange={(value) => handleUpdateUserLabel(user.id, value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-8 w-[130px] text-sm">
                      <SelectValue placeholder="Select label" />
                    </SelectTrigger>
                    <SelectContent>
                      {labels.map((label) => (
                        <SelectItem key={label.id} value={label.id} className="text-sm">
                          {label.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={user.sessions || 0}
                      onChange={(e) => handleUpdateUserSessions(user.id, parseInt(e.target.value))}
                      className="h-8 w-16 text-sm"
                      min="0"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                    user.status === 'approved' && "bg-green-100 text-green-700",
                    user.status === 'pending' && "bg-yellow-100 text-yellow-700",
                    user.status === 'rejected' && "bg-red-100 text-red-700"
                  )}>
                    {user.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {user.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => handleApproveUser(user.id)}
                          disabled={isSubmitting}
                          size="sm"
                          className="h-7 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-xs"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleRejectUser(user.id)}
                          disabled={isSubmitting}
                          variant="destructive"
                          size="sm"
                          className="h-7 text-xs bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    <Button
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={isSubmitting}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
