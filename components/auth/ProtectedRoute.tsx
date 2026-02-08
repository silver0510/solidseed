'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirectedRef = useRef(false);

  // Debug logging - log every render with timestamp
  console.log(`[ProtectedRoute ${Date.now()}] Render:`, { isLoading, isAuthenticated, user: !!user, pathname });

  useEffect(() => {
    // Only redirect if loading is complete and user is not authenticated
    // Use ref to prevent multiple redirects
    if (!isLoading && !isAuthenticated && !hasRedirectedRef.current) {
      console.log(`[ProtectedRoute ${Date.now()}] Not authenticated, redirecting to login`);
      hasRedirectedRef.current = true;
      const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.push(loginUrl);
    }

    // Reset ref if user becomes authenticated
    if (isAuthenticated) {
      hasRedirectedRef.current = false;
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    console.log(`[ProtectedRoute ${Date.now()}] Still loading, showing spinner`);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If authenticated, render children
  if (isAuthenticated) {
    console.log(`[ProtectedRoute ${Date.now()}] Authenticated, rendering children`);
    return <>{children}</>;
  }

  // Not authenticated and not loading - show redirecting message
  console.log(`[ProtectedRoute ${Date.now()}] Not authenticated, showing redirect message`);
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Redirecting to login...</p>
      </div>
    </div>
  );
}
