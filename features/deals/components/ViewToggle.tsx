/**
 * ViewToggle Component
 * Toggle between Kanban board and List table views
 * Persists preference in localStorage
 */

'use client';

import * as React from 'react';
import { LayoutGrid, LayoutList } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type DealView = 'kanban' | 'list';

interface ViewToggleProps {
  currentView: DealView;
  onViewChange: (view: DealView) => void;
}

const STORAGE_KEY = 'deal-view-preference';

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  const handleViewChange = (value: string) => {
    if (value && (value === 'kanban' || value === 'list')) {
      onViewChange(value);
      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, value);
      } catch (error) {
        console.error('Failed to save view preference:', error);
      }
    }
  };

  return (
    <TooltipProvider>
      <ToggleGroup type="single" value={currentView} onValueChange={handleViewChange}>
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="kanban" aria-label="Kanban view" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Board</span>
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>Kanban Board View</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="list" aria-label="List view" className="gap-2">
              <LayoutList className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>List Table View</p>
          </TooltipContent>
        </Tooltip>
      </ToggleGroup>
    </TooltipProvider>
  );
}

/**
 * Hook to get and set the saved view preference
 */
export function useDealViewPreference(): [DealView, (view: DealView) => void] {
  const [view, setView] = React.useState<DealView>('kanban');

  // Load preference on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'kanban' || saved === 'list') {
        setView(saved);
      }
    } catch (error) {
      console.error('Failed to load view preference:', error);
    }
  }, []);

  return [view, setView];
}
