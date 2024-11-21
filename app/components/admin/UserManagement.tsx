'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/clientApp';
import type { EnhancedUser, Label as LabelType } from '../../types/shared';
import LoadingSpinner from '../LoadingSpinner';
import { TEST_CREDENTIALS } from '../../lib/constants';
import { toast } from '../ui/use-toast';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { cn } from "@/lib/utils";
import { CreateUserForm } from './CreateUserForm';

interface UserManagementProps {
  users: EnhancedUser[];
  labels: LabelType[];
  setUsers: React.Dispatch<React.SetStateAction<EnhancedUser[]>>;
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
}

const UserManagement: React.FC<UserManagementProps> = ({
  users,
  labels,
  setUsers,
  isSubmitting,
  setIsSubmitting
}) => {
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
    <div className="grid grid-cols-5 gap-4">
      {/* Create User Form - Takes up 2 columns */}
      <div className="col-span-2">
        <CreateUserForm 
          labels={labels}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
        />
      </div>

      {/* User List - Takes up 3 columns */}
      <div className="col-span-3 space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <Switch
              id="pending-filter"
              checked={showPendingOnly}
              onCheckedChange={setShowPendingOnly}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-500"
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
                <TableHead className="w-[160px] text-xs py-3">Name</TableHead>
                <TableHead className="w-[130px] text-xs py-3">Label</TableHead>
                <TableHead className="w-[90px] text-xs py-3">Sessions</TableHead>
                <TableHead className="w-[90px] text-xs py-3">Status</TableHead>
                <TableHead className="text-xs py-3">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-gray-50/50">
                  <TableCell className="text-sm py-2.5">{user.name || user.email}</TableCell>
                  <TableCell className="py-2.5">
                    <Select
                      value={user.labelId || ''}
                      onValueChange={(value) => handleUpdateUserLabel(user.id, value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-8 w-[120px] text-sm">
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
                  <TableCell className="text-sm py-2.5">
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
                  <TableCell className="py-2.5">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                      user.status === 'approved' && "bg-green-100 text-green-700",
                      user.status === 'pending' && "bg-yellow-100 text-yellow-700",
                      user.status === 'rejected' && "bg-red-100 text-red-700"
                    )}>
                      {user.status}
                    </span>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <div className="flex items-center space-x-2">
                      {user.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => handleApprovalChange(user.id, true)}
                            disabled={isSubmitting}
                            size="sm"
                            className="h-7 px-3 bg-green-500 hover:bg-green-600 text-xs text-white"
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleApprovalChange(user.id, false)}
                            disabled={isSubmitting}
                            variant="destructive"
                            size="sm"
                            className="h-7 px-3 text-xs"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={isSubmitting}
                        variant="destructive"
                        size="sm"
                        className="h-7 px-3 text-xs"
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
    </div>
  );
};

export default UserManagement;
