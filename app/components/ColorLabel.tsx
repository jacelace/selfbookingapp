'use client';

import React from 'react';

interface ColorLabelProps {
  name: string;
  color: string;
  children?: React.ReactNode;
}

function getContrastColor(hexColor: string = '#808080') {
  // Ensure hexColor is a valid hex color
  const validHexColor = /^#[0-9A-F]{6}$/i.test(hexColor) ? hexColor : '#808080';
  
  const r = parseInt(validHexColor.slice(1, 3), 16);
  const g = parseInt(validHexColor.slice(3, 5), 16);
  const b = parseInt(validHexColor.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#FFFFFF';
}

export default function ColorLabel({ children, color, name }: ColorLabelProps) {
  // Ensure color is a valid hex color
  const validColor = /^#[0-9A-F]{6}$/i.test(color) ? color : '#808080';
  const textColor = getContrastColor(validColor);

  return (
    <div
      className="px-3 py-1 rounded-full text-sm"
      style={{
        backgroundColor: validColor,
        color: textColor,
      }}
    >
      {name || children}
    </div>
  );
}
