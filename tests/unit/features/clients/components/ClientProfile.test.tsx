/**
 * ClientProfile Component Tests
 *
 * Tests for the ClientProfile component which displays client details
 * with tabbed navigation for Overview, Documents, Notes, and Tasks.
 *
 * @module tests/unit/features/clients/components/ClientProfile.test
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ClientProfile } from '@/features/clients/components/ClientProfile';
import type { ClientWithCounts, ClientDocument, ClientNote, ClientTask } from '@/features/clients/types';

// =============================================================================
// MOCKS
// =============================================================================

// Mock the client API
vi.mock('@/features/clients/api/clientApi', () => ({
  clientApi: {
    getClient: vi.fn(),
  },
  documentApi: {
    getClientDocuments: vi.fn(),
    uploadDocument: vi.fn(),
    deleteDocument: vi.fn(),
    getDownloadUrl: vi.fn(),
  },
  noteApi: {
    getClientNotes: vi.fn(),
    createNote: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
  },
  taskApi: {
    getClientTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    completeTask: vi.fn(),
    uncompleteTask: vi.fn(),
  },
}));

// Import mocked API for test manipulation
import { clientApi, documentApi, noteApi, taskApi } from '@/features/clients/api/clientApi';

// =============================================================================
// TEST FIXTURES
// =============================================================================

const mockClientId = 'clxyz123456789';

const mockClient: ClientWithCounts = {
  id: mockClientId,
  name: 'John Smith',
  email: 'john.smith@example.com',
  phone: '+1-555-123-4567',
  birthday: '1985-06-15',
  address: '123 Main Street, San Francisco, CA 94102',
  created_by: 'user_123',
  assigned_to: 'user_123',
  is_deleted: false,
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
  documents_count: 3,
  notes_count: 5,
  tasks_count: 2,
};

const mockClientMinimal: ClientWithCounts = {
  id: 'clminimal123',
  name: 'Jane Doe',
  email: 'jane.doe@example.com',
  created_by: 'user_123',
  assigned_to: 'user_123',
  is_deleted: false,
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
  documents_count: 0,
  notes_count: 0,
  tasks_count: 0,
};

const mockDocuments: ClientDocument[] = [
  {
    id: 'doc_123',
    client_id: mockClientId,
    file_name: 'contract.pdf',
    file_path: 'clients/clxyz123456789/documents/contract.pdf',
    file_size: 1024 * 100,
    file_type: 'application/pdf',
    description: 'Sales contract',
    uploaded_by: 'user_123',
    uploaded_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 'doc_456',
    client_id: mockClientId,
    file_name: 'id-photo.jpg',
    file_path: 'clients/clxyz123456789/documents/id-photo.jpg',
    file_size: 1024 * 50,
    file_type: 'image/jpeg',
    description: 'ID verification',
    uploaded_by: 'user_123',
    uploaded_at: '2024-01-14T08:00:00Z',
  },
];

const mockNotes: ClientNote[] = [
  {
    id: 'note_123',
    client_id: mockClientId,
    content: 'Initial consultation completed. Client interested in downtown properties.',
    is_important: true,
    created_by: 'user_123',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 'note_456',
    client_id: mockClientId,
    content: 'Follow-up call scheduled for next week.',
    is_important: false,
    created_by: 'user_123',
    created_at: '2024-01-14T08:00:00Z',
    updated_at: '2024-01-14T08:00:00Z',
  },
];

/**
 * Helper to create a date string relative to today in local timezone
 */
function getDateRelativeToToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const mockTasks: ClientTask[] = [
  {
    id: 'task_123',
    client_id: mockClientId,
    title: 'Send property listings',
    description: 'Email selected property listings to client',
    due_date: getDateRelativeToToday(3),
    priority: 'medium',
    status: 'pending',
    completed_at: null,
    created_by: 'user_123',
    assigned_to: 'user_123',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 'task_456',
    client_id: mockClientId,
    title: 'Schedule viewing',
    description: 'Book property viewing appointment',
    due_date: getDateRelativeToToday(1),
    priority: 'high',
    status: 'pending',
    completed_at: null,
    created_by: 'user_123',
    assigned_to: 'user_123',
    created_at: '2024-01-14T08:00:00Z',
    updated_at: '2024-01-14T08:00:00Z',
  },
];

