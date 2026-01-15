'use client';

/**
 * Client Form Component
 *
 * Form component for creating and editing client records.
 * Uses react-hook-form with Zod validation.
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
      className="space-y-4"
      noValidate
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

      {/* Form Actions */}
      <div className={cn('flex gap-3 pt-4', onCancel ? 'justify-between' : 'justify-end')}>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Client'}
        </Button>
      </div>
    </form>
  );
};

export default ClientForm;
