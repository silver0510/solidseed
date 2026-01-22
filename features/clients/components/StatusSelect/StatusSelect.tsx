'use client';

/**
 * StatusSelect Component
 *
 * Dropdown select for choosing client status.
 * Fetches available statuses from the API and displays them with their colors.
 *
 * @module features/clients/components/StatusSelect/StatusSelect
 */

import { useSuspenseQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ClientStatus {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface StatusSelectProps {
  /** Current status ID */
  value?: string;
  /** Callback when status changes */
  onValueChange: (value: string) => void;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Fetch client statuses
 */
async function fetchClientStatuses(): Promise<ClientStatus[]> {
  const response = await fetch('/api/client-statuses');
  if (!response.ok) {
    throw new Error('Failed to fetch client statuses');
  }
  return response.json();
}

/**
 * StatusSelect allows users to select a client status from available options
 */
export const StatusSelect: React.FC<StatusSelectProps> = ({
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select status',
}) => {
  const { data: statuses } = useSuspenseQuery({
    queryKey: ['client-statuses'],
    queryFn: fetchClientStatuses,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const selectedStatus = statuses.find((s) => s.id === value);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder}>
          {selectedStatus && (
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: selectedStatus.color }}
              />
              <span>{selectedStatus.name}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {statuses.map((status) => (
          <SelectItem key={status.id} value={status.id}>
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              <span>{status.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default StatusSelect;
