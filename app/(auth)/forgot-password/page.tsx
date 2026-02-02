'use client';

/**
 * Forgot Password Page
 *
 * Allows users to request a password reset email
 */

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { forgotPassword } from '@/lib/auth/api';
import { FormInput } from '@/components/auth/FormInput';
import { Button } from '@/components/auth/Button';
import { formatAuthError } from '@/lib/auth/utils';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email format');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await forgotPassword(email.toLowerCase().trim());
      setSuccess(true);
      setSubmittedEmail(email.toLowerCase().trim());
    } catch (err) {
      setError(formatAuthError(err instanceof Error ? err.message : undefined));
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Check Your Email</h2>
          <p className="mt-2 text-sm text-gray-600">
            If an account exists for{' '}
            <span className="font-medium text-gray-900">{submittedEmail}</span>, you will
            receive a password reset link shortly.
          </p>
        </div>

        <div className="rounded-md bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Next steps:</strong>
            <ul className="mt-2 list-inside list-disc space-y-1 text-blue-700">
              <li>Check your inbox for the reset link</li>
              <li>The link will expire in 1 hour</li>
              <li>Click the link to create a new password</li>
            </ul>
          </p>
        </div>

        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            <strong>Didn't receive the email?</strong> Check your spam folder or request a
            new link.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              setSuccess(false);
              setEmail('');
            }}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Request Another Reset Link
          </button>

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Forgot Your Password?</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <FormInput
          id="email"
          label="Email Address"
          type="email"
          autoComplete="email"
          required
          autoFocus
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          error={error && !email ? 'Email is required' : undefined}
          placeholder="john@example.com"
        />

        <Button type="submit" isLoading={isLoading} className="w-full">
          Send Reset Link
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
