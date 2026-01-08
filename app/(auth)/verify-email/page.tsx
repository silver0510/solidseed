'use client';

/**
 * Email Verification Page
 *
 * Handles email verification token from URL
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyEmail } from '@/lib/auth/api';
import { formatAuthError } from '@/lib/auth/utils';

type VerificationStatus = 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    const verifyEmailToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided. Please check your email link.');
        return;
      }

      try {
        const response = await verifyEmail(token);

        if (response.success) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
          // Extract email from response or storage
          if (response.user?.email) {
            setEmail(response.user.email);
          }

          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/login?verified=true');
          }, 3000);
        }
      } catch (error) {
        setStatus('error');
        setMessage(formatAuthError(error instanceof Error ? error.message : undefined));
      }
    };

    verifyEmailToken();
  }, [token, router]);

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {status === 'loading' && (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Verifying Your Email</h2>
          <p className="mt-2 text-sm text-gray-600">
            Please wait while we verify your email address...
          </p>
        </div>
      )}

      {/* Success State */}
      {status === 'success' && (
        <>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Email Verified!</h2>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
          </div>

          <div className="rounded-md bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>Your account is now active!</strong> You can now login to access your
              dashboard. Redirecting to login page...
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
        </>
      )}

      {/* Error State */}
      {status === 'error' && (
        <>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
          </div>

          <div className="space-y-3">
            {/* Show resend option for expired tokens */}
            {message.toLowerCase().includes('expired') && (
              <div className="rounded-md bg-yellow-50 p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Verification link expired.</strong> No problem! Request a new one
                  below.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Link
                href="/resend-verification"
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Resend Verification Email
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Register Again
              </Link>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Back to Login
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
