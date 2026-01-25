/**
 * ClientProfile Component
 *
 * Main client profile view with tabbed navigation for Overview, Documents,
 * Notes, and Tasks.
 *
 * @module features/clients/components/ClientProfile/ClientProfile
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { useClient } from '../../hooks/useClient';
import { OverviewTab } from './OverviewTab';
import { DocumentsTab } from './DocumentsTab';
import { NotesTab } from './NotesTab';
import { TasksTab } from './TasksTab';
import { DealsTab } from './DealsTab';
import type { ClientProfileTab, ClientWithCounts } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for the ClientProfile component
 */
export interface ClientProfileProps {
  /** ID of the client to display */
  clientId: string;
  /** Callback when edit button is clicked */
  onEdit?: (client: ClientWithCounts) => void;
  /** Callback when back button is clicked */
  onBack?: () => void;
  /** Initial tab to display */
  initialTab?: ClientProfileTab;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// ICONS
// =============================================================================

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const FileTextIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
);

const StickyNoteIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" />
    <path d="M15 3v4a2 2 0 0 0 2 2h4" />
  </svg>
);

const CheckSquareIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const BriefcaseIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const LoadingSpinner = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn('animate-spin', className)}
    aria-hidden="true"
    role="status"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

// =============================================================================
// TAB DEFINITIONS
// =============================================================================

interface TabDefinition {
  id: ClientProfileTab;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const tabs: TabDefinition[] = [
  { id: 'overview', label: 'Overview', icon: UserIcon },
  { id: 'documents', label: 'Documents', icon: FileTextIcon },
  { id: 'notes', label: 'Notes', icon: StickyNoteIcon },
  { id: 'tasks', label: 'Tasks', icon: CheckSquareIcon },
  { id: 'deals', label: 'Deals', icon: BriefcaseIcon },
];

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Client profile with tabbed navigation
 *
 * @example
 * ```tsx
 * <ClientProfile
 *   clientId="cl123"
 *   onEdit={(client) => openEditModal(client)}
 *   onBack={() => navigate('/clients')}
 *   initialTab="overview"
 * />
 * ```
 */
export const ClientProfile: React.FC<ClientProfileProps> = ({
  clientId,
  onBack,
  initialTab = 'overview',
  className,
}) => {
  const [activeTab, setActiveTab] = useState<ClientProfileTab>(initialTab);

  const {
    client,
    documents,
    notes,
    tasks,
    deals,
    isLoading,
    error,
    refetchDocuments,
    refetchNotes,
    refetchTasks,
    refetchDeals,
  } = useClient({ clientId });

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center min-h-[400px]', className)}>
        <LoadingSpinner className="h-8 w-8 text-primary" data-testid="loading-spinner" />
      </div>
    );
  }

  // Error state
  if (error || !client) {
    return (
      <div className={cn('rounded-lg border border-border bg-card p-8', className)}>
        <div className="flex flex-col items-center justify-center py-8">
          <UserIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-sm text-foreground font-medium">
            {error || 'Client not found'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            The client you're looking for doesn't exist or has been deleted.
          </p>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Go back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Tab Navigation - Compact */}
      <div
        role="tablist"
        aria-label="Client profile tabs"
        className="flex border-b border-border mb-4 overflow-x-auto scrollbar-hide"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                // Base styles with compact sizing
                'flex items-center justify-center gap-1.5',
                'min-h-10 px-3 py-2',
                'text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                // Focus states for accessibility
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                // Active state
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
      >
        {activeTab === 'overview' && <OverviewTab client={client} />}

        {activeTab === 'documents' && (
          <DocumentsTab
            clientId={clientId}
            documents={documents}
            onDocumentUploaded={refetchDocuments}
            onDocumentDeleted={refetchDocuments}
          />
        )}

        {activeTab === 'notes' && (
          <NotesTab
            clientId={clientId}
            notes={notes}
            onNoteChanged={refetchNotes}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksTab
            clientId={clientId}
            clientName={client.name}
            tasks={tasks}
            onTaskChanged={refetchTasks}
          />
        )}

        {activeTab === 'deals' && (
          <DealsTab
            clientId={clientId}
            deals={deals}
            onDealChanged={refetchDeals}
          />
        )}
      </div>
    </div>
  );
};

export default ClientProfile;
