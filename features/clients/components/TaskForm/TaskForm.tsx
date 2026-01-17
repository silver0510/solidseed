'use client';

/**
 * Task Form Component
 *
 * Form component for creating tasks with client selection.
 * Uses react-hook-form with Zod validation.
 */

import { useForm } from 'react-hook-form';
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
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

// =============================================================================
// TYPES
// =============================================================================

export interface TaskFormProps {
  /** List of clients to select from */
  clients: ClientWithTags[];
  /** Whether clients are loading */
  isLoadingClients?: boolean;
  /** Callback when form is submitted with valid data */
  onSubmit: (clientId: string, data: CreateTaskInput) => Promise<void>;
  /** Callback when cancel button is clicked */
  onCancel?: () => void;
  /** External loading state */
  isSubmitting?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const TaskForm: React.FC<TaskFormProps> = ({
  clients,
  isLoadingClients,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      client_id: '',
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
        <Input
          id="due_date"
          type="date"
          {...register('due_date')}
          className="h-9"
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
