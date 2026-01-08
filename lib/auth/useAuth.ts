'use client';

/**
 * Authentication Hook
 *
 * Provides authentication state and methods throughout the app
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/lib/auth/utils';
import {
  getAuthToken,
  removeAuthToken,
  getCurrentUser,
  login,
  register,
  logout,
  type LoginCredentials,
  type RegisterData,
} from '@/lib/auth/api';
import { isTokenExpired, decodeToken } from '@/lib/auth/utils';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Fetch current user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = getAuthToken();

        if (!token || isTokenExpired(token)) {
          removeAuthToken();
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Try to fetch current user from API
        const response = await getCurrentUser();

        if (response.user) {
          setUser(response.user);
        } else {
          // Fallback: decode from token
          const decoded = decodeToken(token);
          if (decoded) {
            setUser({
              id: decoded.userId,
              email: decoded.email,
              full_name: decoded.fullName,
              subscription_tier: decoded.subscriptionTier,
            });
          }
        }
      } catch {
        // If fetching fails, try to decode token
        const token = getAuthToken();
        if (token && !isTokenExpired(token)) {
          const decoded = decodeToken(token);
          if (decoded) {
            setUser({
              id: decoded.userId,
              email: decoded.email,
              full_name: decoded.fullName,
              subscription_tier: decoded.subscriptionTier,
            });
          }
        } else {
          removeAuthToken();
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login method
  const handleLogin = async (credentials: LoginCredentials) => {
    setError(null);
    try {
      const response = await login(credentials);
      if (response.user) {
        setUser(response.user);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    }
  };

  // Register method
  const handleRegister = async (data: RegisterData) => {
    setError(null);
    try {
      await register(data);
      // Don't set user - they need to verify email first
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    }
  };

  // Logout method
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const response = await getCurrentUser();
      if (response.user) {
        setUser(response.user);
      }
    } catch {
      // If refresh fails, token might be expired
      await handleLogout();
    }
  };

  // Clear error
  const clearError = () => setError(null);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    refreshUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
