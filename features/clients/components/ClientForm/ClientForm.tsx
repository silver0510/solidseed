'use client';

/**
 * Client Form Component
 *
 * Form component for creating and editing client records.
 * Uses react-hook-form with Zod validation.
 *
 * Mobile-first design:
 * - Full-width inputs on mobile (375px+)
 * - Larger touch targets (min 44px height)
 * - Optimized for keyboard-aware scrolling
 * - Sticky action buttons on mobile
 *
 * @module features/clients/components/ClientForm/ClientForm
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect } from 'react';
import { FormInput } from '@/components/auth/FormInput';
import { Button } from '@/components/auth/Button';
import { cn } from '@/lib/utils/cn';
import {
  clientFormSchema,
  defaultClientFormValues,
  type ClientFormSchemaType,
} from './clientFormSchema';
import type { Client, ClientFormData } from '@/features/clients/types';

// =============================================================================
// TYPES
// =============================================================================

export interface ClientFormProps {
  /** Existing client data for edit mode */
  client?: Client;
  /** Callback when form is submitted with valid data */
  onSubmit: (data: ClientFormData) => Promise<void>;
  /** Callback when cancel button is clicked */
  onCancel?: () => void;
  /** External loading state (overrides internal state) */
  isSubmitting?: boolean;
  /** Custom className for the form container */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * ClientForm Component
 *
 * Renders a form for creating or editing client records.
 * Handles validation for required fields and format validation.
 *
 * @param props - Component props
 * @returns React component
 */
export const ClientForm: React.FC<ClientFormProps> = ({
  client,
  onSubmit,
  onCancel,
  isSubmitting: externalIsSubmitting,
  className,
}) => {
  // ---------------------------------------------------------------------------
  // Form Setup
  // ---------------------------------------------------------------------------

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting: formIsSubmitting },
  } = useForm<ClientFormSchemaType>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: client
      ? {
          name: client.name,
          email: client.email,
          phone: client.phone ?? '',
          birthday: client.birthday ?? '',
          address: client.address ?? '',
        }
      : defaultClientFormValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  // Combined loading state
  const isLoading = externalIsSubmitting ?? formIsSubmitting;

  // Determine if we're in edit mode
  const isEditMode = Boolean(client);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Reset form when client data changes (for edit mode)
  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        email: client.email,
        phone: client.phone ?? '',
        birthday: client.birthday ?? '',
        address: client.address ?? '',
      });
    }
  }, [client, reset]);

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  const handleFormSubmit = useCallback(
    async (data: ClientFormSchemaType) => {
      // Transform schema type to ClientFormData
      const formData: ClientFormData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        birthday: data.birthday || undefined,
        address: data.address || undefined,
      };

      await onSubmit(formData);
    },
    [onSubmit]
  );

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={cn(
        // Base layout - mobile-first
        'flex flex-col space-y-4',
        // Min height to ensure proper layout on mobile
        'min-h-0',
        // Padding for mobile edge spacing
        'px-1',
        // Custom className override
        className
      )}
      noValidate
      aria-label={isEditMode ? 'Edit client form' : 'Create client form'}
    >
      {/* Form Fields Container - scrollable on mobile with keyboard */}
      <div
        className="flex-1 space-y-5 overflow-y-auto pb-4"
        role="group"
        aria-label="Client information"
      >
        {/* Name Field - Required */}
        <FormInput
          id="name"
          label="Name"
          type="text"
          required
          autoComplete="name"
          disabled={isLoading}
          error={errors.name?.message}
          aria-invalid={errors.name ? 'true' : 'false'}
          aria-describedby={errors.name ? 'name-error' : undefined}
          {...register('name')}
        />

        {/* Email Field - Required */}
        <FormInput
          id="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          disabled={isLoading}
          error={errors.email?.message}
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />

        {/* Phone Field - Required */}
        <div className="space-y-1.5">
          <FormInput
            id="phone"
            label="Phone"
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            disabled={isLoading}
            placeholder="+1-XXX-XXX-XXXX"
            error={errors.phone?.message}
            aria-invalid={errors.phone ? 'true' : 'false'}
            aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'}
            {...register('phone')}
          />
          {!errors.phone && (
            <p id="phone-hint" className="text-xs text-gray-500">
              Format: +1-XXX-XXX-XXXX
            </p>
          )}
        </div>

        {/* Birthday Field - Optional */}
        <FormInput
          id="birthday"
          label="Birthday"
          type="date"
          autoComplete="bday"
          disabled={isLoading}
          error={errors.birthday?.message}
          aria-invalid={errors.birthday ? 'true' : 'false'}
          aria-describedby={errors.birthday ? 'birthday-error' : undefined}
          {...register('birthday')}
        />

        {/* Address Field - Optional */}
        <FormInput
          id="address"
          label="Address"
          type="text"
          autoComplete="street-address"
          disabled={isLoading}
          error={errors.address?.message}
          aria-invalid={errors.address ? 'true' : 'false'}
          aria-describedby={errors.address ? 'address-error' : undefined}
          {...register('address')}
        />
      </div>

      {/* Form Actions - Sticky on mobile for keyboard-aware positioning */}
      <div
        className={cn(
          // Flex layout for buttons
          'flex gap-3 pt-4',
          // Border top for visual separation
          'border-t border-border',
          // Sticky positioning for mobile keyboard
          'sticky bottom-0',
          // Background to prevent content showing through
          'bg-background',
          // Safe area padding for iOS
          'pb-safe',
          // Button alignment
          onCancel ? 'justify-between' : 'justify-end'
        )}
        role="group"
        aria-label="Form actions"
      >
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 sm:flex-initial"
          >
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          variant="default"
          isLoading={isLoading}
          disabled={isLoading}
          className={cn('flex-1 sm:flex-initial', !onCancel && 'w-full sm:w-auto')}
        >
          {isLoading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Client'}
        </Button>
      </div>
    </form>
  );
};

export default ClientForm;
