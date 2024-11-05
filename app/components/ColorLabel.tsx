'use client';

interface ColorLabelProps {
  name: string;
  color: string;
}

function getContrastColor(hexColor: string) {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? 'black' : 'white';
}

export default function ColorLabel({ name, color }: ColorLabelProps) {
  return (
    <span
      className="px-2 py-1 rounded-full text-xs font-semibold"
      style={{
        backgroundColor: color,
        color: getContrastColor(color)
      }}
    >
      {name}
    </span>
  );
}
