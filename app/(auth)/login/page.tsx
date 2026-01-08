'use client';

/**
 * Login Page
 *
 * User login with email/password and OAuth options
 */

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/useAuth';
import { FormInput } from '@/components/auth/FormInput';
import { Button } from '@/components/auth/Button';
import { SocialLoginButton, SocialLoginDivider } from '@/components/auth/SocialLoginButton';
import { formatAuthError } from '@/lib/auth/utils';

export default function LoginPage() {
  const router = useRouter();
  const { login: loginUser, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await loginUser({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      // Redirect will be handled by AuthGuard
      router.push('/dashboard');
    } catch (error) {
      setApiError(formatAuthError(error instanceof Error ? error.message : undefined));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
        <p className="mt-2 text-sm text-gray-600">
          Sign in to your account to continue
        </p>
      </div>

      {/* Social Login */}
      <div className="space-y-3">
        <SocialLoginButton provider="google" onError={(error) => setApiError(error)} />
        <SocialLoginButton provider="microsoft" onError={(error) => setApiError(error)} />
      </div>

      <SocialLoginDivider />

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{apiError}</p>
          </div>
        )}

        <FormInput
          id="email"
          label="Email Address"
          type="email"
          autoComplete="email"
          required
          autoFocus
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          error={errors.email}
          placeholder="john@example.com"
        />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password <span className="text-red-500">*</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className={`block w-full rounded-md border px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="text-xs text-red-600">{errors.password}</p>
          )}
        </div>

        <div className="flex items-center">
          <input
            id="remember-me"
            type="checkbox"
            checked={formData.rememberMe}
            onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
            Remember me for 30 days
          </label>
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full">
          Sign In
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
}
