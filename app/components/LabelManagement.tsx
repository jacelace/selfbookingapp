import React, { useState } from 'react';
import { ColorLabel } from './ColorLabel';

interface ColorLabelType {
  id: string;
  name: string;
  color: string;
}

interface LabelManagementProps {
  labels: ColorLabelType[];
  onAddLabel: (label: Omit<ColorLabelType, 'id'>) => void;
}

export const LabelManagement: React.FC<LabelManagementProps> = ({ labels, onAddLabel }) => {
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#000000');

  const handleAddLabel = () => {
    if (newLabelName && newLabelColor) {
      onAddLabel({
        name: newLabelName,
        color: newLabelColor,
      });
      setNewLabelName('');
      setNewLabelColor('#000000');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Label Management</h2>
      <div className="flex space-x-2">
        <input
          type="text"
          value={newLabelName}
          onChange={(e) => setNewLabelName(e.target.value)}
          placeholder="Label Name"
          className="border p-2 rounded"
        />
        <input
          type="color"
          value={newLabelColor}
          onChange={(e) => setNewLabelColor(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          onClick={handleAddLabel}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Add Label
        </button>
      </div>
      <ul className="space-y-2">
        {labels.map((label) => (
          <li key={label.id} className="flex items-center space-x-2">
            <ColorLabel name={label.name} color={label.color} />
            <span>{label.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};