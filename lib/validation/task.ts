/**
 * Task Validation Schemas
 *
 * Zod schemas for validating task data in API endpoints.
 */

import { z } from 'zod';

/**
 * Valid task priority values
 */
export const taskPriorityEnum = z.enum(['low', 'medium', 'high']);

/**
 * Valid task status values
 */
export const taskStatusEnum = z.enum(['todo', 'in_progress', 'closed']);

/**
 * Schema for creating a new task
 *
 * Validation rules:
 * - title: Required, 1-255 characters, non-empty after trim
 * - description: Optional text
 * - due_date: Required, valid ISO date format (YYYY-MM-DD)
 * - priority: Optional, must be low/medium/high, defaults to 'medium'
 */
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(255, 'Task title must be 255 characters or less')
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, 'Task title cannot be empty'),
  description: z.string().optional(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  priority: taskPriorityEnum.optional().default('medium'),
});

/**
 * Schema for updating an existing task
 *
 * All fields are optional (partial update).
 * When status changes to 'closed', completed_at is auto-set by the service.
 */
export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(255, 'Task title must be 255 characters or less')
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, 'Task title cannot be empty')
    .optional(),
  description: z.string().optional(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date')
    .optional(),
  priority: taskPriorityEnum.optional(),
  status: taskStatusEnum.optional(),
  client_id: z.string().optional(),
});

/**
 * Schema for task dashboard filters
 *
 * All fields are optional query parameters.
 */
export const taskFiltersSchema = z.object({
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  due_before: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'due_before must be in YYYY-MM-DD format')
    .optional(),
  due_after: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'due_after must be in YYYY-MM-DD format')
    .optional(),
});

/**
 * TypeScript types derived from Zod schemas
 */
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFilters = z.infer<typeof taskFiltersSchema>;
export type TaskPriority = z.infer<typeof taskPriorityEnum>;
export type TaskStatus = z.infer<typeof taskStatusEnum>;
