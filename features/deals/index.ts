/**
 * Deal Management Feature
 *
 * Centralized deal management for SolidSeed CRM.
 * Provides components, hooks, and utilities for managing deals,
 * milestones, documents, and activities.
 *
 * @module features/deals
 *
 * @example
 * ```typescript
 * // Import hooks
 * import { useDealDetail, useDealMutations, useDealTypes } from '@/features/deals';
 *
 * // Import types
 * import type { Deal, DealType, DealMilestone } from '@/features/deals';
 *
 * // Import components
 * import { DealDetailPage, DealForm } from '@/features/deals';
 * ```
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  // Core types
  Deal,
  DealType,
  DealMilestone,
  DealDocument,
  DealActivity,
  Client,
  // Enums
  DealStage,
  DealActivityType,
  // Configs
  DealTypeEnabledFields,
  DealFieldConfig,
  // API types
  CreateDealInput,
  UpdateDealInput,
  UpdateDealStageInput,
  CreateMilestoneInput,
  UpdateMilestoneInput,
  UploadDocumentInput,
  LogActivityInput,
  // UI types
  DealWithRelations,
  DealFormData,
  DealStageInfo,
} from './types';

export { DEAL_STAGES, ACTIVITY_TYPE_ICONS, ACTIVITY_TYPE_LABELS } from './types';

// =============================================================================
// HOOK EXPORTS
// =============================================================================

export { useDealDetail, dealQueryKeys } from './hooks/useDealDetail';
export { useDealMutations } from './hooks/useDealMutations';
export { useDealTypes } from './hooks/useDealTypes';

// =============================================================================
// COMPONENT EXPORTS
// =============================================================================

export { DealDetailPage } from './components/DealDetailPage';
export type { DealDetailPageProps } from './components/DealDetailPage';

export { DealForm } from './components/DealForm';
export type { DealFormProps } from './components/DealForm';

export { OverviewTab } from './components/tabs/OverviewTab';
export type { OverviewTabProps } from './components/tabs/OverviewTab';

export { DetailsTab } from './components/tabs/DetailsTab';
export type { DetailsTabProps } from './components/tabs/DetailsTab';

export { ChecklistTab } from './components/tabs/ChecklistTab';
export type { ChecklistTabProps } from './components/tabs/ChecklistTab';

export { DocumentsTab } from './components/tabs/DocumentsTab';
export type { DocumentsTabProps } from './components/tabs/DocumentsTab';

export { ActivityTab } from './components/tabs/ActivityTab';
export type { ActivityTabProps } from './components/tabs/ActivityTab';
