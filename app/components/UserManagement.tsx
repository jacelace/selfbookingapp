import React, { useState } from 'react';
import { Plus, Edit2, Save, X } from 'lucide-react';
import { ColorLabel } from './ColorLabel';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

interface User {
  id: string;
  name: string;
  label: {
    id: string;
    name: string;
    color: string;
  };
  totalBookings: number;
  remainingBookings: number;
  totalSessions: number;
}

interface UserManagementProps {
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (user: User) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onUpdateUser }) => {
  const [newUserName, setNewUserName] = useState('');
  const [newUserLabelId, setNewUserLabelId] = useState('');
  const [newUserTotalSessions, setNewUserTotalSessions] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingTotalSessions, setEditingTotalSessions] = useState('');

  const handleAddUser = () => {
    if (newUserName && newUserLabelId && newUserTotalSessions) {
      onAddUser({
        name: newUserName,
        label: {
          id: newUserLabelId,
          name: 'Default Label', // This should be replaced with actual label data
          color: '#000000', // This should be replaced with actual label data
        },
        totalBookings: 0,
        remainingBookings: parseInt(newUserTotalSessions),
        totalSessions: parseInt(newUserTotalSessions),
      });
      setNewUserName('');
      setNewUserLabelId('');
      setNewUserTotalSessions('');
    }
  };

  const handleUpdateTotalSessions = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user && editingTotalSessions) {
      const updatedUser = {
        ...user,
        totalSessions: parseInt(editingTotalSessions),
        remainingBookings: parseInt(editingTotalSessions) - user.totalBookings,
      };
      onUpdateUser(updatedUser);
      setEditingUserId(null);
      setEditingTotalSessions('');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              type="text"
              value={newUserName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUserName(e.target.value)}
              placeholder="User Name"
            />
            <Input
              type="text"
              value={newUserLabelId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUserLabelId(e.target.value)}
              placeholder="Label ID"
            />
            <Input
              type="number"
              value={newUserTotalSessions}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUserTotalSessions(e.target.value)}
              placeholder="Total Sessions"
            />
            <Button onClick={handleAddUser} className="flex items-center">
              <Plus className="mr-1" size={16} /> Add User
            </Button>
          </div>
          <ul className="space-y-2">
            {users.map((user) => (
              <li key={user.id} className="flex items-center space-x-2 bg-gray-100 p-2 rounded">
                <ColorLabel name={user.label.name} color={user.label.color} />
                <span className="font-medium">{user.name}</span>
                <span className="text-sm text-gray-500">
                  (Bookings: {user.totalBookings}, Remaining: {user.remainingBookings}, Total Sessions: {user.totalSessions})
                </span>
                {editingUserId === user.id ? (
                  <>
                    <Input
                      type="number"
                      value={editingTotalSessions}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingTotalSessions(e.target.value)}
                      className="w-20"
                    />
                    <Button
                      onClick={() => handleUpdateTotalSessions(user.id)}
                      size="sm"
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Save size={16} />
                    </Button>
                    <Button
                      onClick={() => setEditingUserId(null)}
                      size="sm"
                      variant="outline"
                    >
                      <X size={16} />
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => {
                      setEditingUserId(user.id);
                      setEditingTotalSessions(user.totalSessions.toString());
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <Edit2 size={16} />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};