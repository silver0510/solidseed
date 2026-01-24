/**
 * Client Hooks Exports
 *
 * Custom hooks for the Client Hub feature.
 *
 * @module features/clients/hooks
 */

export {
  useClientsInfinite,
  getTotalCount,
  flattenClientPages,
  type UseClientsInfiniteOptions,
} from './useClientsInfinite';

export {
  useDocumentUpload,
  type UseDocumentUploadOptions,
  type UseDocumentUploadReturn,
} from './useDocumentUpload';

export {
  useClient,
  type UseClientOptions,
  type UseClientReturn,
} from './useClient';

export {
  useAllTasks,
  type UseAllTasksOptions,
  type UseAllTasksReturn,
} from './useAllTasks';

export {
  useClientDeals,
  type UseClientDealsOptions,
  type UseClientDealsReturn,
  type ClientDeal,
  type DealStatus,
} from './useClientDeals';
