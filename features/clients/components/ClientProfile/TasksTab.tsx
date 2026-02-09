/**
 * TasksTab Component
 *
 * Displays task list for a client with status toggle.
 *
 * @module features/clients/components/ClientProfile/TasksTab
 */

import React, { useCallback, useState, useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import {
  Plus,
  SearchIcon,
  XIcon,
  FilterIcon,
  ChevronDownIcon,
  CircleIcon,
  PlayCircleIcon,
  CheckCircle2Icon,
  SignalIcon,
  AlertCircleIcon,
  ClockIcon,
  CalendarIcon,
} from 'lucide-react';
import { TaskList } from '../TaskCard';
import { TaskDetailsDialog } from '../TaskDetailsDialog';
import { TaskForm } from '../TaskForm';
import { taskApi } from '../../api/clientApi';
import { isPast, isToday } from '../../helpers';
import type { ClientTask, TaskStatus, TaskPriority, CreateTaskInput, UpdateTaskInput } from '../../types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for the TasksTab component
 */
export interface TasksTabProps {
  /** Client ID */
  clientId: string;
  /** Client name (for display in create task form) */
  clientName: string;
  /** Array of tasks to display */
  tasks: ClientTask[];
  /** Callback when a task is created or modified */
  onTaskChanged?: () => void;
  /** Additional CSS classes */
  className?: string;
}

type DueDateFilter = 'all' | 'overdue' | 'today' | 'upcoming';

// =============================================================================
// STATUS CONFIGURATION
// =============================================================================

const STATUS_CONFIG = {
  todo: {
    label: 'To Do',
    icon: CircleIcon,
    textColor: 'text-slate-600 dark:text-slate-400',
  },
  in_progress: {
    label: 'In Progress',
    icon: PlayCircleIcon,
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  closed: {
    label: 'Closed',
    icon: CheckCircle2Icon,
    textColor: 'text-green-600 dark:text-green-400',
  },
} as const;

// =============================================================================
// FILTER OPTIONS
// =============================================================================

const STATUS_OPTIONS: Array<{ value: TaskStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS: Array<{ value: TaskPriority | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const DUE_DATE_OPTIONS: Array<{ value: DueDateFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Upcoming' },
];

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Client tasks tab with list and status management
 *
 * @example
 * ```tsx
 * <TasksTab
 *   clientId="cl123"
 *   tasks={tasks}
 *   onTaskChanged={refetchTasks}
 * />
 * ```
 */
export const TasksTab: React.FC<TasksTabProps> = ({
  clientId,
  clientName,
  tasks,
  onTaskChanged,
  className,
}) => {
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<ClientTask | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<ClientTask | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilters, setStatusFilters] = useState<TaskStatus[]>([]);
  const [priorityFilters, setPriorityFilters] = useState<TaskPriority[]>([]);
  const [dueDateFilters, setDueDateFilters] = useState<Exclude<DueDateFilter, 'all'>[]>([]);

  // Handle opening dialog for new task
  const handleAddTask = useCallback(() => {
    setIsCreateDialogOpen(true);
  }, []);

  // Handle task status change
  const handleStatusChange = useCallback(
    async (task: ClientTask, newStatus: TaskStatus) => {
      setUpdatingTaskId(task.id);
      try {
        await taskApi.updateTask(clientId, task.id, { status: newStatus });
        onTaskChanged?.();
      } catch (error) {
        console.error('Failed to update task status:', error);
      } finally {
        setUpdatingTaskId(null);
      }
    },
    [clientId, onTaskChanged]
  );

  // Handle task edit - open edit dialog
  const handleEdit = useCallback((task: ClientTask) => {
    setSelectedTask(task);
    setIsDetailsDialogOpen(true);
  }, []);

  // Handle task update
  const handleTaskUpdate = useCallback(
    async (task: ClientTask | null, data: UpdateTaskInput) => {
      if (!task?.id) return; // Should not happen in edit mode

      setUpdatingTaskId(task.id);
      try {
        await taskApi.updateTask(clientId, task.id, data);
        onTaskChanged?.();
        setIsDetailsDialogOpen(false);
        setSelectedTask(null);
      } catch (error) {
        console.error('Failed to update task:', error);
        throw error;
      } finally {
        setUpdatingTaskId(null);
      }
    },
    [clientId, onTaskChanged]
  );

  // Handle task creation
  const handleTaskCreate = useCallback(
    async (selectedClientId: string, data: CreateTaskInput) => {
      setIsCreatingTask(true);
      try {
        await taskApi.createTask(selectedClientId, data);
        onTaskChanged?.();
        setIsCreateDialogOpen(false);
      } catch (error) {
        console.error('Failed to create task:', error);
        throw error;
      } finally {
        setIsCreatingTask(false);
      }
    },
    [onTaskChanged]
  );

  // Handle task deletion - open confirm dialog
  const handleDelete = useCallback((task: ClientTask) => {
    setTaskToDelete(task);
    setIsDeleteDialogOpen(true);
  }, []);

  // Confirm and execute delete
  const handleConfirmDelete = useCallback(async () => {
    if (!taskToDelete) return;

    setDeletingTaskId(taskToDelete.id);
    try {
      await taskApi.deleteTask(clientId, taskToDelete.id);
      onTaskChanged?.();
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setDeletingTaskId(null);
    }
  }, [taskToDelete, clientId, onTaskChanged]);

  // Cancel delete
  const handleCancelDelete = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setTaskToDelete(null);
  }, []);

  // Filter tasks based on search, status, priority, and due date
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Apply status filter (multi-select)
    if (statusFilters.length > 0) {
      filtered = filtered.filter((task) => statusFilters.includes(task.status));
    }

    // Apply priority filter (multi-select)
    if (priorityFilters.length > 0) {
      filtered = filtered.filter((task) => priorityFilters.includes(task.priority));
    }

    // Apply due date filters (multi-select)
    if (dueDateFilters.length > 0) {
      filtered = filtered.filter((task) => {
        if (!task.due_date) {
          return false;
        }

        return dueDateFilters.some((filter) => {
          switch (filter) {
            case 'overdue':
              return isPast(task.due_date) && !isToday(task.due_date);
            case 'today':
              return isToday(task.due_date);
            case 'upcoming':
              return !isPast(task.due_date) && !isToday(task.due_date);
            default:
              return false;
          }
        });
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((task) =>
        task.title.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [tasks, searchQuery, statusFilters, priorityFilters, dueDateFilters]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2 p-2 bg-muted/50 rounded-lg">
        {/* Search Input */}
        <div className="relative flex-2">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 h-9 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&::-webkit-search-cancel-button]:hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Filter (Multi-select) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 shrink-0 justify-between min-w-28"
            >
              <div className="flex items-center gap-1.5">
                <FilterIcon className="h-3.5 w-3.5" />
                <span className="text-sm">
                  Status
                  {statusFilters.length > 0 && ` (${statusFilters.length})`}
                </span>
              </div>
              <ChevronDownIcon className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="space-y-1">
              {STATUS_OPTIONS.filter(opt => opt.value !== 'all').map((option) => {
                const config = STATUS_CONFIG[option.value as TaskStatus];
                const Icon = config.icon;
                return (
                  <div key={option.value} className="flex items-center space-x-2 px-2 py-1.5 hover:bg-muted rounded-sm">
                    <Checkbox
                      id={`status-${option.value}`}
                      checked={statusFilters.includes(option.value as TaskStatus)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setStatusFilters([...statusFilters, option.value as TaskStatus]);
                        } else {
                          setStatusFilters(statusFilters.filter(s => s !== option.value));
                        }
                      }}
                    />
                    <Icon className={cn('h-4 w-4', config.textColor)} />
                    <Label
                      htmlFor={`status-${option.value}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {option.label}
                    </Label>
                  </div>
                );
              })}
              {statusFilters.length > 0 && (
                <div className="pt-1 mt-1 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={() => setStatusFilters([])}
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Priority Filter (Multi-select) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 shrink-0 justify-between min-w-28"
            >
              <div className="flex items-center gap-1.5">
                <FilterIcon className="h-3.5 w-3.5" />
                <span className="text-sm">
                  Priority
                  {priorityFilters.length > 0 && ` (${priorityFilters.length})`}
                </span>
              </div>
              <ChevronDownIcon className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="space-y-1">
              {PRIORITY_OPTIONS.filter(opt => opt.value !== 'all').map((option) => {
                const priorityColors = {
                  high: 'text-red-600 dark:text-red-400',
                  medium: 'text-amber-600 dark:text-amber-400',
                  low: 'text-blue-600 dark:text-blue-400',
                };
                const colorClass = priorityColors[option.value as TaskPriority] || '';
                return (
                  <div key={option.value} className="flex items-center space-x-2 px-2 py-1.5 hover:bg-muted rounded-sm">
                    <Checkbox
                      id={`priority-${option.value}`}
                      checked={priorityFilters.includes(option.value as TaskPriority)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setPriorityFilters([...priorityFilters, option.value as TaskPriority]);
                        } else {
                          setPriorityFilters(priorityFilters.filter(p => p !== option.value));
                        }
                      }}
                    />
                    <SignalIcon className={cn('h-4 w-4', colorClass)} />
                    <Label
                      htmlFor={`priority-${option.value}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {option.label}
                    </Label>
                  </div>
                );
              })}
              {priorityFilters.length > 0 && (
                <div className="pt-1 mt-1 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={() => setPriorityFilters([])}
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Due Date Filter (Multi-select) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 shrink-0 justify-between min-w-28"
            >
              <div className="flex items-center gap-1.5">
                <FilterIcon className="h-3.5 w-3.5" />
                <span className="text-sm">
                  Due Date
                  {dueDateFilters.length > 0 && ` (${dueDateFilters.length})`}
                </span>
              </div>
              <ChevronDownIcon className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="space-y-1">
              {DUE_DATE_OPTIONS.filter(opt => opt.value !== 'all').map((option) => {
                const dueDateConfig = {
                  overdue: { icon: AlertCircleIcon, color: 'text-red-600 dark:text-red-400' },
                  today: { icon: ClockIcon, color: 'text-amber-600 dark:text-amber-400' },
                  upcoming: { icon: CalendarIcon, color: 'text-blue-600 dark:text-blue-400' },
                };
                const config = dueDateConfig[option.value as Exclude<DueDateFilter, 'all'>];
                const Icon = config.icon;
                return (
                  <div key={option.value} className="flex items-center space-x-2 px-2 py-1.5 hover:bg-muted rounded-sm">
                    <Checkbox
                      id={`due-date-${option.value}`}
                      checked={dueDateFilters.includes(option.value as Exclude<DueDateFilter, 'all'>)}
                      onCheckedChange={(checked) => {
                        const value = option.value as Exclude<DueDateFilter, 'all'>;
                        if (checked) {
                          setDueDateFilters([...dueDateFilters, value]);
                        } else {
                          setDueDateFilters(dueDateFilters.filter(d => d !== value));
                        }
                      }}
                    />
                    <Icon className={cn('h-4 w-4', config.color)} />
                    <Label
                      htmlFor={`due-date-${option.value}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {option.label}
                    </Label>
                  </div>
                );
              })}
              {dueDateFilters.length > 0 && (
                <div className="pt-1 mt-1 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={() => setDueDateFilters([])}
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Add Task Button */}
        <Button onClick={handleAddTask} variant="outline" size="sm" className="h-9 shrink-0">
          <Plus className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Add Task</span>
        </Button>
      </div>

      {/* Task List */}
      <TaskList
        tasks={filteredTasks}
        onStatusChange={handleStatusChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        updatingTaskId={updatingTaskId ?? undefined}
        deletingTaskId={deletingTaskId ?? undefined}
      />

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
            <DialogDescription>
              Create a new task for {clientName}.
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            fixedClientId={clientId}
            fixedClientName={clientName}
            onSubmit={handleTaskCreate}
            onCancel={() => setIsCreateDialogOpen(false)}
            isSubmitting={isCreatingTask}
          />
        </DialogContent>
      </Dialog>

      {/* Task Details Dialog (for editing) */}
      <TaskDetailsDialog
        task={
          selectedTask
            ? {
                ...selectedTask,
                client_name: clientName,
              }
            : null
        }
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        onUpdate={handleTaskUpdate}
        isUpdating={!!updatingTaskId}
        initialEditMode={true}
        showClientInfo={false}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {taskToDelete && (
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-sm font-medium text-foreground">{taskToDelete.title}</p>
                {taskToDelete.due_date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Due: {new Date(taskToDelete.due_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelDelete}
                disabled={deletingTaskId === taskToDelete?.id}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deletingTaskId === taskToDelete?.id}
              >
                {deletingTaskId === taskToDelete?.id ? 'Deleting...' : 'Delete Task'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksTab;
