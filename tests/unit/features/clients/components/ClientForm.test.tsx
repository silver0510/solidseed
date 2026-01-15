/**
 * ClientForm Component Tests
 *
 * Tests for the ClientForm component which handles client creation and editing.
 * Uses react-hook-form with Zod validation.
 *
 * @module tests/unit/features/clients/components/ClientForm.test
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ClientForm } from '@/features/clients/components/ClientForm';
import type { Client, ClientFormData } from '@/features/clients/types';

// =============================================================================
// TEST FIXTURES
// =============================================================================

const mockOnSubmit = vi.fn<(data: ClientFormData) => Promise<void>>();
const mockOnCancel = vi.fn();

const validFormData: ClientFormData = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-123-4567',
  birthday: '1990-05-15',
  address: '123 Main St, City, State 12345',
};

const existingClient: Client = {
  id: 'clxyz123456789',
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  phone: '+1-555-987-6543',
  birthday: '1985-08-20',
  address: '456 Oak Ave, Town, State 67890',
  created_by: 'user123',
  assigned_to: 'user123',
  is_deleted: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// =============================================================================
// TEST SETUP
// =============================================================================

describe('ClientForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  // ===========================================================================
  // RENDERING TESTS
  // ===========================================================================

  describe('Rendering', () => {
    it('renders all form fields', () => {
      render(<ClientForm onSubmit={mockOnSubmit} />);

      // Name field
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();

      // Email field
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();

      // Phone field
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();

      // Birthday field (optional)
      expect(screen.getByLabelText(/birthday/i)).toBeInTheDocument();

      // Address field (optional)
      expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<ClientForm onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('button', { name: /save|submit|create/i })).toBeInTheDocument();
    });

    it('renders cancel button when onCancel is provided', () => {
      render(<ClientForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('does not render cancel button when onCancel is not provided', () => {
      render(<ClientForm onSubmit={mockOnSubmit} />);

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });

    it('shows required indicator for required fields', () => {
      render(<ClientForm onSubmit={mockOnSubmit} />);

      // Check that required fields have visual indicator
      const nameLabel = screen.getByText(/name/i);
      const emailLabel = screen.getByText(/email/i);
      const phoneLabel = screen.getByText(/phone/i);

      // Required fields should have * or similar indicator
      expect(nameLabel.closest('label') || nameLabel.parentElement).toHaveTextContent(/\*/);
      expect(emailLabel.closest('label') || emailLabel.parentElement).toHaveTextContent(/\*/);
      expect(phoneLabel.closest('label') || phoneLabel.parentElement).toHaveTextContent(/\*/);
    });

    it('shows phone format hint', () => {
      render(<ClientForm onSubmit={mockOnSubmit} />);

      expect(screen.getByText(/\+1-XXX-XXX-XXXX/i)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // VALIDATION TESTS - REQUIRED FIELDS
  // ===========================================================================

  describe('Required Field Validation', () => {
    it('shows error when name is empty', async () => {
      const user = userEvent.setup();
      render(<ClientForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /save|submit|create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error when email is empty', async () => {
      const user = userEvent.setup();
      render(<ClientForm onSubmit={mockOnSubmit} />);

      // Fill only name
      await user.type(screen.getByLabelText(/name/i), 'John Doe');

      const submitButton = screen.getByRole('button', { name: /save|submit|create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error when phone is empty', async () => {
      const user = userEvent.setup();
      render(<ClientForm onSubmit={mockOnSubmit} />);

      // Fill name and email
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');

      const submitButton = screen.getByRole('button', { name: /save|submit|create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/phone is required/i)).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // VALIDATION TESTS - FORMAT VALIDATION
  // ===========================================================================

  describe('Format Validation', () => {
    it('validates email format', async () => {
      const user = userEvent.setup();
      render(<ClientForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'invalid-email');
      await user.type(screen.getByLabelText(/phone/i), '+1-555-123-4567');

      const submitButton = screen.getByRole('button', { name: /save|submit|create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('validates phone format - missing country code', async () => {
      const user = userEvent.setup();
      render(<ClientForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/phone/i), '555-123-4567');

      const submitButton = screen.getByRole('button', { name: /save|submit|create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/phone.*format/i)).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('validates phone format - incorrect format', async () => {
      const user = userEvent.setup();
      render(<ClientForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/phone/i), '+1-55-123-4567');

      const submitButton = screen.getByRole('button', { name: /save|submit|create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/phone.*format/i)).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('accepts valid phone format +1-XXX-XXX-XXXX', async () => {
      const user = userEvent.setup();
      render(<ClientForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/phone/i), '+1-555-123-4567');

      const submitButton = screen.getByRole('button', { name: /save|submit|create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('validates birthday is not in the future', async () => {
      const user = userEvent.setup();
      render(<ClientForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/phone/i), '+1-555-123-4567');

      // Set a future date
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      await user.type(screen.getByLabelText(/birthday/i), futureDateStr);

      const submitButton = screen.getByRole('button', { name: /save|submit|create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/birthday.*past|future/i)).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('accepts empty birthday (optional field)', async () => {
      const user = userEvent.setup();
      render(<ClientForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/phone/i), '+1-555-123-4567');

      // Don't fill birthday

      const submitButton = screen.getByRole('button', { name: /save|submit|create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('accepts empty address (optional field)', async () => {
      const user = userEvent.setup();
      render(<ClientForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/phone/i), '+1-555-123-4567');

      // Don't fill address

      const submitButton = screen.getByRole('button', { name: /save|submit|create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  // ===========================================================================
  // SUBMISSION TESTS
  // ===========================================================================

  describe('Form Submission', () => {
    it('calls onSubmit with valid data', async () => {
      const user = userEvent.setup();
      render(<ClientForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByLabelText(/name/i), validFormData.name);
      await user.type(screen.getByLabelText(/email/i), validFormData.email);
      await user.type(screen.getByLabelText(/phone/i), validFormData.phone);
      await user.type(screen.getByLabelText(/birthday/i), validFormData.birthday!);
      await user.type(screen.getByLabelText(/address/i), validFormData.address!);

      const submitButton = screen.getByRole('button', { name: /save|submit|create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: validFormData.name,
            email: validFormData.email,
            phone: validFormData.phone,
            birthday: validFormData.birthday,
            address: validFormData.address,
          })
        );
      });
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<ClientForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // EDIT MODE TESTS
  // ===========================================================================

  describe('Edit Mode', () => {
    it('pre-fills form with existing client data', () => {
      render(<ClientForm client={existingClient} onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/name/i)).toHaveValue(existingClient.name);
      expect(screen.getByLabelText(/email/i)).toHaveValue(existingClient.email);
      expect(screen.getByLabelText(/phone/i)).toHaveValue(existingClient.phone);
      expect(screen.getByLabelText(/birthday/i)).toHaveValue(existingClient.birthday);
      expect(screen.getByLabelText(/address/i)).toHaveValue(existingClient.address);
    });

    it('shows update button text in edit mode', () => {
      render(<ClientForm client={existingClient} onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('button', { name: /update|save/i })).toBeInTheDocument();
    });

    it('allows editing pre-filled values', async () => {
      const user = userEvent.setup();
      render(<ClientForm client={existingClient} onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/name/i);

      // Clear and type new value
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      const submitButton = screen.getByRole('button', { name: /update|save/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Updated Name',
          })
        );
      });
    });

    it('handles client with missing optional fields', () => {
      const clientWithoutOptionals: Client = {
        ...existingClient,
        phone: undefined,
        birthday: undefined,
        address: undefined,
      };

      render(<ClientForm client={clientWithoutOptionals} onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/name/i)).toHaveValue(clientWithoutOptionals.name);
      expect(screen.getByLabelText(/email/i)).toHaveValue(clientWithoutOptionals.email);
      expect(screen.getByLabelText(/phone/i)).toHaveValue('');
      expect(screen.getByLabelText(/birthday/i)).toHaveValue('');
      expect(screen.getByLabelText(/address/i)).toHaveValue('');
    });
  });

  // ===========================================================================
  // LOADING STATE TESTS
  // ===========================================================================

  describe('Loading State', () => {
    it('disables submit button during submission', async () => {
      // Make onSubmit hang to simulate loading
      mockOnSubmit.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      const user = userEvent.setup();
      render(<ClientForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/phone/i), '+1-555-123-4567');

      const submitButton = screen.getByRole('button', { name: /save|submit|create/i });
      await user.click(submitButton);

      // Button should be disabled during submission
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('shows loading state when isSubmitting is true', () => {
      render(<ClientForm onSubmit={mockOnSubmit} isSubmitting={true} />);

      const submitButton = screen.getByRole('button', { name: /saving|loading|submitting/i });
      expect(submitButton).toBeDisabled();
    });

    it('disables form fields during submission', () => {
      render(<ClientForm onSubmit={mockOnSubmit} isSubmitting={true} />);

      expect(screen.getByLabelText(/name/i)).toBeDisabled();
      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(screen.getByLabelText(/phone/i)).toBeDisabled();
    });
  });

  // ===========================================================================
  // ACCESSIBILITY TESTS
  // ===========================================================================

  describe('Accessibility', () => {
    it('has proper labels for all inputs', () => {
      render(<ClientForm onSubmit={mockOnSubmit} />);

      // All inputs should be accessible by their labels
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/birthday/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    });

    it('associates error messages with inputs', async () => {
      const user = userEvent.setup();
      render(<ClientForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /save|submit|create/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Error messages should be present and accessible
        const nameInput = screen.getByLabelText(/name/i);
        const describedBy = nameInput.getAttribute('aria-describedby');
        // Input should have aria-describedby pointing to error message or aria-invalid
        expect(
          nameInput.getAttribute('aria-invalid') === 'true' || describedBy
        ).toBeTruthy();
      });
    });

    it('sets correct input types', () => {
      render(<ClientForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText(/phone/i)).toHaveAttribute('type', 'tel');
      expect(screen.getByLabelText(/birthday/i)).toHaveAttribute('type', 'date');
    });

    it('sets autocomplete attributes', () => {
      render(<ClientForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/name/i)).toHaveAttribute('autocomplete', 'name');
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('autocomplete', 'email');
      expect(screen.getByLabelText(/phone/i)).toHaveAttribute('autocomplete', 'tel');
      expect(screen.getByLabelText(/birthday/i)).toHaveAttribute('autocomplete', 'bday');
      expect(screen.getByLabelText(/address/i)).toHaveAttribute('autocomplete', 'street-address');
    });
  });

  // ===========================================================================
  // ERROR DISPLAY TESTS
  // ===========================================================================

  describe('Error Display', () => {
    it('clears errors when valid input is provided', async () => {
      const user = userEvent.setup();
      render(<ClientForm onSubmit={mockOnSubmit} />);

      // Submit empty form to trigger errors
      const submitButton = screen.getByRole('button', { name: /save|submit|create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });

      // Fill in the name field
      await user.type(screen.getByLabelText(/name/i), 'John Doe');

      // Error should clear when user types
      await waitFor(() => {
        expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
      });
    });

    it('shows multiple validation errors at once', async () => {
      const user = userEvent.setup();
      render(<ClientForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /save|submit|create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/phone is required/i)).toBeInTheDocument();
      });
    });
  });
});
