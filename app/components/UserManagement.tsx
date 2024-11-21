'use client';

import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/clientApp';
import { EnhancedUser } from '../types/shared';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { toast } from './ui/use-toast';
import { cn } from "../lib/utils";

interface UserManagementProps {
  users: EnhancedUser[];
  onUpdateUser: (user: EnhancedUser) => void;
  onDeleteUser: (userId: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onUpdateUser, onDeleteUser }) => {
  const [updating, setUpdating] = useState<string | null>(null);

  const handleUpdateUser = async (user: EnhancedUser, changes: Partial<EnhancedUser>) => {
    try {
      setUpdating(user.id);
      const userRef = doc(db, 'users', user.id);
      
      // If changing approval status or sessions, update remaining bookings
      if ('isApproved' in changes || 'sessions' in changes) {
        const newSessions = changes.sessions ?? user.sessions;
        const newIsApproved = changes.isApproved ?? user.isApproved;
        
        changes.remainingBookings = newIsApproved ? newSessions : 0;
      }

      await updateDoc(userRef, changes);
      onUpdateUser({ ...user, ...changes });
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-dark-purple">User Management</h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-light-brown">
              <th className="p-2 text-left text-dark-purple">Name</th>
              <th className="p-2 text-left text-dark-purple">Email</th>
              <th className="p-2 text-left text-dark-purple">Booking Privileges</th>
              <th className="p-2 text-left text-dark-purple">Sessions</th>
              <th className="p-2 text-left text-dark-purple">Label</th>
              <th className="p-2 text-left text-dark-purple">Total Bookings</th>
              <th className="p-2 text-left text-dark-purple">Remaining Bookings</th>
              <th className="p-2 text-left text-dark-purple">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className={cn(
                "border-b border-light-brown hover:bg-muted/50",
                user.status === 'pending' && "bg-yellow-100 hover:bg-yellow-200/70"
              )}>
                <td className="p-2">{user.name}</td>
                <td className="p-2">{user.email}</td>
                <td className="p-2">
                  <Switch
                    checked={user.isApproved}
                    onCheckedChange={(checked) => 
                      handleUpdateUser(user, { isApproved: checked })
                    }
                    disabled={updating === user.id}
                  />
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
                    style={{ backgroundColor: user.labelColor || '#808080' }}
                  >
                    {user.userLabel || 'No Label'}
                  </div>
                </td>
                <td className="p-2">{user.totalBookings}</td>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
