'use client';

import { type ReactNode } from 'react';

interface SuspenseLoaderProps {
  /** Size of the loader: 'sm' (16px), 'md' (24px), 'lg' (32px) */
  size?: 'sm' | 'md' | 'lg';
  /** Optional message to display below the spinner */
  message?: string;
  /** Fills parent container */
  fullScreen?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

/**
 * SuspenseLoader Component
 *
 * A loading spinner component for use with React Suspense boundaries.
 * Displays a spinning indicator with optional message.
 *
 * @example
 * ```tsx
 * <Suspense fallback={<SuspenseLoader message="Loading clients..." />}>
 *   <ClientList />
 * </Suspense>
 * ```
 */
export function SuspenseLoader({
  size = 'md',
  message,
  fullScreen = false,
  className = '',
}: SuspenseLoaderProps) {
  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white/80'
    : 'flex items-center justify-center py-12';

  return (
    <div
      className={`${containerClasses} ${className}`}
      role="status"
      aria-label={message || 'Loading'}
    >
      <div className="flex flex-col items-center gap-3">
        <svg
          className={`${sizeClasses[size]} animate-spin text-blue-600`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {message && (
          <p className="text-sm text-gray-600">{message}</p>
        )}
        <span className="sr-only">{message || 'Loading'}</span>
      </div>
    </div>
  );
}

/**
 * PageLoader Component
 *
 * Full-page loading indicator for route-level Suspense boundaries.
 */
export function PageLoader({ message }: { message?: string }) {
  return <SuspenseLoader size="lg" fullScreen message={message} />;
}

/**
 * SectionLoader Component
 *
 * Loading indicator for section-level content.
 */
export function SectionLoader({ message }: { message?: string }) {
  return <SuspenseLoader size="md" message={message} />;
}

export default SuspenseLoader;
