/**
 * Authentication Utility Functions
 */

import { type ReactNode, createElement } from 'react';

export interface User {
  id: string;
  email: string;
  full_name: string;
  subscription_tier: string;
  trial_expires_at?: string;
}

/**
 * Decode JWT token (client-side only)
 */
export function decodeToken(token: string): {
  userId: string;
  email: string;
  fullName: string;
  subscriptionTier: string;
  exp: number;
  iat: number;
} | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join('')
    );

    const decoded = JSON.parse(jsonPayload);
    return {
      userId: decoded.userId,
      email: decoded.email,
      fullName: decoded.fullName,
      subscriptionTier: decoded.subscriptionTier,
      exp: decoded.exp,
      iat: decoded.iat,
    };
  } catch {
    return null;
  }
}

/**
 * Check if JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded) return true;

  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
}

/**
 * Get time until token expiration (in milliseconds)
 */
export function getTokenExpirationTime(token: string): number | null {
  const decoded = decodeToken(token);
  if (!decoded) return null;

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = decoded.exp - now;

  return expiresIn > 0 ? expiresIn * 1000 : 0;
}

/**
 * Format remaining time as human-readable string
 */
export function formatTimeRemaining(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return 'less than a minute';
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Truncate email for privacy display
 */
export function truncateEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;

  const truncatedLocal =
    local.length > 3 ? local.slice(0, 3) + '***' : local;
  return `${truncatedLocal}@${domain}`;
}

/**
 * Get OAuth provider display name
 */
export function getOAuthProviderName(provider: string): string {
  const names: Record<string, string> = {
    google: 'Google',
    facebook: 'Facebook',
    apple: 'Apple',
  };
  return names[provider] || provider;
}

/**
 * Get OAuth provider icon/color
 */
export function getOAuthProviderInfo(provider: string): {
  name: string;
  color: string;
  icon: ReactNode;
} {
  const info: Record<string, { name: string; color: string; icon: string }> = {
    google: {
      name: 'Google',
      color: '#4285f4',
      icon: 'G',
    },
  };

  const defaultInfo = {
    name: provider,
    color: '#666666',
    icon: provider[0]?.toUpperCase() || '?',
  };

  const providerInfo = info[provider] || defaultInfo;

  return {
    ...providerInfo,
    icon: createElement('span', {
      className: 'font-semibold',
      children: providerInfo.icon,
    }),
  };
}

/**
 * Check if subscription trial has expired
 */
export function isTrialExpired(trialExpiresAt: string | undefined | null): boolean {
  if (!trialExpiresAt) return false;
  return new Date(trialExpiresAt) < new Date();
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(trialExpiresAt: string | undefined | null): number | null {
  if (!trialExpiresAt) return null;

  const now = new Date();
  const expires = new Date(trialExpiresAt);
  const diff = expires.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return days > 0 ? days : 0;
}

/**
 * Format error message for display
 */
export function formatAuthError(error: string | undefined): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const errorMessages: Record<string, string> = {
    'Invalid credentials': 'Invalid email or password',
    'Email not verified': 'Please verify your email before logging in',
    'Account locked': 'Your account has been locked due to too many failed login attempts. Please try again in 30 minutes or reset your password',
    'Account deactivated': 'Your account has been deactivated',
    'User not found': 'No account found with this email address',
    'Email already exists': 'An account with this email already exists',
    'Invalid token': 'Invalid or expired token',
    'Token expired': 'This link has expired',
    'Password too weak': 'Password does not meet security requirements',
    'Passwords do not match': 'Passwords do not match',
    'Incorrect password': 'Current password is incorrect',
    'Rate limit exceeded': 'Too many attempts. Please try again later',
  };

  return errorMessages[error] || error;
}
