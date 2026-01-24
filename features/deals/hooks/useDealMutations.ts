/**
 * useDealMutations Hook
 *
 * Provides mutations for updating deals, changing stages, managing milestones,
 * uploading documents, and logging activities with optimistic updates.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dealQueryKeys } from './useDealDetail';
import type {
  UpdateDealInput,
  UpdateDealStageInput,
  CreateMilestoneInput,
  UpdateMilestoneInput,
  UploadDocumentInput,
  LogActivityInput,
  Deal,
  DealMilestone,
  DealDocument,
  DealActivity,
} from '../types';

export function useDealMutations(dealId: string) {
  const queryClient = useQueryClient();

  // Update deal fields
  const updateDeal = useMutation({
    mutationFn: async (input: UpdateDealInput) => {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to update deal' }));
        throw new Error(error.message || 'Failed to update deal');
      }

      return response.json();
    },
    onMutate: async (input) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: dealQueryKeys.detail(dealId) });

      // Snapshot previous value
      const previousDeal = queryClient.getQueryData(dealQueryKeys.detail(dealId));

      // Optimistically update
      queryClient.setQueryData(dealQueryKeys.detail(dealId), (old: any) => ({
        ...old,
        ...input,
        updated_at: new Date().toISOString(),
      }));

      return { previousDeal };
    },
    onError: (_err, _input, context) => {
      // Rollback on error
      if (context?.previousDeal) {
        queryClient.setQueryData(dealQueryKeys.detail(dealId), context.previousDeal);
      }
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: dealQueryKeys.detail(dealId) });
    },
  });

  // Change deal stage
  const changeStage = useMutation({
    mutationFn: async (input: UpdateDealStageInput) => {
      const response = await fetch(`/api/deals/${dealId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to change stage' }));
        throw new Error(error.message || 'Failed to change stage');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealQueryKeys.detail(dealId) });
      queryClient.invalidateQueries({ queryKey: dealQueryKeys.activities(dealId) });
    },
  });

  // Toggle milestone completion
  const toggleMilestone = useMutation({
    mutationFn: async ({ milestoneId, completed }: { milestoneId: string; completed: boolean }) => {
      const response = await fetch(`/api/deals/${dealId}/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: completed ? 'completed' : 'pending',
          completed_date: completed ? new Date().toISOString() : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to update milestone' }));
        throw new Error(error.message || 'Failed to update milestone');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealQueryKeys.detail(dealId) });
      queryClient.invalidateQueries({ queryKey: dealQueryKeys.activities(dealId) });
    },
  });

  // Add new milestone
  const addMilestone = useMutation({
    mutationFn: async (input: CreateMilestoneInput) => {
      const response = await fetch(`/api/deals/${dealId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to add milestone' }));
        throw new Error(error.message || 'Failed to add milestone');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealQueryKeys.detail(dealId) });
    },
  });

  // Upload document
  const uploadDocument = useMutation({
    mutationFn: async ({ file, document_type }: UploadDocumentInput) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', document_type);

      const response = await fetch(`/api/deals/${dealId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to upload document' }));
        throw new Error(error.message || 'Failed to upload document');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealQueryKeys.detail(dealId) });
      queryClient.invalidateQueries({ queryKey: dealQueryKeys.activities(dealId) });
    },
  });

  // Delete document
  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/deals/${dealId}/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to delete document' }));
        throw new Error(error.message || 'Failed to delete document');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealQueryKeys.detail(dealId) });
    },
  });

  // Log activity
  const logActivity = useMutation({
    mutationFn: async (input: LogActivityInput) => {
      const response = await fetch(`/api/deals/${dealId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to log activity' }));
        throw new Error(error.message || 'Failed to log activity');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealQueryKeys.activities(dealId) });
    },
  });

  return {
    updateDeal,
    changeStage,
    toggleMilestone,
    addMilestone,
    uploadDocument,
    deleteDocument,
    logActivity,
  };
}
