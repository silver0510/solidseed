/**
 * useDealDragDrop Hook
 *
 * Manages drag-and-drop logic for deal pipeline board.
 * Handles optimistic updates and stage change API calls.
 *
 * @module features/deals/hooks/useDealDragDrop
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DragEndEvent } from '@dnd-kit/core';
import type { PipelineResponse, ChangeDealStageInput } from '@/lib/types/deals';
import { pipelineKeys } from './usePipelineDeals';
import { toast } from 'sonner';

// =============================================================================
// API HELPERS
// =============================================================================

/**
 * Get the base URL for API requests
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '';
  }
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
}

/**
 * Handle API response and throw error if not ok
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Change deal stage via API
 */
async function changeDealStage(
  dealId: string,
  data: ChangeDealStageInput
): Promise<void> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/deals/${dealId}/stage`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  return handleResponse<void>(response);
}

// =============================================================================
// HOOK TYPES
// =============================================================================

interface UseDealDragDropOptions {
  onStageChange?: (dealId: string, newStage: string) => void;
  onError?: (error: Error) => void;
}

interface TerminalStageModal {
  isOpen: boolean;
  dealId: string | null;
  dealName: string | null;
  newStage: string | null;
  isClosedLost: boolean; // Keep for backward compatibility, always false now
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for managing drag-and-drop logic in the pipeline board
 *
 * @example
 * ```tsx
 * const { handleDragEnd, terminalStageModal, closeTerminalModal, confirmTerminalStage } =
 *   useDealDragDrop();
 *
 * <DndContext onDragEnd={handleDragEnd}>
 *   ...
 * </DndContext>
 * ```
 */
export function useDealDragDrop(options: UseDealDragDropOptions = {}) {
  const queryClient = useQueryClient();
  const [terminalStageModal, setTerminalStageModal] = useState<TerminalStageModal>({
    isOpen: false,
    dealId: null,
    dealName: null,
    newStage: null,
    isClosedLost: false,
  });

  // Mutation for changing deal stage
  const stageChangeMutation = useMutation({
    mutationFn: ({
      dealId,
      data,
    }: {
      dealId: string;
      data: ChangeDealStageInput;
    }) => changeDealStage(dealId, data),
    onMutate: async ({ dealId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: pipelineKeys.all });

      // Snapshot the previous value
      const previousPipeline = queryClient.getQueriesData({ queryKey: pipelineKeys.all });

      // Optimistically update to the new value
      queryClient.setQueriesData<PipelineResponse>(
        { queryKey: pipelineKeys.all },
        (old) => {
          if (!old) return old;

          // Find the deal and move it to the new stage
          const newStages = old.stages.map((stage) => ({
            ...stage,
            deals: stage.deals.filter((deal) => deal.id !== dealId),
          }));

          // Find the deal from old stages
          let movedDeal = null;
          for (const stage of old.stages) {
            const deal = stage.deals.find((d) => d.id === dealId);
            if (deal) {
              movedDeal = { ...deal, current_stage: data.new_stage };
              break;
            }
          }

          // Add deal to new stage
          if (movedDeal) {
            const targetStageIndex = newStages.findIndex(
              (s) => s.code === data.new_stage
            );
            if (targetStageIndex !== -1) {
              const targetStage = newStages[targetStageIndex];
              if (targetStage) {
                newStages[targetStageIndex] = {
                  ...targetStage,
                  code: targetStage.code || '',
                  name: targetStage.name || '',
                  deals: [...targetStage.deals, movedDeal],
                  count: targetStage.deals.length + 1,
                  total_value: targetStage.total_value + (movedDeal.deal_value || 0),
                };
              }
            }
          }

          return {
            ...old,
            stages: newStages,
          };
        }
      );

      return { previousPipeline };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPipeline) {
        context.previousPipeline.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(err instanceof Error ? err.message : 'Failed to update stage');
      options.onError?.(err instanceof Error ? err : new Error(String(err)));
    },
    onSuccess: (data, variables) => {
      toast.success('Deal stage updated');
      options.onStageChange?.(variables.dealId, variables.data.new_stage);
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: pipelineKeys.all });
    },
  });

  /**
   * Handle drag end event
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      const dealId = String(active.id);
      const newStage = String(over.id);

      // Get current pipeline data to find deal info and stage type
      const pipelineData = queryClient.getQueryData<PipelineResponse>(
        pipelineKeys.list({})
      );

      let dealName = null;
      let stageType: 'normal' | 'won' | undefined;

      if (pipelineData) {
        // Find the deal to get deal name and deal type pipeline stages
        for (const stage of pipelineData.stages) {
          const deal = stage.deals.find((d) => d.id === dealId);
          if (deal) {
            dealName = deal.deal_name;
            // Get stage type from deal type's pipeline stages
            const targetStage = deal.deal_type?.pipeline_stages?.find(s => s.code === newStage);
            stageType = targetStage?.type;
            break;
          }
        }
      }

      // Check if new stage is terminal "won" stage using type field with fallback to hardcoded logic
      const isClosedWon = stageType === 'won' || newStage === 'closed' || newStage === 'funded';

      if (isClosedWon) {
        // Show modal for won terminal stage
        setTerminalStageModal({
          isOpen: true,
          dealId,
          dealName,
          newStage,
          isClosedLost: false,
        });
      } else {
        // Non-terminal stage, update immediately
        stageChangeMutation.mutate({
          dealId,
          data: { new_stage: newStage },
        });
      }
    },
    [queryClient, stageChangeMutation]
  );

  /**
   * Close terminal stage modal
   */
  const closeTerminalModal = useCallback(() => {
    setTerminalStageModal({
      isOpen: false,
      dealId: null,
      dealName: null,
      newStage: null,
      isClosedLost: false,
    });
  }, []);

  /**
   * Confirm terminal "won" stage change
   */
  const confirmTerminalStage = useCallback(
    () => {
      if (!terminalStageModal.dealId || !terminalStageModal.newStage) {
        return;
      }

      stageChangeMutation.mutate({
        dealId: terminalStageModal.dealId,
        data: {
          new_stage: terminalStageModal.newStage,
        },
      });

      closeTerminalModal();
    },
    [terminalStageModal, stageChangeMutation, closeTerminalModal]
  );

  return {
    handleDragEnd,
    terminalStageModal,
    closeTerminalModal,
    confirmTerminalStage,
    isUpdating: stageChangeMutation.isPending,
  };
}

export default useDealDragDrop;