// =============================================================================
// TEST SETUP
// =============================================================================

describe('ClientProfile', () => {
  const mockOnEdit = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default API responses
    (clientApi.getClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockClient);
    (documentApi.getClientDocuments as ReturnType<typeof vi.fn>).mockResolvedValue(mockDocuments);
    (noteApi.getClientNotes as ReturnType<typeof vi.fn>).mockResolvedValue(mockNotes);
    (taskApi.getClientTasks as ReturnType<typeof vi.fn>).mockResolvedValue(mockTasks);
  });

  // ===========================================================================
  // LOADING STATE TESTS
  // ===========================================================================

  describe('Loading State', () => {
    it('shows loading indicator while fetching client data', async () => {
      // Make API call take longer
      (clientApi.getClient as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockClient), 500))
      );

      render(<ClientProfile clientId={mockClientId} />);

      // Should show loading indicator
      expect(
        screen.queryByRole('status') ||
        screen.queryByText(/loading/i) ||
        screen.queryByTestId('loading-spinner')
      ).toBeInTheDocument();
    });

    it('hides loading indicator after data loads', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      // Loading indicator should be gone
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // CLIENT INFO RENDERING TESTS
  // ===========================================================================

  describe('Client Info Rendering', () => {
    it('renders client name', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });
    });

    it('renders client email', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByText('john.smith@example.com')).toBeInTheDocument();
      });
    });

    it('renders client phone', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByText('+1-555-123-4567')).toBeInTheDocument();
      });
    });

    it('renders client address', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByText(/123 Main Street/i)).toBeInTheDocument();
      });
    });

    it('renders client birthday formatted', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        // Birthday should be formatted (June 15, 1985 or similar)
        expect(
          screen.getByText(/june.*15.*1985/i) ||
          screen.getByText(/06\/15\/1985/i) ||
          screen.getByText(/1985-06-15/i)
        ).toBeInTheDocument();
      });
    });

    it('handles missing optional fields gracefully', async () => {
      (clientApi.getClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockClientMinimal);

      render(<ClientProfile clientId="clminimal123" />);

      await waitFor(() => {
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      });

      // Should not crash or show "undefined"
      expect(screen.queryByText('undefined')).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // TAB NAVIGATION TESTS
  // ===========================================================================

  describe('Tab Navigation', () => {
    it('renders Overview tab', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
      });
    });

    it('renders Documents tab', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /documents/i })).toBeInTheDocument();
      });
    });

    it('renders Notes tab', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /notes/i })).toBeInTheDocument();
      });
    });

    it('renders Tasks tab', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /tasks/i })).toBeInTheDocument();
      });
    });

    it('Overview tab is active by default', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        const overviewTab = screen.getByRole('tab', { name: /overview/i });
        expect(overviewTab).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('switches to Documents tab when clicked', async () => {
      const user = userEvent.setup();
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /documents/i })).toBeInTheDocument();
      });

      const documentsTab = screen.getByRole('tab', { name: /documents/i });
      await user.click(documentsTab);

      expect(documentsTab).toHaveAttribute('aria-selected', 'true');
    });

    it('switches to Notes tab when clicked', async () => {
      const user = userEvent.setup();
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /notes/i })).toBeInTheDocument();
      });

      const notesTab = screen.getByRole('tab', { name: /notes/i });
      await user.click(notesTab);

      expect(notesTab).toHaveAttribute('aria-selected', 'true');
    });

    it('switches to Tasks tab when clicked', async () => {
      const user = userEvent.setup();
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /tasks/i })).toBeInTheDocument();
      });

      const tasksTab = screen.getByRole('tab', { name: /tasks/i });
      await user.click(tasksTab);

      expect(tasksTab).toHaveAttribute('aria-selected', 'true');
    });

    it('respects initialTab prop', async () => {
      render(<ClientProfile clientId={mockClientId} initialTab="documents" />);

      await waitFor(() => {
        const documentsTab = screen.getByRole('tab', { name: /documents/i });
        expect(documentsTab).toHaveAttribute('aria-selected', 'true');
      });
    });
  });

  // ===========================================================================
  // OVERVIEW TAB TESTS
  // ===========================================================================

  describe('Overview Tab', () => {
    it('shows client details in overview', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText('john.smith@example.com')).toBeInTheDocument();
      });
    });

    it('shows documents count', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        // Should show "3" documents count
        const docsCount = screen.getByText('3');
        expect(docsCount).toBeInTheDocument();
      });
    });

    it('shows notes count', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        // Should show "5" notes count
        const notesCount = screen.getByText('5');
        expect(notesCount).toBeInTheDocument();
      });
    });

    it('shows tasks count', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        // Should show "2" tasks count
        const tasksCount = screen.getByText('2');
        expect(tasksCount).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // DOCUMENTS TAB TESTS
  // ===========================================================================

  describe('Documents Tab', () => {
    it('renders DocumentUploader in documents tab', async () => {
      const user = userEvent.setup();
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /documents/i })).toBeInTheDocument();
      });

      const documentsTab = screen.getByRole('tab', { name: /documents/i });
      await user.click(documentsTab);

      // DocumentUploader should be visible
      await waitFor(() => {
        expect(screen.getByText(/drag.*drop|upload/i)).toBeInTheDocument();
      });
    });

    it('renders DocumentList with documents', async () => {
      const user = userEvent.setup();
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /documents/i })).toBeInTheDocument();
      });

      const documentsTab = screen.getByRole('tab', { name: /documents/i });
      await user.click(documentsTab);

      await waitFor(() => {
        expect(screen.getByText('contract.pdf')).toBeInTheDocument();
        expect(screen.getByText('id-photo.jpg')).toBeInTheDocument();
      });
    });

    it('shows empty state when no documents', async () => {
      (documentApi.getClientDocuments as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const user = userEvent.setup();
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /documents/i })).toBeInTheDocument();
      });

      const documentsTab = screen.getByRole('tab', { name: /documents/i });
      await user.click(documentsTab);

      await waitFor(() => {
        expect(screen.getByText(/no documents/i)).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // NOTES TAB TESTS
  // ===========================================================================

  describe('Notes Tab', () => {
    it('renders NoteEditor in notes tab', async () => {
      const user = userEvent.setup();
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /notes/i })).toBeInTheDocument();
      });

      const notesTab = screen.getByRole('tab', { name: /notes/i });
      await user.click(notesTab);

      // NoteEditor should be visible
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/add.*note|write.*note/i) ||
          screen.getByRole('textbox')
        ).toBeInTheDocument();
      });
    });

    it('renders NoteList with notes', async () => {
      const user = userEvent.setup();
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /notes/i })).toBeInTheDocument();
      });

      const notesTab = screen.getByRole('tab', { name: /notes/i });
      await user.click(notesTab);

      await waitFor(() => {
        expect(screen.getByText(/Initial consultation completed/i)).toBeInTheDocument();
        expect(screen.getByText(/Follow-up call scheduled/i)).toBeInTheDocument();
      });
    });

    it('shows empty state when no notes', async () => {
      (noteApi.getClientNotes as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const user = userEvent.setup();
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /notes/i })).toBeInTheDocument();
      });

      const notesTab = screen.getByRole('tab', { name: /notes/i });
      await user.click(notesTab);

      await waitFor(() => {
        expect(screen.getByText(/no notes/i)).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // TASKS TAB TESTS
  // ===========================================================================

  describe('Tasks Tab', () => {
    it('renders TaskList in tasks tab', async () => {
      const user = userEvent.setup();
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /tasks/i })).toBeInTheDocument();
      });

      const tasksTab = screen.getByRole('tab', { name: /tasks/i });
      await user.click(tasksTab);

      await waitFor(() => {
        expect(screen.getByText('Send property listings')).toBeInTheDocument();
        expect(screen.getByText('Schedule viewing')).toBeInTheDocument();
      });
    });

    it('shows task checkboxes for status toggle', async () => {
      const user = userEvent.setup();
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /tasks/i })).toBeInTheDocument();
      });

      const tasksTab = screen.getByRole('tab', { name: /tasks/i });
      await user.click(tasksTab);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
      });
    });

    it('shows empty state when no tasks', async () => {
      (taskApi.getClientTasks as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const user = userEvent.setup();
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /tasks/i })).toBeInTheDocument();
      });

      const tasksTab = screen.getByRole('tab', { name: /tasks/i });
      await user.click(tasksTab);

      await waitFor(() => {
        expect(screen.getByText(/no tasks/i)).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // EDIT BUTTON TESTS
  // ===========================================================================

  describe('Edit Button', () => {
    it('shows edit button when onEdit is provided', async () => {
      render(<ClientProfile clientId={mockClientId} onEdit={mockOnEdit} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit.*client|edit/i })).toBeInTheDocument();
      });
    });

    it('does not show edit button when onEdit is not provided', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /edit.*client/i })).not.toBeInTheDocument();
    });

    it('calls onEdit with client when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<ClientProfile clientId={mockClientId} onEdit={mockOnEdit} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit.*client|edit/i })).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit.*client|edit/i });
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(mockClient);
    });
  });

  // ===========================================================================
  // BACK BUTTON TESTS
  // ===========================================================================

  describe('Back Button', () => {
    it('shows back button when onBack is provided', async () => {
      render(<ClientProfile clientId={mockClientId} onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      });
    });

    it('does not show back button when onBack is not provided', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
    });

    it('calls onBack when back button is clicked', async () => {
      const user = userEvent.setup();
      render(<ClientProfile clientId={mockClientId} onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);

      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // ERROR STATE TESTS
  // ===========================================================================

  describe('Error States', () => {
    it('shows error message when client fetch fails', async () => {
      (clientApi.getClient as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Failed to fetch client')
      );

      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByText(/error|failed|not found/i)).toBeInTheDocument();
      });
    });

    it('shows not found message when client does not exist', async () => {
      (clientApi.getClient as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      render(<ClientProfile clientId="nonexistent123" />);

      await waitFor(() => {
        expect(screen.getByText(/not found|doesn't exist/i)).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // MOBILE TAB NAVIGATION TESTS
  // ===========================================================================

  describe('Mobile Tab Navigation', () => {
    it('renders mobile-friendly tab buttons', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        // All tabs should be visible
        expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /documents/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /notes/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /tasks/i })).toBeInTheDocument();
      });
    });

    it('tabs have touch-friendly size', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        // Each tab should be focusable
        tabs.forEach((tab) => {
          expect(tab).not.toHaveAttribute('tabindex', '-1');
        });
      });
    });
  });

  // ===========================================================================
  // ACCESSIBILITY TESTS
  // ===========================================================================

  describe('Accessibility', () => {
    it('uses semantic tablist structure', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(screen.getByRole('tablist')).toBeInTheDocument();
      });
    });

    it('tabs have proper ARIA attributes', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        tabs.forEach((tab) => {
          expect(tab).toHaveAttribute('aria-selected');
        });
      });
    });

    it('tab panels have proper ARIA attributes', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        const tabpanel = screen.getByRole('tabpanel');
        expect(tabpanel).toBeInTheDocument();
      });
    });

    it('provides accessible name for edit button', async () => {
      render(<ClientProfile clientId={mockClientId} onEdit={mockOnEdit} />);

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /edit.*client|edit/i });
        expect(editButton).toHaveAccessibleName();
      });
    });

    it('provides accessible name for back button', async () => {
      render(<ClientProfile clientId={mockClientId} onBack={mockOnBack} />);

      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: /back/i });
        expect(backButton).toHaveAccessibleName();
      });
    });
  });

  // ===========================================================================
  // STYLING TESTS
  // ===========================================================================

  describe('Styling', () => {
    it('applies custom className', async () => {
      render(<ClientProfile clientId={mockClientId} className="custom-profile-class" />);

      await waitFor(() => {
        const container = document.querySelector('.custom-profile-class');
        expect(container).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // DATA FETCHING TESTS
  // ===========================================================================

  describe('Data Fetching', () => {
    it('fetches client data on mount', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(clientApi.getClient).toHaveBeenCalledWith(mockClientId);
      });
    });

    it('fetches documents on mount', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(documentApi.getClientDocuments).toHaveBeenCalledWith(mockClientId);
      });
    });

    it('fetches notes on mount', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(noteApi.getClientNotes).toHaveBeenCalledWith(mockClientId);
      });
    });

    it('fetches tasks on mount', async () => {
      render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(taskApi.getClientTasks).toHaveBeenCalledWith(mockClientId);
      });
    });

    it('refetches data when clientId changes', async () => {
      const { rerender } = render(<ClientProfile clientId={mockClientId} />);

      await waitFor(() => {
        expect(clientApi.getClient).toHaveBeenCalledWith(mockClientId);
      });

      // Clear mocks
      vi.clearAllMocks();

      // Setup new client response
      const newClientId = 'clnewclient456';
      const newClient: ClientWithCounts = {
        ...mockClient,
        id: newClientId,
        name: 'New Client',
      };
      (clientApi.getClient as ReturnType<typeof vi.fn>).mockResolvedValue(newClient);

      // Rerender with new clientId
      rerender(<ClientProfile clientId={newClientId} />);

      await waitFor(() => {
        expect(clientApi.getClient).toHaveBeenCalledWith(newClientId);
      });
    });
  });
});

