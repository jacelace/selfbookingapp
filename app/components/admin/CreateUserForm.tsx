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
import type { Label as LabelType } from '../../types/shared';

interface CreateUserFormProps {
  labels: LabelType[];
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  onSuccess?: () => void;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ labels, isSubmitting, setIsSubmitting, onSuccess }) => {
  const { user: adminUser, isAdmin } = useFirebase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [sessions, setSessions] = useState('');
  const [isApproved, setIsApproved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminUser || !isAdmin) {
      toast({
        title: 'Error',
        description: 'You must be logged in as an admin to create users',
        variant: 'destructive',
      });
      return;
    }

    if (!email || !password || !selectedLabel || !sessions) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Create the user document in Firestore
      await setDoc(doc(db, 'users', newUser.uid), {
        email: email,
        label: selectedLabel,
        sessions: parseInt(sessions),
        remainingSessions: parseInt(sessions),
        status: isApproved ? 'active' : 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: adminUser.uid,
      });

      toast({
        title: 'Success',
        description: `User ${email} created successfully${isApproved ? ' and approved' : ' (pending approval)'}`,
      });

      // Reset form
      setEmail('');
      setPassword('');
      setSelectedLabel('');
      setSessions('');
      setIsApproved(false);

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
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
