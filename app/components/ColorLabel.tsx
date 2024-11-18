'use client';

interface ColorLabelProps {
  children?: React.ReactNode;
  color?: string;
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

export default function ColorLabel({ children, color = '#808080' }: ColorLabelProps) {
  // Ensure color is a valid hex color
  const validColor = /^#[0-9A-F]{6}$/i.test(color) ? color : '#808080';
  
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: validColor,
        color: getContrastColor(validColor)
      }}
    >
      {children}
    </span>
  );
}