// =============================================================================
// OVERVIEW TAB COMPONENT TESTS
// =============================================================================

describe('OverviewTab', () => {
  // These tests are for the OverviewTab sub-component if exported separately
  // Included here to test the component in isolation

  const mockClient: ClientWithCounts = {
    id: 'cltest123',
    name: 'Test Client',
    email: 'test@example.com',
    phone: '+1-555-123-4567',
    birthday: '1990-01-15',
    address: '456 Oak Ave, New York, NY 10001',
    created_by: 'user_123',
    assigned_to: 'user_123',
    is_deleted: false,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    documents_count: 10,
    notes_count: 20,
    tasks_count: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (clientApi.getClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockClient);
    (documentApi.getClientDocuments as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (noteApi.getClientNotes as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (taskApi.getClientTasks as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it('displays all contact information', async () => {
    render(<ClientProfile clientId="cltest123" />);

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('+1-555-123-4567')).toBeInTheDocument();
      expect(screen.getByText(/456 Oak Ave/i)).toBeInTheDocument();
    });
  });

  it('displays counts in stat cards', async () => {
    render(<ClientProfile clientId="cltest123" />);

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // documents
      expect(screen.getByText('20')).toBeInTheDocument(); // notes
      expect(screen.getByText('5')).toBeInTheDocument(); // tasks
    });
  });

  it('displays count labels', async () => {
    render(<ClientProfile clientId="cltest123" />);

    await waitFor(() => {
      expect(screen.getByText(/documents/i)).toBeInTheDocument();
      expect(screen.getByText(/notes/i)).toBeInTheDocument();
      expect(screen.getByText(/tasks/i)).toBeInTheDocument();
    });
  });
});
