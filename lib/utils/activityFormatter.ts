/**
 * Activity Message Formatter
 *
 * Generates human-readable activity messages for the activity feed.
 * Provides consistent formatting across all activity types.
 */

import type { ActivityType } from '@/lib/types/deals';

export interface ActivityMessageOptions {
  dealName?: string;
  clientName?: string;
  documentName?: string;
  milestoneName?: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  oldStage?: string;
  newStage?: string;
  count?: number;
  itemNames?: string[];
  notePreview?: string;
}

export interface ActivityMessage {
  title: string;
  description: string | null;
}

/**
 * Generate activity message based on activity type and context
 */
export function formatActivityMessage(
  activityType: ActivityType,
  options: ActivityMessageOptions
): ActivityMessage {
  switch (activityType) {
    case 'stage_change':
      return formatStageChangeMessage(options);

    case 'note':
      return formatNoteMessage(options);

    case 'call':
      return formatCallMessage(options);

    case 'email':
      return formatEmailMessage(options);

    case 'meeting':
      return formatMeetingMessage(options);

    case 'showing':
      return formatShowingMessage(options);

    case 'document_upload':
      return formatDocumentUploadMessage(options);

    case 'document_delete':
      return formatDocumentDeleteMessage(options);

    case 'milestone_complete':
      return formatMilestoneCompleteMessage(options);

    case 'field_update':
      return formatFieldUpdateMessage(options);

    case 'other':
    default:
      return formatOtherMessage(options);
  }
}

// =============================================================================
// MESSAGE FORMATTERS
// =============================================================================

function formatStageChangeMessage(options: ActivityMessageOptions): ActivityMessage {
  const { oldStage, newStage } = options;

  if (!oldStage || !newStage) {
    return {
      title: 'Stage Changed',
      description: 'Deal stage was updated',
    };
  }

  return {
    title: 'Stage Changed',
    description: `Moved from "${formatStageName(oldStage)}" to "${formatStageName(newStage)}"`,
  };
}

function formatNoteMessage(options: ActivityMessageOptions): ActivityMessage {
  const { notePreview } = options;

  return {
    title: 'Note Added',
    description: notePreview || 'Added a note to the deal',
  };
}

function formatCallMessage(options: ActivityMessageOptions): ActivityMessage {
  const { clientName, notePreview } = options;

  const description = notePreview || (clientName ? `Called ${clientName}` : 'Logged a phone call');

  return {
    title: 'Phone Call',
    description,
  };
}

function formatEmailMessage(options: ActivityMessageOptions): ActivityMessage {
  const { clientName, notePreview } = options;

  const description = notePreview || (clientName ? `Emailed ${clientName}` : 'Sent an email');

  return {
    title: 'Email Sent',
    description,
  };
}

function formatMeetingMessage(options: ActivityMessageOptions): ActivityMessage {
  const { clientName, notePreview } = options;

  const description =
    notePreview || (clientName ? `Met with ${clientName}` : 'Scheduled a meeting');

  return {
    title: 'Meeting',
    description,
  };
}

function formatShowingMessage(options: ActivityMessageOptions): ActivityMessage {
  const { clientName, notePreview } = options;

  const description =
    notePreview || (clientName ? `Property showing with ${clientName}` : 'Property showing completed');

  return {
    title: 'Property Showing',
    description,
  };
}

function formatDocumentUploadMessage(options: ActivityMessageOptions): ActivityMessage {
  const { documentName, count } = options;

  if (count && count > 1) {
    return {
      title: 'Documents Uploaded',
      description: `Uploaded ${count} documents`,
    };
  }

  return {
    title: 'Document Uploaded',
    description: documentName ? `Uploaded "${documentName}"` : 'Uploaded a document',
  };
}

function formatDocumentDeleteMessage(options: ActivityMessageOptions): ActivityMessage {
  const { documentName } = options;

  return {
    title: 'Document Deleted',
    description: documentName ? `Deleted "${documentName}"` : 'Deleted a document',
  };
}

function formatMilestoneCompleteMessage(options: ActivityMessageOptions): ActivityMessage {
  const { milestoneName, count } = options;

  if (count && count > 1) {
    return {
      title: 'Checklist Items Completed',
      description: `Completed ${count} checklist items`,
    };
  }

  return {
    title: 'Checklist Item Completed',
    description: milestoneName ? `Completed "${milestoneName}"` : 'Completed a checklist item',
  };
}

function formatFieldUpdateMessage(options: ActivityMessageOptions): ActivityMessage {
  const { fieldName, oldValue, newValue } = options;

  if (!fieldName) {
    return {
      title: 'Deal Updated',
      description: 'Updated deal details',
    };
  }

  const formattedFieldName = formatFieldName(fieldName);

  if (oldValue && newValue) {
    return {
      title: `${formattedFieldName} Updated`,
      description: `Changed from "${oldValue}" to "${newValue}"`,
    };
  }

  if (newValue) {
    return {
      title: `${formattedFieldName} Updated`,
      description: `Set to "${newValue}"`,
    };
  }

  return {
    title: `${formattedFieldName} Updated`,
    description: null,
  };
}

function formatOtherMessage(options: ActivityMessageOptions): ActivityMessage {
  const { dealName, itemNames, count } = options;

  // Handle checklist creation
  if (itemNames && itemNames.length > 0) {
    return {
      title: 'Checklist Created',
      description: `Added ${itemNames.length} checklist items: ${itemNames.join(', ')}`,
    };
  }

  // Handle deal creation
  if (dealName) {
    return {
      title: 'Deal Created',
      description: `Created deal "${dealName}"`,
    };
  }

  // Generic fallback
  return {
    title: 'Activity',
    description: null,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format stage code to display name
 */
function formatStageName(stageCode: string): string {
  return stageCode
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format field name to display name
 */
function formatFieldName(fieldName: string): string {
  // Handle common field name patterns
  const fieldNameMap: Record<string, string> = {
    deal_value: 'Deal Value',
    deal_name: 'Deal Name',
    commission_rate: 'Commission Rate',
    commission_split_percent: 'Commission Split',
    expected_close_date: 'Expected Close Date',
    actual_close_date: 'Actual Close Date',
    property_address: 'Property Address',
    listing_price: 'Listing Price',
    sale_price: 'Sale Price',
    loan_amount: 'Loan Amount',
    interest_rate: 'Interest Rate',
  };

  if (fieldNameMap[fieldName]) {
    return fieldNameMap[fieldName];
  }

  // Default: Convert snake_case to Title Case
  return fieldName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format currency value for display
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage value for display
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  return `${value}%`;
}

/**
 * Truncate text to max length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - 3) + '...';
}
