'use client';

interface LoadingSpinnerProps {
  size?: number | 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ size = 'md', className = "" }: LoadingSpinnerProps) {
  const getSizeInPixels = (size: number | 'sm' | 'md' | 'lg'): number => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'sm': return 16;
      case 'lg': return 32;
      case 'md':
      default: return 24;
    }
  };

  const sizeInPixels = getSizeInPixels(size);

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className="animate-spin rounded-full border-b-2 border-current"
        style={{ width: `${sizeInPixels}px`, height: `${sizeInPixels}px` }}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
