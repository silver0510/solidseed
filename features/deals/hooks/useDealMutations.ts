/**
 * useDealMutations Hook
 *
 * Provides mutations for updating deals, changing stages, managing checklist items,
 * uploading documents, and logging activities with optimistic updates.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dealQueryKeys } from './useDealDetail';
import { pipelineKeys } from './usePipelineDeals';
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
      // Refresh pipeline summary and dashboard metrics
      queryClient.invalidateQueries({ queryKey: pipelineKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
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
    onMutate: async (input) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: dealQueryKeys.detail(dealId) });

      // Snapshot previous value
      const previousDeal = queryClient.getQueryData(dealQueryKeys.detail(dealId));

      // Optimistically update the stage
      queryClient.setQueryData(dealQueryKeys.detail(dealId), (old: any) => {
        if (!old) return old;

        const updates: any = {
          ...old,
          current_stage: input.new_stage,
          updated_at: new Date().toISOString(),
        };

        // If moving to won stage, update status
        if (old.deal_type?.pipeline_stages) {
          const stageInfo = old.deal_type.pipeline_stages.find((s: any) => s.code === input.new_stage);
          if (stageInfo?.type === 'won' || input.new_stage === 'closed' || input.new_stage === 'funded') {
            updates.status = 'closed_won';
            updates.closed_at = new Date().toISOString();
            if (!old.actual_close_date) {
              updates.actual_close_date = new Date().toISOString().split('T')[0];
            }
          }
        }

        return updates;
      });

      return { previousDeal };
    },
    onError: (_err, _input, context) => {
      // Rollback on error
      if (context?.previousDeal) {
        queryClient.setQueryData(dealQueryKeys.detail(dealId), context.previousDeal);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealQueryKeys.detail(dealId) });
      // Stage change affects pipeline board layout and may change status to closed_won
      queryClient.invalidateQueries({ queryKey: pipelineKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['deals', 'won'] });
    },
  });

  // Toggle checklist item completion
  const toggleMilestone = useMutation({
    mutationFn: async ({ milestoneId, completed }: { milestoneId: string; completed: boolean }) => {
      const response = await fetch(`/api/deals/${dealId}/checklist/${milestoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: completed ? 'completed' : 'pending',
          completed_date: completed ? new Date().toISOString() : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to update checklist item' }));
        throw new Error(error.message || 'Failed to update checklist item');
      }

      return response.json();
    },
    onSuccess: () => {
      // Activities are part of deal detail, no need to invalidate separately
      queryClient.invalidateQueries({ queryKey: dealQueryKeys.detail(dealId) });
    },
  });

  // Add new checklist item
  const addMilestone = useMutation({
    mutationFn: async (input: CreateMilestoneInput) => {
      const response = await fetch(`/api/deals/${dealId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to add checklist item' }));
        throw new Error(error.message || 'Failed to add checklist item');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealQueryKeys.detail(dealId) });
    },
  });

  // Update checklist item (edit name/date)
  const updateMilestone = useMutation({
    mutationFn: async ({ milestoneId, ...input }: UpdateMilestoneInput & { milestoneId: string }) => {
      const response = await fetch(`/api/deals/${dealId}/checklist/${milestoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to update checklist item' }));
        throw new Error(error.message || 'Failed to update checklist item');
      }

      return response.json();
    },
    onSuccess: () => {
      // Activities are part of deal detail, no need to invalidate separately
      queryClient.invalidateQueries({ queryKey: dealQueryKeys.detail(dealId) });
    },
  });

  // Delete checklist item
  const deleteMilestone = useMutation({
    mutationFn: async (milestoneId: string) => {
      const response = await fetch(`/api/deals/${dealId}/checklist/${milestoneId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to delete checklist item' }));
        throw new Error(error.message || 'Failed to delete checklist item');
      }

      return response.json();
    },
    onSuccess: () => {
      // Activities are part of deal detail, no need to invalidate separately
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
        const error = await response.json().catch(() => ({ error: 'Failed to upload document' }));
        throw new Error(error.error || error.message || 'Failed to upload document');
      }

      return response.json();
    },
    onSuccess: () => {
      // Activities are part of deal detail, no need to invalidate separately
      queryClient.invalidateQueries({ queryKey: dealQueryKeys.detail(dealId) });
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

  // Mark deal as lost
  const markAsLost = useMutation({
    mutationFn: async (input: { lost_reason: string }) => {
      const response = await fetch(`/api/deals/${dealId}/mark-lost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to mark deal as lost' }));
        throw new Error(error.message || 'Failed to mark deal as lost');
      }

      return response.json();
    },
    onMutate: async (input) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: dealQueryKeys.detail(dealId) });

      // Snapshot previous value
      const previousDeal = queryClient.getQueryData(dealQueryKeys.detail(dealId));

      // Optimistically update the deal
      queryClient.setQueryData(dealQueryKeys.detail(dealId), (old: any) => ({
        ...old,
        status: 'closed_lost',
        closed_at: new Date().toISOString(),
        lost_reason: input.lost_reason,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealQueryKeys.detail(dealId) });
      // Lost deal drops out of active pipeline and dashboard metrics
      queryClient.invalidateQueries({ queryKey: pipelineKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
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
    updateMilestone,
    deleteMilestone,
    uploadDocument,
    deleteDocument,
    markAsLost,
    logActivity,
  };
}
