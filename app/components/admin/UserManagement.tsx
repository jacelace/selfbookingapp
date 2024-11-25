'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/clientApp';
import type { EnhancedUser, Label as LabelType } from '../../types';
import LoadingSpinner from '../LoadingSpinner';
import { toast } from '../ui/use-toast';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import CreateUserForm from './CreateUserForm';

interface UserManagementProps {
  users: EnhancedUser[];
  labels?: LabelType[];
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  onRefresh?: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({
  users,
  labels = [],
  isSubmitting,
  setIsSubmitting,
  onRefresh
}) => {
  const [error, setError] = useState<string | null>(null);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter users based on status and search term
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (showPendingOnly) {
      return (!user.isApproved || user.status === 'pending') && matchesSearch;
    }
    return matchesSearch;
  });

  // Sort users: pending first, then approved
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if ((!a.isApproved || a.status === 'pending') && (b.isApproved && b.status === 'approved')) return -1;
    if ((a.isApproved && a.status === 'approved') && (!b.isApproved || b.status === 'pending')) return 1;
    return 0;
  });

  console.log('UserManagement - Total users:', users.length);
  console.log('UserManagement - Filtered users:', filteredUsers.length);
  console.log('UserManagement - Display users:', sortedUsers.length);

  const handleUpdateUserLabel = async (userId: string, labelId: string) => {
    try {
      setIsSubmitting(true);
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { labelId });
      
      // Refresh the users list
      onRefresh?.();
      
      toast({
        title: "Success",
        description: "User label updated successfully",
      });
    } catch (err) {
      console.error('Error updating user label:', err);
      toast({
        title: "Error",
        description: "Failed to update user label",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUserSessions = async (userId: string, sessions: number) => {
    try {
      setIsSubmitting(true);
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { sessions });
      
      // Refresh the users list
      onRefresh?.();
      
      toast({
        title: "Success",
        description: "User sessions updated successfully",
      });
    } catch (error) {
      console.error('Error updating user sessions:', error);
      toast({
        title: "Error",
        description: "Failed to update user sessions",
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
      // Delete the user document
      await deleteDoc(doc(db, 'users', userId));

      // Refresh the users list
      onRefresh?.();
      
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
    } catch (err) {
      console.error('Error deleting user:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete user. Please try again.',
        variant: 'destructive',
      });
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
          isApproved: true,
          remainingBookings: numSessions,
          totalBookings: numSessions,
          sessions: numSessions,
          updatedAt: new Date().toISOString()
        });

        // Refresh the users list
        onRefresh?.();

        toast({
          title: 'Success',
          description: `User approved with ${numSessions} sessions`,
        });
      } else {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          status: 'pending',
          isApproved: false,
          updatedAt: new Date().toISOString()
        });

        // Refresh the users list
        onRefresh?.();

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
    <div className="space-y-4">
      <CreateUserForm 
        labels={labels}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
        onSuccess={onRefresh}
      />
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="pending-only"
            checked={showPendingOnly}
            onCheckedChange={setShowPendingOnly}
          />
          <Label htmlFor="pending-only">Show pending only</Label>
        </div>
        <Input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Sessions</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  {searchTerm 
                    ? "No users found matching your search"
                    : showPendingOnly 
                      ? "No pending users found" 
                      : "No users found"}
                </TableCell>
              </TableRow>
            ) : (
              sortedUsers.map((user) => (
                <TableRow key={user.id} className={cn(
                  "hover:bg-muted/50 transition-colors",
                  !user.isApproved && "bg-yellow-50 hover:bg-yellow-100/70"
                )}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={user.isApproved}
                        onCheckedChange={(checked) => handleApprovalChange(user.id, checked)}
                        disabled={isSubmitting}
                      />
                      <span className={cn(
                        "text-sm",
                        user.isApproved ? "text-green-600" : "text-yellow-600"
                      )}>
                        {user.isApproved ? "Approved" : "Pending"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.labelId || ''}
                      onValueChange={(value) => handleUpdateUserLabel(user.id, value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue>
                          {labels.find(l => l.id === user.labelId)?.name || 'Select a label'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {labels.map((label) => (
                          <SelectItem key={label.id} value={label.id}>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: label.color }}
                              />
                              <span>{label.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={user.sessions}
                      onChange={(e) => {
                        const sessions = parseInt(e.target.value);
                        if (!isNaN(sessions) && sessions >= 0) {
                          handleUpdateUserSessions(user.id, sessions);
                        }
                      }}
                      className="w-20"
                      disabled={isSubmitting}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={isSubmitting}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UserManagement;
