'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { toast } from '../ui/use-toast';
import { doc, setDoc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebaseInit';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/firebaseInit';
import { useFirebase } from '../../FirebaseProvider';
import type { Label as LabelType } from '../../types';

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

    // Validate all required fields
    const errors = [];
    if (!email) errors.push('Email is required');
    if (!password) errors.push('Password is required');
    if (!selectedLabel) errors.push('Label is required');
    if (!sessions) errors.push('Number of sessions is required');
    if (password && password.length < 6) errors.push('Password must be at least 6 characters');
    if (sessions && parseInt(sessions) < 1) errors.push('Number of sessions must be at least 1');

    if (errors.length > 0) {
      toast({
        title: 'Validation Error',
        description: errors.join('\n'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    let newUser;

    try {
      console.log('Creating user with email:', email);

      // First check if user exists in Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        toast({
          title: 'Error',
          description: 'A user with this email already exists',
          variant: 'destructive',
        });
        return;
      }

      // Create the user in Firebase Auth
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        newUser = userCredential.user;
        console.log('User created in Firebase Auth:', newUser.uid);
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          toast({
            title: 'Error',
            description: 'This email is already registered. Please use a different email.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Error',
            description: 'Failed to create user account. Please try again.',
            variant: 'destructive',
          });
        }
        throw error;
      }

      // Get the selected label details
      const labelDoc = await getDoc(doc(db, 'labels', selectedLabel));
      const labelData = labelDoc.data();
      console.log('Label data:', labelData);
      
      if (!labelData) {
        throw new Error('Selected label not found');
      }

      // Create the user document in Firestore
      const userData = {
        id: newUser.uid,
        email: email,
        name: email.split('@')[0],
        labelId: selectedLabel,
        userLabel: labelData.name,
        labelColor: labelData.color,
        sessions: parseInt(sessions),
        remainingBookings: parseInt(sessions),
        totalBookings: 0,
        totalSessions: parseInt(sessions),
        status: isApproved ? 'approved' : 'pending',
        isApproved: isApproved,
        role: 'user',
        isAdmin: false,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        createdBy: adminUser.uid,
      };

      console.log('Creating user document in Firestore:', userData);
      const userRef = doc(db, 'users', newUser.uid);
      
      try {
        await setDoc(userRef, userData);
        
        // Verify the document was created
        const verifyDoc = await getDoc(userRef);
        if (!verifyDoc.exists()) {
          throw new Error('Failed to create user document in Firestore');
        }
        console.log('User document created and verified successfully');

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
        console.log('Calling onSuccess to refresh user list');
        if (onSuccess) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for Firestore to settle
          onSuccess();
        }
      } catch (error) {
        console.error('Error creating user document:', error);
        // Try to clean up the Auth user if Firestore fails
        try {
          await newUser.delete();
        } catch (deleteError) {
          console.error('Error deleting auth user after Firestore failure:', deleteError);
        }
        throw new Error('Failed to create user document');
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      let errorMessage = 'Failed to create user';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
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
