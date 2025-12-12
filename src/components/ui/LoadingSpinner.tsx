'use client';

import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={clsx('relative', sizeClasses[size], className)}>
      <div
        className={clsx(
          'absolute inset-0 rounded-full',
          'border-2 border-surface-700'
        )}
      />
      <div
        className={clsx(
          'absolute inset-0 rounded-full',
          'border-2 border-transparent border-t-brand-500',
          'animate-spin'
        )}
      />
    </div>
  );
}

export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-900/80 backdrop-blur-sm rounded-2xl z-10">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-surface-400 text-sm">{message}</p>
    </div>
  );
}

