/**
 * Milestone Type Constants
 *
 * Defines all available milestone types for deals
 */

export type MilestoneType =
  | 'custom'
  | 'inspection'
  | 'appraisal'
  | 'financing_approval'
  | 'final_walkthrough'
  | 'closing'
  | 'title_search'
  | 'survey'
  | 'insurance';

export interface MilestoneTypeConfig {
  value: MilestoneType;
  label: string;
  icon: string;
  color: string;
  badgeVariant: 'default' | 'secondary' | 'outline';
  autoName: string;
  description?: string;
}

export const MILESTONE_TYPES: MilestoneTypeConfig[] = [
  {
    value: 'custom',
    label: 'Custom',
    icon: '📝',
    color: 'gray',
    badgeVariant: 'outline',
    autoName: '',
    description: 'Create a custom milestone',
  },
  {
    value: 'inspection',
    label: 'Inspection',
    icon: '🔍',
    color: 'blue',
    badgeVariant: 'default',
    autoName: 'Inspection',
    description: 'Property inspection milestone',
  },
  {
    value: 'appraisal',
    label: 'Appraisal',
    icon: '💰',
    color: 'green',
    badgeVariant: 'default',
    autoName: 'Appraisal',
    description: 'Property appraisal milestone',
  },
  {
    value: 'financing_approval',
    label: 'Financing Approval',
    icon: '🏦',
    color: 'purple',
    badgeVariant: 'default',
    autoName: 'Financing Approval',
    description: 'Loan/financing approval milestone',
  },
  {
    value: 'final_walkthrough',
    label: 'Final Walkthrough',
    icon: '🚶',
    color: 'orange',
    badgeVariant: 'default',
    autoName: 'Final Walkthrough',
    description: 'Final property walkthrough',
  },
  {
    value: 'closing',
    label: 'Closing',
    icon: '🏠',
    color: 'red',
    badgeVariant: 'default',
    autoName: 'Closing',
    description: 'Deal closing milestone',
  },
  {
    value: 'title_search',
    label: 'Title Search',
    icon: '📋',
    color: 'indigo',
    badgeVariant: 'secondary',
    autoName: 'Title Search',
    description: 'Property title search',
  },
  {
    value: 'survey',
    label: 'Survey',
    icon: '📐',
    color: 'teal',
    badgeVariant: 'secondary',
    autoName: 'Property Survey',
    description: 'Property survey milestone',
  },
  {
    value: 'insurance',
    label: 'Insurance',
    icon: '🛡️',
    color: 'cyan',
    badgeVariant: 'secondary',
    autoName: 'Insurance Approval',
    description: 'Insurance approval milestone',
  },
];

/**
 * Get milestone type configuration by value
 */
export function getMilestoneTypeConfig(type: string): MilestoneTypeConfig {
  const config = MILESTONE_TYPES.find((t) => t.value === type);
  return config || MILESTONE_TYPES[0]!; // Default to 'custom'
}

/**
 * Get milestone type icon
 */
export function getMilestoneTypeIcon(type: string): string {
  return getMilestoneTypeConfig(type).icon;
}

/**
 * Get milestone type label
 */
export function getMilestoneTypeLabel(type: string): string {
  return getMilestoneTypeConfig(type).label;
}

/**
 * Get milestone type color
 */
export function getMilestoneTypeColor(type: string): string {
  return getMilestoneTypeConfig(type).color;
}

/**
 * Get badge variant for milestone type
 */
export function getMilestoneTypeBadgeVariant(
  type: string
): 'default' | 'secondary' | 'outline' {
  return getMilestoneTypeConfig(type).badgeVariant;
}

/**
 * Check if milestone type already exists in a list of milestones
 */
export function hasDuplicateMilestoneType(
  type: string,
  milestones: Array<{ milestone_type: string }>
): boolean {
  if (type === 'custom') return false; // Allow multiple custom milestones
  return milestones.some((m) => m.milestone_type === type);
}
