'use client';

/**
 * Reset Password Page
 *
 * Allows users to reset their password with a valid token
 */

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle, Check } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { resetPassword } from '@/lib/auth/api';
import { FormInput } from '@/components/auth/FormInput';
import { Button } from '@/components/auth/Button';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { formatAuthError } from '@/lib/auth/utils';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if token exists
    if (!token) {
      setTokenValid(false);
      setApiError('No reset token provided. Please request a new password reset link.');
    } else {
      setTokenValid(true);
    }
  }, [token]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    } else if (!/[^A-Za-z0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (!token) {
        throw new Error('No reset token provided');
      }

      await resetPassword({
        token,
        password: formData.password,
      });

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login?password-reset=true');
      }, 3000);
    } catch (err) {
      setApiError(formatAuthError(err instanceof Error ? err.message : undefined));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
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

  // Invalid token state
  if (tokenValid === false) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Invalid Reset Link</h2>
          <p className="mt-2 text-sm text-gray-600">
            {apiError || 'This password reset link is invalid or has expired.'}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Request New Reset Link
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Password Reset Successful!</h2>
          <p className="mt-2 text-sm text-gray-600">
            Your password has been reset successfully. You can now login with your new
            password.
          </p>
        </div>

        <div className="rounded-md bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            Redirecting to login page... Or click the button below to continue.
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Loading token validation
  if (tokenValid === null) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Spinner className="size-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Validating Reset Link</h2>
        <p className="mt-2 text-sm text-gray-600">Please wait...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Reset Your Password</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your new password below. Make sure it's strong and secure.
        </p>
      </div>

      {/* Reset Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{apiError}</p>
          </div>
        )}

        <FormInput
          id="password"
          label="New Password"
          type="password"
          autoComplete="new-password"
          required
          autoFocus
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          error={errors.password}
          placeholder="••••••••"
        />

        {formData.password && (
          <PasswordStrengthIndicator password={formData.password} />
        )}

        <FormInput
          id="confirmPassword"
          label="Confirm New Password"
          type="password"
          autoComplete="new-password"
          required
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
          placeholder="••••••••"
        />

        <Button type="submit" isLoading={isLoading} className="w-full">
          Reset Password
        </Button>
      </form>

      <div className="text-center">
        <Link
          href="/login"
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Spinner className="size-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Loading...</h2>
        <p className="mt-2 text-sm text-gray-600">Please wait...</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
