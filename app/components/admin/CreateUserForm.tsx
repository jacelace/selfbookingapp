'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { toast } from '../ui/use-toast';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/clientApp';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/clientApp';
import { useFirebase } from '../../FirebaseProvider';
import type { Label as LabelType } from '../../types';

interface CreateUserFormProps {
  labels?: LabelType[];
  onSuccess?: () => void;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ 
  labels = [], 
  onSuccess 
}) => {
  const { user: adminUser, isAdmin } = useFirebase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [sessions, setSessions] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      setIsSubmitting(true);

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Create user document in Firestore
      const userRef = doc(db, 'users', newUser.uid);
      const numSessions = parseInt(sessions) || 0;

      await setDoc(userRef, {
        id: newUser.uid,
        email: newUser.email,
        name: email.split('@')[0], // Use part of email as name
        role: 'user',
        status: isApproved ? 'approved' : 'pending',
        isAdmin: false,
        isApproved,
        labelId: selectedLabel,
        sessions: numSessions,
        totalSessions: numSessions,
        totalBookings: 0,
        remainingBookings: 0,
        createdAt: new Date(),
        createdBy: adminUser?.email || 'system',
        updatedAt: new Date().toISOString(),
      });

      // Reset form
      setEmail('');
      setPassword('');
      setSelectedLabel('');
      setSessions('');
      setIsApproved(false);

      // Show success message
      toast({
        title: "Success",
        description: "User created successfully",
      });

      // Call onSuccess callback
      onSuccess?.();
    } catch (err) {
      console.error('Error creating user:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-lg shadow">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="label">Label</Label>
        <Select
          value={selectedLabel}
          onValueChange={setSelectedLabel}
          disabled={isSubmitting}
        >
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
        <Label htmlFor="sessions">Number of Sessions</Label>
        <Input
          id="sessions"
          type="number"
          min="1"
          value={sessions}
          onChange={(e) => setSessions(e.target.value)}
          placeholder="10"
          disabled={isSubmitting}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="approved"
          checked={isApproved}
          onCheckedChange={setIsApproved}
          disabled={isSubmitting}
        />
        <Label htmlFor="approved">Approve User Immediately</Label>
      </div>

      <Button 
        type="submit" 
        disabled={isSubmitting} 
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
      >
        {isSubmitting ? 'Creating User...' : 'Create User'}
      </Button>
    </form>
  );
};

export default CreateUserForm;
