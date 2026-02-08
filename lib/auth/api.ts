/**
 * Authentication API Client
 *
 * Handles all HTTP requests to authentication endpoints
 */

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
    image?: string | null;
    phone?: string | null;
    subscription_tier: string;
    trial_expires_at?: string;
  };
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileData {
  full_name?: string;
  phone?: string;
  image?: string;
}

export interface ProfileResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    image: string | null;
    subscription_tier: string;
    trial_expires_at?: string;
  };
  error?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Helper function to make API requests
 */
async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}

/**
 * Get the current auth token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

/**
 * Set the auth token in localStorage
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
}

/**
 * Remove the auth token from localStorage
 */
export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
}

/**
 * Get authorization headers for authenticated requests
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Register a new user
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Login user
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  if (response.token) {
    setAuthToken(response.token);
  }

  return response;
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<AuthResponse> {
  return request<AuthResponse>(`/api/auth/verify-email?token=${token}`, {
    method: 'GET',
  });
}

/**
 * Resend verification email
 */
export async function resendVerification(email: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Request password reset
 */
export async function forgotPassword(email: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Reset password with token
 */
export async function resetPassword(data: ResetPasswordData): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Change password (authenticated)
 */
export async function changePassword(data: ChangePasswordData): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/change-password', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    }),
  });
}

/**
 * Get current user (authenticated)
 * Checks Better Auth session from cookies
 */
export async function getCurrentUser(): Promise<AuthResponse> {
  try {
    console.log('[getCurrentUser] Fetching session...');
    const response = await fetch('/api/auth/session', {
      credentials: 'include', // Important: include cookies in request
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[getCurrentUser] Response status:', response.status);
    const data = await response.json();
    console.log('[getCurrentUser] Response data:', JSON.stringify(data));

    // For session check, 401 is not an error - it means not authenticated
    // Return the response without throwing
    return data;
  } catch (error) {
    // Network error or other failure
    console.error('[getCurrentUser] Error:', error);
    return { success: false, error: 'Failed to check session', user: undefined };
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  removeAuthToken();
  // Optional: Call backend logout endpoint
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch {
    // Ignore errors during logout
  }
}

/**
 * Initiate OAuth login
 * Uses Better Auth client library to handle OAuth flow
 */
export async function initiateOAuth(provider: 'google'): Promise<void> {
  // Import dynamically to avoid SSR issues
  const { authClient } = await import('./client');

  // Build the full callback URL to ensure proper redirect after OAuth
  const callbackURL = `${window.location.origin}/dashboard`;

  // Use Better Auth client to initiate OAuth flow
  // This will redirect to the OAuth provider
  await authClient.signIn.social({
    provider,
    callbackURL,
  });
}

/**
 * Get user profile (authenticated)
 */
export async function getProfile(): Promise<ProfileResponse> {
  return request<ProfileResponse>('/api/auth/profile', {
    credentials: 'include',
  });
}

/**
 * Update user profile (authenticated)
 */
export async function updateProfile(data: UpdateProfileData): Promise<ProfileResponse> {
  return request<ProfileResponse>('/api/auth/profile', {
    method: 'PUT',
    credentials: 'include',
    body: JSON.stringify(data),
  });
}
