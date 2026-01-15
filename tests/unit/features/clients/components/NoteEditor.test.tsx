/**
 * NoteEditor Component Tests
 *
 * Tests for the NoteEditor component which handles note creation and editing
 * with importance toggle support.
 *
 * @module tests/unit/features/clients/components/NoteEditor.test
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NoteEditor } from '@/features/clients/components/NoteEditor';
import { NoteList } from '@/features/clients/components/NoteEditor/NoteList';
import type { ClientNote, NoteFormData } from '@/features/clients/types';

// =============================================================================
// TEST FIXTURES
// =============================================================================

const mockClientId = 'clxyz123456789';

const mockNote: ClientNote = {
  id: 'note_123',
  client_id: mockClientId,
  content: 'Test note content',
  is_important: false,
  created_by: 'user_123',
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
};

const mockImportantNote: ClientNote = {
  id: 'note_456',
  client_id: mockClientId,
  content: 'Important note content',
  is_important: true,
  created_by: 'user_123',
  created_at: '2024-01-14T08:00:00Z',
  updated_at: '2024-01-14T08:00:00Z',
};

const mockNotes: ClientNote[] = [mockNote, mockImportantNote];

// =============================================================================
// NOTE EDITOR TESTS
// =============================================================================

describe('NoteEditor', () => {
  const mockOnSubmit = vi.fn<(data: NoteFormData) => Promise<void>>();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  // ===========================================================================
  // RENDERING TESTS
  // ===========================================================================

  describe('Rendering', () => {
    it('renders textarea for note content', () => {
      render(<NoteEditor clientId={mockClientId} onSubmit={mockOnSubmit} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('renders placeholder text in textarea', () => {
      render(<NoteEditor clientId={mockClientId} onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText(/add.*note|write.*note|note.*content/i);
      expect(textarea).toBeInTheDocument();
    });

    it('shows importance star toggle', () => {
      render(<NoteEditor clientId={mockClientId} onSubmit={mockOnSubmit} />);

      // Should have a button or toggle for importance
      const importanceToggle = screen.getByRole('button', { name: /important|star/i }) ||
        screen.getByLabelText(/important|mark.*important/i);
      expect(importanceToggle).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<NoteEditor clientId={mockClientId} onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /save|add|submit|create/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('renders cancel button when onCancel is provided', () => {
      render(
        <NoteEditor
          clientId={mockClientId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeInTheDocument();
    });

    it('does not render cancel button when onCancel is not provided', () => {
      render(<NoteEditor clientId={mockClientId} onSubmit={mockOnSubmit} />);

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // VALIDATION TESTS
  // ===========================================================================

  describe('Validation', () => {
    it('disables submit button when content is empty', () => {
      render(<NoteEditor clientId={mockClientId} onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /save|add|submit|create/i });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when content is not empty', async () => {
      const user = userEvent.setup();
      render(<NoteEditor clientId={mockClientId} onSubmit={mockOnSubmit} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Some note content');

      const submitButton = screen.getByRole('button', { name: /save|add|submit|create/i });
      expect(submitButton).toBeEnabled();
    });

    it('disables submit button when content is only whitespace', async () => {
      const user = userEvent.setup();
      render(<NoteEditor clientId={mockClientId} onSubmit={mockOnSubmit} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '   ');

      const submitButton = screen.getByRole('button', { name: /save|add|submit|create/i });
      expect(submitButton).toBeDisabled();
    });
  });

  // ===========================================================================
  // IMPORTANCE TOGGLE TESTS
  // ===========================================================================

  describe('Importance Toggle', () => {
    it('importance toggle is not active by default', () => {
      render(<NoteEditor clientId={mockClientId} onSubmit={mockOnSubmit} />);

      const importanceToggle = screen.getByRole('button', { name: /important|star/i }) ||
        screen.getByLabelText(/important|mark.*important/i);

      // Check it's not active (aria-pressed="false" or no active class)
      expect(
        importanceToggle.getAttribute('aria-pressed') === 'false' ||
        !importanceToggle.classList.contains('active') ||
        !importanceToggle.querySelector('[data-active="true"]')
      ).toBeTruthy();
    });

    it('toggles importance when clicked', async () => {
      const user = userEvent.setup();
      render(<NoteEditor clientId={mockClientId} onSubmit={mockOnSubmit} />);

      const importanceToggle = screen.getByRole('button', { name: /important|star/i }) ||
        screen.getByLabelText(/important|mark.*important/i);

      await user.click(importanceToggle);

      // Should now be active
      expect(
        importanceToggle.getAttribute('aria-pressed') === 'true' ||
        importanceToggle.classList.contains('active') ||
        importanceToggle.querySelector('[data-active="true"]')
      ).toBeTruthy();
    });

    it('submits with is_important true when toggled', async () => {
      const user = userEvent.setup();
      render(<NoteEditor clientId={mockClientId} onSubmit={mockOnSubmit} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Important note');

      const importanceToggle = screen.getByRole('button', { name: /important|star/i }) ||
        screen.getByLabelText(/important|mark.*important/i);
      await user.click(importanceToggle);

      const submitButton = screen.getByRole('button', { name: /save|add|submit|create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          content: 'Important note',
          is_important: true,
        });
      });
    });

    it('submits with is_important false when not toggled', async () => {
      const user = userEvent.setup();
      render(<NoteEditor clientId={mockClientId} onSubmit={mockOnSubmit} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Regular note');

      const submitButton = screen.getByRole('button', { name: /save|add|submit|create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          content: 'Regular note',
          is_important: false,
        });
      });
    });
  });

  // ===========================================================================
  // EDIT MODE TESTS
  // ===========================================================================

  describe('Edit Mode', () => {
    it('pre-fills content when editing existing note', () => {
      render(
        <NoteEditor
          clientId={mockClientId}
          note={mockNote}
          onSubmit={mockOnSubmit}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Test note content');
    });

    it('pre-fills importance toggle when editing important note', () => {
      render(
        <NoteEditor
          clientId={mockClientId}
          note={mockImportantNote}
          onSubmit={mockOnSubmit}
        />
      );

      const importanceToggle = screen.getByRole('button', { name: /important|star/i }) ||
        screen.getByLabelText(/important|mark.*important/i);

      expect(
        importanceToggle.getAttribute('aria-pressed') === 'true' ||
        importanceToggle.classList.contains('active') ||
        importanceToggle.querySelector('[data-active="true"]')
      ).toBeTruthy();
    });

    it('shows update button text when editing', () => {
      render(
        <NoteEditor
          clientId={mockClientId}
          note={mockNote}
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByRole('button', { name: /update|save/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('submit button enabled when editing existing note', () => {
      render(
        <NoteEditor
          clientId={mockClientId}
          note={mockNote}
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByRole('button', { name: /update|save/i });
      expect(submitButton).toBeEnabled();
    });
  });

  // ===========================================================================
  // SUBMISSION TESTS
  // ===========================================================================

  describe('Submission', () => {
    it('calls onSubmit with form data on submit', async () => {
      const user = userEvent.setup();
      render(<NoteEditor clientId={mockClientId} onSubmit={mockOnSubmit} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'New note content');

      const submitButton = screen.getByRole('button', { name: /save|add|submit|create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          content: 'New note content',
          is_important: false,
        });
      });
    });

    it('trims whitespace from content before submit', async () => {
      const user = userEvent.setup();
      render(<NoteEditor clientId={mockClientId} onSubmit={mockOnSubmit} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '  Note with spaces  ');

      const submitButton = screen.getByRole('button', { name: /save|add|submit|create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          content: 'Note with spaces',
          is_important: false,
        });
      });
    });

    it('clears form after successful submit in create mode', async () => {
      const user = userEvent.setup();
      render(<NoteEditor clientId={mockClientId} onSubmit={mockOnSubmit} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'New note content');

      const submitButton = screen.getByRole('button', { name: /save|add|submit|create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      // Wait for form to clear
      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <NoteEditor
          clientId={mockClientId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // LOADING STATE TESTS
  // ===========================================================================

  describe('Loading State', () => {
    it('disables form during submission', async () => {
      mockOnSubmit.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 500))
      );

      const user = userEvent.setup();
      render(<NoteEditor clientId={mockClientId} onSubmit={mockOnSubmit} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Note content');

      const submitButton = screen.getByRole('button', { name: /save|add|submit|create/i });
      await user.click(submitButton);

      // Submit button should be disabled during submission
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('shows loading indicator during submission', async () => {
      mockOnSubmit.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 500))
      );

      const user = userEvent.setup();
      render(<NoteEditor clientId={mockClientId} onSubmit={mockOnSubmit} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Note content');

      const submitButton = screen.getByRole('button', { name: /save|add|submit|create/i });
      await user.click(submitButton);

      // Should show loading indicator
      await waitFor(() => {
        expect(
          screen.queryByRole('status') ||
          screen.queryByText(/saving|loading/i) ||
          document.querySelector('[data-loading="true"]')
        ).toBeInTheDocument();
      });
    });

    it('shows loading state when isSubmitting prop is true', () => {
      render(
        <NoteEditor
          clientId={mockClientId}
          onSubmit={mockOnSubmit}
          isSubmitting={true}
        />
      );

      const submitButton = screen.getByRole('button', { name: /save|add|submit|create|saving/i });
      expect(submitButton).toBeDisabled();
    });

    it('disables textarea when isSubmitting is true', () => {
      render(
        <NoteEditor
          clientId={mockClientId}
          onSubmit={mockOnSubmit}
          isSubmitting={true}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });
  });

  // ===========================================================================
  // ACCESSIBILITY TESTS
  // ===========================================================================

  describe('Accessibility', () => {
    it('has accessible textarea label', () => {
      render(<NoteEditor clientId={mockClientId} onSubmit={mockOnSubmit} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAccessibleName();
    });

    it('has accessible importance toggle button', () => {
      render(<NoteEditor clientId={mockClientId} onSubmit={mockOnSubmit} />);

      const importanceToggle = screen.getByRole('button', { name: /important|star/i }) ||
        screen.getByLabelText(/important|mark.*important/i);
      expect(importanceToggle).toHaveAccessibleName();
    });

    it('uses aria-pressed for importance toggle', () => {
      render(<NoteEditor clientId={mockClientId} onSubmit={mockOnSubmit} />);

      const importanceToggle = screen.getByRole('button', { name: /important|star/i });
      expect(importanceToggle).toHaveAttribute('aria-pressed');
    });
  });

  // ===========================================================================
  // STYLING TESTS
  // ===========================================================================

  describe('Styling', () => {
    it('applies custom className', () => {
      render(
        <NoteEditor
          clientId={mockClientId}
          onSubmit={mockOnSubmit}
          className="custom-class"
        />
      );

      const container = document.querySelector('.custom-class');
      expect(container).toBeInTheDocument();
    });
  });
});

// =============================================================================
// NOTE LIST COMPONENT TESTS
// =============================================================================

describe('NoteList', () => {
  const mockOnEdit = vi.fn<(note: ClientNote) => void>();
  const mockOnDelete = vi.fn<(note: ClientNote) => void>();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // RENDERING TESTS
  // ===========================================================================

  describe('Rendering', () => {
    it('renders list of notes', () => {
      render(<NoteList notes={mockNotes} />);

      expect(screen.getByText('Test note content')).toBeInTheDocument();
      expect(screen.getByText('Important note content')).toBeInTheDocument();
    });

    it('shows empty state when no notes', () => {
      render(<NoteList notes={[]} />);

      expect(screen.getByText(/no notes|empty/i)).toBeInTheDocument();
    });

    it('displays note creation date', () => {
      render(<NoteList notes={mockNotes} />);

      // Should show formatted dates
      const dateElements = screen.getAllByText(/jan.*\d+.*2024/i);
      expect(dateElements.length).toBeGreaterThan(0);
    });

    it('shows importance indicator for important notes', () => {
      render(<NoteList notes={mockNotes} />);

      // The important note should have some visual indicator
      const importantIndicators = document.querySelectorAll('[data-important="true"]') ||
        screen.queryAllByLabelText(/important/i);
      expect(importantIndicators.length).toBeGreaterThan(0);
    });

    it('displays notes in chronological order (newest first)', () => {
      render(<NoteList notes={mockNotes} />);

      const noteItems = screen.getAllByRole('article') ||
        screen.getAllByRole('listitem') ||
        document.querySelectorAll('[data-testid="note-item"]');

      // First note should be the newer one (Jan 15)
      expect(noteItems[0].textContent).toContain('Test note content');
    });
  });

  // ===========================================================================
  // ACTION TESTS
  // ===========================================================================

  describe('Actions', () => {
    it('shows edit button when onEdit is provided', () => {
      render(<NoteList notes={mockNotes} onEdit={mockOnEdit} />);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      expect(editButtons.length).toBe(2);
    });

    it('does not show edit button when onEdit is not provided', () => {
      render(<NoteList notes={mockNotes} />);

      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    });

    it('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<NoteList notes={mockNotes} onEdit={mockOnEdit} />);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      expect(mockOnEdit).toHaveBeenCalledWith(mockNotes[0]);
    });

    it('shows delete button when onDelete is provided', () => {
      render(<NoteList notes={mockNotes} onDelete={mockOnDelete} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete|remove/i });
      expect(deleteButtons.length).toBe(2);
    });

    it('does not show delete button when onDelete is not provided', () => {
      render(<NoteList notes={mockNotes} />);

      expect(screen.queryByRole('button', { name: /delete|remove/i })).not.toBeInTheDocument();
    });

    it('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<NoteList notes={mockNotes} onDelete={mockOnDelete} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete|remove/i });
      await user.click(deleteButtons[0]);

      expect(mockOnDelete).toHaveBeenCalledWith(mockNotes[0]);
    });
  });

  // ===========================================================================
  // LOADING STATE TESTS
  // ===========================================================================

  describe('Loading States', () => {
    it('shows loading state for note being deleted', () => {
      render(
        <NoteList
          notes={mockNotes}
          onDelete={mockOnDelete}
          isDeleting="note_123"
        />
      );

      // The delete button for note_123 should be disabled or show loading
      const deleteButtons = screen.getAllByRole('button', { name: /delete|remove|deleting/i });
      expect(deleteButtons[0]).toBeDisabled();
    });

    it('does not disable other notes during delete', () => {
      render(
        <NoteList
          notes={mockNotes}
          onDelete={mockOnDelete}
          isDeleting="note_123"
        />
      );

      // The second note's delete button should still be enabled
      const deleteButtons = screen.getAllByRole('button', { name: /delete|remove/i });
      // The second button (index 1) should be enabled
      expect(deleteButtons[1]).toBeEnabled();
    });
  });

  // ===========================================================================
  // ACCESSIBILITY TESTS
  // ===========================================================================

  describe('Accessibility', () => {
    it('uses semantic list structure', () => {
      render(<NoteList notes={mockNotes} />);

      expect(
        document.querySelector('ul') ||
        document.querySelector('[role="list"]')
      ).toBeInTheDocument();
    });

    it('has accessible button labels', () => {
      render(
        <NoteList
          notes={mockNotes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      const deleteButtons = screen.getAllByRole('button', { name: /delete|remove/i });

      expect(editButtons[0]).toHaveAccessibleName();
      expect(deleteButtons[0]).toHaveAccessibleName();
    });
  });
});
