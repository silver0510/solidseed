# Common Patterns

Frequently used patterns for forms, authentication, DataGrid, dialogs, and other common UI elements.

---

## Authentication with useAuth

### Getting Current User

```typescript
import { useAuth } from '@/hooks/useAuth';

export const MyComponent: React.FC = () => {
    const { user } = useAuth();

    // Available properties:
    // - user.id: string
    // - user.email: string
    // - user.username: string
    // - user.roles: string[]

    return (
        <div>
            <p>Logged in as: {user.email}</p>
            <p>Username: {user.username}</p>
            <p>Roles: {user.roles.join(', ')}</p>
        </div>
    );
};
```

**NEVER make direct API calls for auth** - always use `useAuth` hook.

---

## Forms with React Hook Form

### Basic Form with shadcn/ui

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Zod schema for validation
const formSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    age: z.coerce.number().min(18, 'Must be 18 or older'),
});

type FormData = z.infer<typeof formSchema>;

export const MyForm: React.FC = () => {
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: '',
            email: '',
            age: 18,
        },
    });

    const onSubmit = async (data: FormData) => {
        try {
            await api.submitForm(data);
            toast.success('Form submitted successfully');
        } catch (error) {
            toast.error('Failed to submit form');
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter username" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="you@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Age</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit">Submit</Button>
            </form>
        </Form>
    );
};
```

---

## Dialog Component Pattern

### Standard Dialog Structure with shadcn/ui

All dialogs should have:

- Clear title with optional icon
- Close button (X) or DialogClose
- Action buttons at bottom

```typescript
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, X } from 'lucide-react';

interface MyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}

export const MyDialog: React.FC<MyDialogProps> = ({ open, onOpenChange, onConfirm }) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        Dialog Title
                    </DialogTitle>
                    <DialogDescription>
                        Description of what this dialog does.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {/* Content here */}
                </div>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={onConfirm}>Confirm</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
```

### Alert Dialog (Confirmation)

```typescript
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export const DeleteConfirmDialog: React.FC<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}> = ({ open, onOpenChange, onConfirm }) => {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete
                        the item and remove it from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
```

---

## Table Pattern with shadcn/ui

### Basic Table

```typescript
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface User {
    id: string;
    name: string;
    email: string;
    status: string;
}

interface UserTableProps {
    users: User[];
    onRowClick?: (user: User) => void;
}

export const UserTable: React.FC<UserTableProps> = ({ users, onRowClick }) => {
    return (
        <Table>
            <TableCaption>A list of users</TableCaption>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => (
                    <TableRow
                        key={user.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => onRowClick?.(user)}
                    >
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.status}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};
```

### Data Table with TanStack Table

For advanced features (sorting, filtering, pagination), use `@tanstack/react-table` with shadcn/ui:

```typescript
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useState } from 'react';

interface DataTableProps<T> {
    columns: ColumnDef<T>[];
    data: T[];
}

export function DataTable<T>({ columns, data }: DataTableProps<T>) {
    const [sorting, setSorting] = useState<SortingState>([]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        state: { sorting },
    });

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                    )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                    {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
```

---

## Mutation Patterns

### Update with Cache Invalidation

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const useUpdateEntity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateEntity(id, data),

    onSuccess: (result, variables) => {
      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: ['entity', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['entities'] });

      toast.success('Entity updated');
    },

    onError: () => {
      toast.error('Failed to update entity');
    },
  });
};

// Usage
const updateEntity = useUpdateEntity();

const handleSave = () => {
  updateEntity.mutate({ id: 123, data: { name: 'New Name' } });
};
```

### With Loading Toast

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const useDeleteEntity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.deleteEntity(id),

    onMutate: () => {
      // Show loading toast
      return { toastId: toast.loading('Deleting...') };
    },

    onSuccess: (_, __, context) => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      toast.success('Entity deleted', { id: context?.toastId });
    },

    onError: (_, __, context) => {
      toast.error('Failed to delete entity', { id: context?.toastId });
    },
  });
};
```

---

## State Management Patterns

### TanStack Query for Server State (PRIMARY)

Use TanStack Query for **all server data**:

- Fetching: useSuspenseQuery
- Mutations: useMutation
- Caching: Automatic
- Synchronization: Built-in

```typescript
// ✅ CORRECT - TanStack Query for server data
const { data: users } = useSuspenseQuery({
  queryKey: ['users'],
  queryFn: () => userApi.getUsers(),
});
```

### useState for UI State

Use `useState` for **local UI state only**:

- Form inputs (uncontrolled)
- Modal open/closed
- Selected tab
- Temporary UI flags

```typescript
// ✅ CORRECT - useState for UI state
const [modalOpen, setModalOpen] = useState(false);
const [selectedTab, setSelectedTab] = useState(0);
```

### Zustand for Global Client State (Minimal)

Use Zustand only for **global client state**:

- Theme preference
- Sidebar collapsed state
- User preferences (not from server)

```typescript
import { create } from 'zustand';

interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppState = create<AppState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
```

**Avoid prop drilling** - use context or Zustand instead.

---

## Summary

**Common Patterns:**

- ✅ useAuth hook for current user (id, email, roles, username)
- ✅ React Hook Form + Zod for forms
- ✅ Dialog with icon + close button
- ✅ DataGrid wrapper contracts
- ✅ Mutations with cache invalidation
- ✅ TanStack Query for server state
- ✅ useState for UI state
- ✅ Zustand for global client state (minimal)

**See Also:**

- [data-fetching.md](data-fetching.md) - TanStack Query patterns
- [component-patterns.md](component-patterns.md) - Component structure
- [loading-and-error-states.md](loading-and-error-states.md) - Error handling
