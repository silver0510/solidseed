/**
 * DealFilters Component
 * Filter controls for deal list view
 */

'use client';

import * as React from 'react';
import { X, CalendarIcon, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { DealStatus, DealType } from '@/lib/types/deals';
import type { DealFilters as FilterState } from '../hooks/useDealFilters';

interface DealFiltersProps {
  filters: FilterState;
  dealTypes: DealType[];
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const STATUS_OPTIONS: { value: DealStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Deals' },
  { value: 'active', label: 'Active' },
  { value: 'closed_won', label: 'Closed Won' },
  { value: 'closed_lost', label: 'Closed Lost' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function DealFilters({
  filters,
  dealTypes,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
}: DealFiltersProps) {
  // Get unique stages from all deal types
  const allStages = React.useMemo(() => {
    const stageMap = new Map<string, string>();
    dealTypes.forEach((type) => {
      type.pipeline_stages.forEach((stage) => {
        if (!stageMap.has(stage.code)) {
          stageMap.set(stage.code, stage.name);
        }
      });
    });
    return Array.from(stageMap.entries()).map(([code, name]) => ({ code, name }));
  }, [dealTypes]);

  const toggleDealType = (typeId: string) => {
    const current = filters.dealTypeIds;
    const updated = current.includes(typeId)
      ? current.filter((id) => id !== typeId)
      : [...current, typeId];
    onFilterChange('dealTypeIds', updated);
  };

  const toggleStage = (stageCode: string) => {
    const current = filters.stages;
    const updated = current.includes(stageCode)
      ? current.filter((code) => code !== stageCode)
      : [...current, stageCode];
    onFilterChange('stages', updated);
  };

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Filters</h3>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              Active
            </Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Deal name or client..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => onFilterChange('status', value as DealStatus | 'all')}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date From */}
        <div className="space-y-2">
          <Label>Expected Close From</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !filters.dateFrom && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateFrom ? format(new Date(filters.dateFrom), 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                onSelect={(date) => onFilterChange('dateFrom', date ? format(date, 'yyyy-MM-dd') : null)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date To */}
        <div className="space-y-2">
          <Label>Expected Close To</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !filters.dateTo && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateTo ? format(new Date(filters.dateTo), 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                onSelect={(date) => onFilterChange('dateTo', date ? format(date, 'yyyy-MM-dd') : null)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Deal Types */}
      {dealTypes.length > 0 && (
        <div className="space-y-2">
          <Label>Deal Types</Label>
          <div className="flex flex-wrap gap-2">
            {dealTypes.map((type) => (
              <Badge
                key={type.id}
                variant={filters.dealTypeIds.includes(type.id) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleDealType(type.id)}
              >
                {type.type_name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Stages */}
      {allStages.length > 0 && (
        <div className="space-y-2">
          <Label>Pipeline Stages</Label>
          <div className="flex flex-wrap gap-2">
            {allStages.map((stage) => (
              <Badge
                key={stage.code}
                variant={filters.stages.includes(stage.code) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleStage(stage.code)}
              >
                {stage.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
