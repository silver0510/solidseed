/**
 * OverviewTab Component
 *
 * Displays client overview information including contact details and counts.
 *
 * @module features/clients/components/ClientProfile/OverviewTab
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';
import type { ClientWithCounts } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for the OverviewTab component
 */
export interface OverviewTabProps {
  /** The client data */
  client: ClientWithCounts;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// ICONS
// =============================================================================

const MailIcon = ({ className }: { className?: string }) => (
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
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const PhoneIcon = ({ className }: { className?: string }) => (
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
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const MapPinIcon = ({ className }: { className?: string }) => (
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
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const CakeIcon = ({ className }: { className?: string }) => (
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
    <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" />
    <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" />
    <path d="M2 21h20" />
    <path d="M7 8v2" />
    <path d="M12 8v2" />
    <path d="M17 8v2" />
    <path d="M7 4h.01" />
    <path d="M12 4h.01" />
    <path d="M17 4h.01" />
  </svg>
);

const FileTextIcon = ({ className }: { className?: string }) => (
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
    width="24"
    height="24"
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
    width="24"
    height="24"
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

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Format birthday date for display
 */
function formatBirthday(birthday: string): string {
  const date = new Date(birthday);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Client overview tab with contact info and stats
 *
 * @example
 * ```tsx
 * <OverviewTab client={client} />
 * ```
 */
export const OverviewTab: React.FC<OverviewTabProps> = ({
  client,
  className,
}) => {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Contact Information */}
      <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <h3 className="text-sm font-medium text-card-foreground mb-4">
          Contact Information
        </h3>

        <div className="space-y-4">
          {/* Email */}
          <div className="flex items-start gap-3">
            <MailIcon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-card-foreground">{client.email}</p>
            </div>
          </div>

          {/* Phone */}
          {client.phone && (
            <div className="flex items-start gap-3">
              <PhoneIcon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="text-sm font-medium text-card-foreground">{client.phone}</p>
              </div>
            </div>
          )}

          {/* Address */}
          {client.address && (
            <div className="flex items-start gap-3">
              <MapPinIcon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="text-sm font-medium text-card-foreground">{client.address}</p>
              </div>
            </div>
          )}

          {/* Birthday */}
          {client.birthday && (
            <div className="flex items-start gap-3">
              <CakeIcon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Birthday</p>
                <p className="text-sm font-medium text-card-foreground">
                  {formatBirthday(client.birthday)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {/* Documents Count */}
        <div className="rounded-lg border border-border bg-card p-3 sm:p-4 text-center">
          <FileTextIcon className="h-6 w-6 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-card-foreground">
            {client.documents_count}
          </p>
          <p className="text-xs text-muted-foreground">Documents</p>
        </div>

        {/* Notes Count */}
        <div className="rounded-lg border border-border bg-card p-3 sm:p-4 text-center">
          <StickyNoteIcon className="h-6 w-6 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-card-foreground">
            {client.notes_count}
          </p>
          <p className="text-xs text-muted-foreground">Notes</p>
        </div>

        {/* Tasks Count */}
        <div className="rounded-lg border border-border bg-card p-3 sm:p-4 text-center">
          <CheckSquareIcon className="h-6 w-6 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-card-foreground">
            {client.tasks_count}
          </p>
          <p className="text-xs text-muted-foreground">Tasks</p>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
