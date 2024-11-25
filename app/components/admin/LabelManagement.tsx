'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { collection, addDoc, deleteDoc, doc, updateDoc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebaseInit';
import { auth } from '../../firebase/clientApp';
import type { Label as LabelType } from '../../types';
import ColorLabel from '../ColorLabel';
import LoadingSpinner from '../LoadingSpinner';
import { useToast } from '../ui/use-toast';

interface LabelManagementProps {
  labels: LabelType[];
  setLabels: React.Dispatch<React.SetStateAction<LabelType[]>>;
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  onRefresh?: () => void;
}

const LabelManagement: React.FC<LabelManagementProps> = ({
  labels,
  setLabels,
  isSubmitting,
  setIsSubmitting,
  onRefresh
}) => {
  // Form states
  const [newLabel, setNewLabel] = useState<LabelType>({ id: '', name: '', color: '#000000', isDefault: false });
  const [error, setError] = useState<string | null>(null);

  const handleCreateLabel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!newLabel.name || !newLabel.color) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Check if we're logged in as admin
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Unauthorized: Only admins can add labels');
      }

      // Create label document
      const labelData = {
        name: newLabel.name,
        color: newLabel.color,
        isDefault: newLabel.isDefault,
        createdAt: Timestamp.now(),
        createdBy: currentUser.uid,
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
      setNewLabel({ id: '', name: '', color: '#000000', isDefault: false });

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
      if (!currentUser) {
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
    <div className="space-y-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Create Label</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateLabel} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Label Name
                </label>
                <Input
                  id="name"
                  value={newLabel.name}
                  onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
                  className="h-8"
                  placeholder="Enter label name"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="color" className="text-sm font-medium">
                  Color
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="color"
                    type="color"
                    value={newLabel.color}
                    onChange={(e) => setNewLabel({ ...newLabel, color: e.target.value })}
                    className="h-8 w-16 p-1"
                  />
                  <Input
                    value={newLabel.color}
                    onChange={(e) => setNewLabel({ ...newLabel, color: e.target.value })}
                    className="h-8 flex-1"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDefault"
                checked={newLabel.isDefault}
                onCheckedChange={(checked) => setNewLabel({ ...newLabel, isDefault: checked as boolean })}
              />
              <label htmlFor="isDefault" className="text-sm">
                Set as default label
              </label>
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting || !newLabel.name || !newLabel.color}
                size="sm"
                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
              >
                {isSubmitting ? <LoadingSpinner /> : 'Create Label'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Existing Labels</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {labels.map((label) => (
            <Card key={label.id} className="relative group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="font-medium">{label.name}</span>
                  </div>
                  {label.isDefault && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteLabel(label.id)}
                    className="h-7 px-2 hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LabelManagement;
