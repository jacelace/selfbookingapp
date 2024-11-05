'use client';

import React, { useState } from 'react';
import { Label } from '../types/shared';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ColorLabel } from './ColorLabel';

interface LabelManagementProps {
  labels: Label[];
  onUpdate: (labels: Label[]) => void;
}

export const LabelManagement: React.FC<LabelManagementProps> = ({ labels, onUpdate }) => {
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#000000');

  const handleAddLabel = () => {
    if (newLabelName && newLabelColor) {
      const newLabel: Label = {
        id: `label-${Date.now()}`,
        name: newLabelName,
        color: newLabelColor,
      };
      onUpdate([...labels, newLabel]);
      setNewLabelName('');
      setNewLabelColor('#000000');
    }
  };

  const handleDeleteLabel = (labelId: string) => {
    onUpdate(labels.filter(label => label.id !== labelId));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-dark-purple">Label Management</h2>

      <div className="flex space-x-4 mb-6">
        <Input
          type="text"
          value={newLabelName}
          onChange={(e) => setNewLabelName(e.target.value)}
          placeholder="Label Name"
          className="flex-1"
        />
        <Input
          type="color"
          value={newLabelColor}
          onChange={(e) => setNewLabelColor(e.target.value)}
          className="w-20"
        />
        <Button onClick={handleAddLabel}>
          Add Label
        </Button>
      </div>

      <div className="space-y-2">
        {labels.map((label) => (
          <div key={label.id} className="flex items-center justify-between p-2 bg-light-brown rounded">
            <div className="flex items-center space-x-2">
              <ColorLabel name={label.name} color={label.color} />
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteLabel(label.id)}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
