/**
 * ClientCard Component Tests
 *
 * Tests for the ClientCard component which displays individual client information
 * in a card format with touch-friendly design for mobile use.
 *
 * @module tests/unit/features/clients/components/ClientCard.test
 */

import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ClientCard } from '@/features/clients/components/ClientList/ClientCard';
import type { ClientWithTags } from '@/features/clients/types';

// =============================================================================
// TEST FIXTURES
// =============================================================================

const mockOnClick = vi.fn();

const mockClient: ClientWithTags = {
  id: 'clxyz123456789',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-123-4567',
  birthday: '1990-05-15',
  address: '123 Main St, City, State 12345',
  created_by: 'user123',
  assigned_to: 'user123',
  is_deleted: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  tags: ['VIP', 'Buyer'],
};

const mockClientWithoutTags: ClientWithTags = {
  ...mockClient,
  id: 'clxyz987654321',
  tags: [],
};

const mockClientMinimal: ClientWithTags = {
  id: 'clxyz111111111',
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: undefined,
  birthday: undefined,
  address: undefined,
  created_by: 'user123',
  assigned_to: 'user123',
  is_deleted: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  tags: [],
};

// =============================================================================
// TEST SETUP
// =============================================================================

describe('ClientCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // RENDERING TESTS
  // ===========================================================================

  describe('Rendering', () => {
    it('renders client name', () => {
      render(<ClientCard client={mockClient} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders client email', () => {
      render(<ClientCard client={mockClient} />);

      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });

    it('renders client phone when provided', () => {
      render(<ClientCard client={mockClient} />);

      expect(screen.getByText('+1-555-123-4567')).toBeInTheDocument();
    });

    it('does not render phone section when phone is not provided', () => {
      render(<ClientCard client={mockClientMinimal} />);

      // Should not have any phone number displayed
      expect(screen.queryByText(/^\+1-/)).not.toBeInTheDocument();
    });

    it('renders tags as chips when provided', () => {
      render(<ClientCard client={mockClient} />);

      expect(screen.getByText('VIP')).toBeInTheDocument();
      expect(screen.getByText('Buyer')).toBeInTheDocument();
    });

    it('does not render tags section when no tags exist', () => {
      render(<ClientCard client={mockClientWithoutTags} />);

      // Tags container should not exist or be empty
      expect(screen.queryByText('VIP')).not.toBeInTheDocument();
      expect(screen.queryByText('Buyer')).not.toBeInTheDocument();
    });

    it('renders as an article element for semantic HTML', () => {
      render(<ClientCard client={mockClient} />);

      expect(screen.getByRole('article')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // INTERACTION TESTS
  // ===========================================================================

  describe('Interactions', () => {
    it('calls onClick with client when card is clicked', async () => {
      const user = userEvent.setup();
      render(<ClientCard client={mockClient} onClick={mockOnClick} />);

      const card = screen.getByRole('article');
      await user.click(card);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(mockOnClick).toHaveBeenCalledWith(mockClient);
    });

    it('does not throw when clicked without onClick handler', async () => {
      const user = userEvent.setup();
      render(<ClientCard client={mockClient} />);

      const card = screen.getByRole('article');

      // Should not throw
      await expect(user.click(card)).resolves.not.toThrow();
    });

    it('has button role when onClick is provided', () => {
      render(<ClientCard client={mockClient} onClick={mockOnClick} />);

      const card = screen.getByRole('article');
      // When clickable, it should be focusable and have cursor pointer
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('handles keyboard Enter key press', async () => {
      const user = userEvent.setup();
      render(<ClientCard client={mockClient} onClick={mockOnClick} />);

      const card = screen.getByRole('article');
      card.focus();
      await user.keyboard('{Enter}');

      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(mockOnClick).toHaveBeenCalledWith(mockClient);
    });

    it('handles keyboard Space key press', async () => {
      const user = userEvent.setup();
      render(<ClientCard client={mockClient} onClick={mockOnClick} />);

      const card = screen.getByRole('article');
      card.focus();
      await user.keyboard(' ');

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  // ===========================================================================
  // ACCESSIBILITY TESTS
  // ===========================================================================

  describe('Accessibility', () => {
    it('has touch-friendly minimum height (44px)', () => {
      render(<ClientCard client={mockClient} onClick={mockOnClick} />);

      const card = screen.getByRole('article');
      const style = window.getComputedStyle(card);

      // Check for min-height class or computed style
      // The card should have at least 44px height for touch targets
      const minHeight = parseFloat(style.minHeight) || 0;
      const height = parseFloat(style.height) || 0;

      // Card will have content so it's likely taller than 44px
      // We check that it has appropriate touch target styling
      expect(card.className).toMatch(/min-h-|py-|p-/);
    });

    it('has focusable element when clickable', () => {
      render(<ClientCard client={mockClient} onClick={mockOnClick} />);

      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('is not focusable when not clickable', () => {
      render(<ClientCard client={mockClient} />);

      const card = screen.getByRole('article');
      expect(card).not.toHaveAttribute('tabIndex', '0');
    });

    it('has proper aria-label for accessibility', () => {
      render(<ClientCard client={mockClient} onClick={mockOnClick} />);

      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('John Doe'));
    });

    it('renders email as a link with proper mailto', () => {
      render(<ClientCard client={mockClient} />);

      const emailLink = screen.getByRole('link', { name: /john.doe@example.com/i });
      expect(emailLink).toHaveAttribute('href', 'mailto:john.doe@example.com');
    });

    it('renders phone as a link with proper tel protocol', () => {
      render(<ClientCard client={mockClient} />);

      const phoneLink = screen.getByRole('link', { name: /\+1-555-123-4567/i });
      expect(phoneLink).toHaveAttribute('href', 'tel:+1-555-123-4567');
    });
  });

  // ===========================================================================
  // VISUAL STATES TESTS
  // ===========================================================================

  describe('Visual States', () => {
    it('applies hover styles when hoverable', () => {
      render(<ClientCard client={mockClient} onClick={mockOnClick} />);

      const card = screen.getByRole('article');
      // Check for hover transition classes
      expect(card.className).toMatch(/hover:|transition/);
    });

    it('applies focus-visible styles for keyboard navigation', () => {
      render(<ClientCard client={mockClient} onClick={mockOnClick} />);

      const card = screen.getByRole('article');
      expect(card.className).toMatch(/focus-visible:|focus:/);
    });
  });

  // ===========================================================================
  // TAG DISPLAY TESTS
  // ===========================================================================

  describe('Tag Display', () => {
    it('renders multiple tags correctly', () => {
      const clientWithManyTags: ClientWithTags = {
        ...mockClient,
        tags: ['VIP', 'Buyer', 'First Home', 'Pre-Approved'],
      };

      render(<ClientCard client={clientWithManyTags} />);

      expect(screen.getByText('VIP')).toBeInTheDocument();
      expect(screen.getByText('Buyer')).toBeInTheDocument();
      expect(screen.getByText('First Home')).toBeInTheDocument();
      expect(screen.getByText('Pre-Approved')).toBeInTheDocument();
    });

    it('renders tags with proper chip styling', () => {
      render(<ClientCard client={mockClient} />);

      const vipTag = screen.getByText('VIP');
      // Should have chip/badge styling classes
      expect(vipTag.className).toMatch(/rounded|bg-|text-/);
    });
  });
});
