'use client';

/**
 * Auth Guard Component
 *
 * Protects routes that require authentication
 */

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { isTokenExpired } from '@/lib/auth/utils';
import { getAuthToken, removeAuthToken } from '@/lib/auth/api';

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  subscriptionTiers?: string[];
}

export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = '/login',
  subscriptionTiers,
}: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    const token = getAuthToken();

    // Check if token is expired
    if (token && isTokenExpired(token)) {
      removeAuthToken();
      if (requireAuth) {
        router.push(redirectTo);
      }
      return;
    }

    // Require auth: redirect to login if not authenticated
    if (requireAuth && !user) {
      router.push(redirectTo);
      return;
    }

    // Prevent authenticated users from accessing auth pages
    if (!requireAuth && user && pathname.startsWith('/login')) {
      router.push('/dashboard');
      return;
    }
    if (!requireAuth && user && pathname.startsWith('/register')) {
      router.push('/dashboard');
      return;
    }

    // Check subscription tier if required
    if (user && subscriptionTiers && !subscriptionTiers.includes(user.subscription_tier)) {
      router.push('/upgrade');
      return;
    }
  }, [user, isLoading, requireAuth, redirectTo, subscriptionTiers, router, pathname]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if auth is required but user is not authenticated
  if (requireAuth && !user) {
    return null;
  }

  // Don't render if subscription tier doesn't match
  if (user && subscriptionTiers && !subscriptionTiers.includes(user.subscription_tier)) {
    return null;
  }

  return <>{children}</>;
}
