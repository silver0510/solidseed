'use client';

/**
 * Registration Page
 *
 * User registration with email/password and OAuth options
 */

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { useAuth } from '@/lib/auth/useAuth';
import { FormInput } from '@/components/auth/FormInput';
import { Button } from '@/components/auth/Button';
import { SocialLoginButton, SocialLoginDivider } from '@/components/auth/SocialLoginButton';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { formatAuthError } from '@/lib/auth/utils';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, clearError } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    agreeToPrivacy: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

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

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms of Service';
    }

    if (!formData.agreeToPrivacy) {
      newErrors.agreeToPrivacy = 'You must agree to the Privacy Policy';
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
      await registerUser({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
      });

      setSuccess(true);
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

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendMessage(null);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResendMessage({
          type: 'error',
          text: data.message || 'Failed to resend verification email.',
        });
        return;
      }

      setResendMessage({
        type: 'success',
        text: data.message || 'Verification email sent successfully!',
      });
    } catch (error) {
      setResendMessage({
        type: 'error',
        text: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setResendLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Check Your Email</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            We&apos;ve sent a verification link to{' '}
            <span className="font-medium text-slate-900 dark:text-slate-100">{formData.email}</span>
          </p>
        </div>

        <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            <strong>Next steps:</strong>
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-600 dark:text-blue-300">
            <li>Check your inbox for the verification email</li>
            <li>Click the link to verify your account</li>
            <li>Return here to login</li>
          </ul>
        </div>

        {resendMessage && (
          <div className={`rounded-md p-4 ${resendMessage.type === 'success' ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
            <p className={`text-sm ${resendMessage.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
              {resendMessage.text}
            </p>
          </div>
        )}

        <div className="text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Didn&apos;t receive the email?{' '}
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {resendLoading ? 'Sending...' : 'Resend verification email'}
            </button>
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Go to login page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Create Your Account</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Start your 14-day free trial. No credit card required.
        </p>
      </div>

      {/* Social Login */}
      <div className="space-y-3">
        <SocialLoginButton provider="google" onError={(error) => setApiError(error)} />
      </div>

      <SocialLoginDivider />

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-700 dark:text-red-400">{apiError}</p>
          </div>
        )}

        <FormInput
          id="fullName"
          label="Full Name"
          type="text"
          autoComplete="name"
          required
          value={formData.fullName}
          onChange={(e) => handleInputChange('fullName', e.target.value)}
          error={errors.fullName}
          placeholder="John Doe"
        />

        <FormInput
          id="email"
          label="Email Address"
          type="email"
          autoComplete="email"
          required
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          error={errors.email}
          placeholder="john@example.com"
        />

        <FormInput
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          required
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
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          required
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
          placeholder="••••••••"
        />

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Checkbox
              id="agreeToTerms"
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked as boolean)}
              className="mt-0.5"
            />
            <Label htmlFor="agreeToTerms" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer leading-relaxed">
              I agree to the{' '}
              <Link href="/terms" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                Terms of Service
              </Link>
            </Label>
          </div>
          {errors.agreeToTerms && (
            <p className="text-xs text-red-500">{errors.agreeToTerms}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Checkbox
              id="agreeToPrivacy"
              checked={formData.agreeToPrivacy}
              onCheckedChange={(checked) => handleInputChange('agreeToPrivacy', checked as boolean)}
              className="mt-0.5"
            />
            <Label htmlFor="agreeToPrivacy" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer leading-relaxed">
              I agree to the{' '}
              <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                Privacy Policy
              </Link>
            </Label>
          </div>
          {errors.agreeToPrivacy && (
            <p className="text-xs text-red-500">{errors.agreeToPrivacy}</p>
          )}
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full">
          Create Account
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
