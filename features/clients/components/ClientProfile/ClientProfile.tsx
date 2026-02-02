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
import { ArrowLeft, User, FileText, StickyNote, CheckSquare, Briefcase, Loader2 } from 'lucide-react';
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
// ICONS - Using lucide-react
// =============================================================================

const ArrowLeftIcon = ArrowLeft;
const UserIcon = User;
const FileTextIcon = FileText;
const StickyNoteIcon = StickyNote;
const CheckSquareIcon = CheckSquare;
const BriefcaseIcon = Briefcase;
const LoadingSpinner = Loader2;

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
      <div className={cn('flex items-center justify-center min-h-loading', className)}>
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
            clientName={client.name}
            deals={deals}
            onDealChanged={refetchDeals}
          />
        )}
      </div>
    </div>
  );
};

export default ClientProfile;
