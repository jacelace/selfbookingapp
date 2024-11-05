'use client';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export default function LoadingSpinner({ size = 8, className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className="animate-spin rounded-full border-b-2 border-primary"
        style={{ width: `${size}px`, height: `${size}px` }}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
