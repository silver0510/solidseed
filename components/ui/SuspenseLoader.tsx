'use client';

import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

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
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
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
    ? 'fixed inset-0 flex items-center justify-center bg-background/80'
    : 'flex items-center justify-center py-12';

  return (
    <div
      className={cn(containerClasses, className)}
      role="status"
      aria-label={message || 'Loading'}
    >
      <div className="flex flex-col items-center gap-3">
        <Spinner className={cn(sizeClasses[size], 'text-primary')} />
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
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
