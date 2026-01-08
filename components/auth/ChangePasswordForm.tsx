'use client';

/**
 * Change Password Form Component
 *
 * Allows authenticated users to change their password
 */

import { useState, FormEvent } from 'react';
import { changePassword } from '@/lib/auth/api';
import { FormInput } from '@/components/auth/FormInput';
import { Button } from '@/components/auth/Button';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { formatAuthError } from '@/lib/auth/utils';

interface ChangePasswordFormProps {
  onSuccess?: () => void;
}

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one number';
    } else if (!/[^A-Za-z0-9]/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one special character';
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
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
      await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      setSuccess(true);

      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Call success callback
      onSuccess?.();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
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

  return (
    <div className="space-y-4">
      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">
            <strong>Success!</strong> Your password has been changed successfully.
          </p>
        </div>
      )}

      {apiError && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          id="currentPassword"
          label="Current Password"
          type="password"
          autoComplete="current-password"
          required
          value={formData.currentPassword}
          onChange={(e) => handleInputChange('currentPassword', e.target.value)}
          error={errors.currentPassword}
          placeholder="••••••••"
        />

        <FormInput
          id="newPassword"
          label="New Password"
          type="password"
          autoComplete="new-password"
          required
          value={formData.newPassword}
          onChange={(e) => handleInputChange('newPassword', e.target.value)}
          error={errors.newPassword}
          placeholder="••••••••"
        />

        {formData.newPassword && (
          <PasswordStrengthIndicator password={formData.newPassword} />
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

        <Button type="submit" isLoading={isLoading}>
          Change Password
        </Button>
      </form>
    </div>
  );
}
