'use client';

/**
 * Task Form Component
 *
 * Form component for creating tasks with client selection.
 * Uses react-hook-form with Zod validation.
 */

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils/cn';
import type { ClientWithTags, CreateTaskInput, TaskPriority } from '../../types';

// =============================================================================
// SCHEMA
// =============================================================================

const taskFormSchema = z.object({
  client_id: z.string().min(1, 'Please select a client'),
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(255, 'Task title must be 255 characters or less'),
  description: z.string().optional(),
  due_date: z.string().min(1, 'Due date is required'),
  priority: z.enum(['low', 'medium', 'high']),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

// =============================================================================
// TYPES
// =============================================================================

export interface TaskFormProps {
  /** List of clients to select from (not needed if fixedClientId is provided) */
  clients?: ClientWithTags[];
  /** Whether clients are loading */
  isLoadingClients?: boolean;
  /** Callback when form is submitted with valid data */
  onSubmit: (clientId: string, data: CreateTaskInput) => Promise<void>;
  /** Callback when cancel button is clicked */
  onCancel?: () => void;
  /** External loading state */
  isSubmitting?: boolean;
  /** Fixed client ID (makes client field read-only and pre-selected) */
  fixedClientId?: string;
  /** Fixed client name (displayed when fixedClientId is set) */
  fixedClientName?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const TaskForm: React.FC<TaskFormProps> = ({
  clients = [],
  isLoadingClients,
  onSubmit,
  onCancel,
  isSubmitting,
  fixedClientId,
  fixedClientName,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      client_id: fixedClientId || '',
      title: '',
      description: '',
      due_date: new Date().toISOString().split('T')[0],
      priority: 'medium',
    },
  });

  const selectedClientId = watch('client_id');
  const selectedPriority = watch('priority');

  const handleFormSubmit = async (data: TaskFormData) => {
    const { client_id, ...taskData } = data;
    await onSubmit(client_id, taskData as CreateTaskInput);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Client Selection */}
      <div className="space-y-2">
        <Label htmlFor="client_id">Client *</Label>
        {fixedClientId ? (
          // Fixed client - read-only display
          <div className="flex items-center gap-2 rounded-md border border-input bg-muted px-3 py-2 text-sm h-9">
            <svg
              className="h-4 w-4 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
            <span className="text-foreground">{fixedClientName || 'Current Client'}</span>
          </div>
        ) : (
          // Client dropdown selector
          <Select
            value={selectedClientId}
            onValueChange={(value) => setValue('client_id', value)}
            disabled={isLoadingClients}
          >
            <SelectTrigger id="client_id" className="h-9">
              <SelectValue placeholder={isLoadingClients ? 'Loading clients...' : 'Select a client'} />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors.client_id && (
          <p className="text-sm text-destructive">{errors.client_id.message}</p>
        )}
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="Enter task title"
          className="h-9"
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Enter task description (optional)"
          rows={3}
        />
      </div>

      {/* Due Date */}
      <div className="space-y-2">
        <Label htmlFor="due_date">Due Date *</Label>
        <Controller
          name="due_date"
          control={control}
          render={({ field }) => (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={isSubmitting}
                  className={cn(
                    'w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm h-9',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    !field.value && 'text-muted-foreground'
                  )}
                  aria-label="Select due date"
                >
                  <span>
                    {field.value ? format(new Date(field.value), 'PPP') : 'Pick a date'}
                  </span>
                  <CalendarIcon className="h-4 w-4 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
                <Calendar
                  mode="single"
                  selected={field.value ? new Date(field.value) : undefined}
                  onSelect={(date) => {
                    field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                  }}
                  disabled={isSubmitting}
                  captionLayout="dropdown"
                  startMonth={new Date(2020, 0)}
                  endMonth={new Date(2100, 11)}
                />
              </PopoverContent>
            </Popover>
          )}
        />
        {errors.due_date && (
          <p className="text-sm text-destructive">{errors.due_date.message}</p>
        )}
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Select
          value={selectedPriority}
          onValueChange={(value) => setValue('priority', value as TaskPriority)}
        >
          <SelectTrigger id="priority" className="h-9">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;
