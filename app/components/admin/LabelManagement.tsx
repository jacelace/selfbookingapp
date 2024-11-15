'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/clientApp';
import type { Label as LabelType } from '../../types/shared';
import ColorLabel from '../ColorLabel';
import LoadingSpinner from '../LoadingSpinner';
import { TEST_CREDENTIALS } from '../../lib/constants';

interface LabelManagementProps {
  labels: LabelType[];
  setLabels: React.Dispatch<React.SetStateAction<LabelType[]>>;
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
}

export const LabelManagement: React.FC<LabelManagementProps> = ({
  labels,
  setLabels,
  isSubmitting,
  setIsSubmitting
}) => {
  // Form states
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#000000');
  const [error, setError] = useState<string | null>(null);

  const handleAddLabel = async () => {
    if (!newLabelName || !newLabelColor) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Check if we're logged in as admin
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.email !== TEST_CREDENTIALS.email) {
        throw new Error('Unauthorized: Only admins can add labels');
      }

      // Create label document
      const labelData = {
        name: newLabelName,
        color: newLabelColor,
        isDefault: false,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.uid
      };

      // Add the document
      const docRef = await addDoc(collection(db, 'labels'), labelData);

      // Update with ID
      await updateDoc(docRef, {
        id: docRef.id
      });

      // Update local state
      setLabels(prevLabels => [...prevLabels, { ...labelData, id: docRef.id }]);

      // Reset form
      setNewLabelName('');
      setNewLabelColor('#000000');

      console.log('Label added successfully:', labelData);
    } catch (err) {
      console.error('Error adding label:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add label. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLabel = async (labelId: string) => {
    if (!window.confirm('Are you sure you want to delete this label? This action cannot be undone.')) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Check if we're logged in as admin
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.email !== TEST_CREDENTIALS.email) {
        throw new Error('Unauthorized: Only admins can delete labels');
      }

      // Delete the label document
      await deleteDoc(doc(db, 'labels', labelId));

      // Update local state
      setLabels(prevLabels => prevLabels.filter(label => label.id !== labelId));
      console.log('Label deleted successfully');
    } catch (err) {
      console.error('Error deleting label:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to delete label. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Label Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="labelName">Label Name</Label>
            <Input
              id="labelName"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              placeholder="Enter label name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="labelColor">Label Color</Label>
            <Input
              id="labelColor"
              type="color"
              value={newLabelColor}
              onChange={(e) => setNewLabelColor(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <Button onClick={handleAddLabel} disabled={isSubmitting}>
            {isSubmitting ? <LoadingSpinner /> : 'Add Label'}
          </Button>
        </div>

        <div className="mt-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labels.map((label) => (
                <TableRow key={label.id}>
                  <TableCell>{label.name}</TableCell>
                  <TableCell>
                    <ColorLabel color={label.color} />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteLabel(label.id)}
                      disabled={isSubmitting || label.isDefault}
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
