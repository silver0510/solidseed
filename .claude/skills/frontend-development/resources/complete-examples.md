# Complete Examples

Full working examples combining all modern patterns: React.FC, lazy loading, Suspense, useSuspenseQuery, shadcn/ui components, Tailwind CSS, routing, and error handling.

---

## Example 1: Complete Modern Component

Combines: React.FC, useSuspenseQuery, cache-first, useCallback, shadcn/ui, Tailwind CSS, toast

```typescript
/**
 * User profile display component
 * Demonstrates modern patterns with Suspense and TanStack Query
 */
import React, { useState, useCallback, useMemo } from 'react';
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { userApi } from '../api/userApi';
import type { User } from '~types/user';

interface UserProfileProps {
    userId: string;
    onUpdate?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);

    // Suspense query - no isLoading needed!
    const { data: user } = useSuspenseQuery({
        queryKey: ['user', userId],
        queryFn: () => userApi.getUser(userId),
        staleTime: 5 * 60 * 1000,
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (updates: Partial<User>) =>
            userApi.updateUser(userId, updates),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', userId] });
            toast.success('Profile updated');
            setIsEditing(false);
            onUpdate?.();
        },

        onError: () => {
            toast.error('Failed to update profile');
        },
    });

    // Memoized computed value
    const fullName = useMemo(() => {
        return `${user.firstName} ${user.lastName}`;
    }, [user.firstName, user.lastName]);

    // Event handlers with useCallback
    const handleEdit = useCallback(() => {
        setIsEditing(true);
    }, []);

    const handleSave = useCallback(() => {
        updateMutation.mutate({
            firstName: user.firstName,
            lastName: user.lastName,
        });
    }, [user, updateMutation]);

    const handleCancel = useCallback(() => {
        setIsEditing(false);
    }, []);

    return (
        <Card className="max-w-xl mx-auto">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback>
                            {user.firstName[0]}{user.lastName[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-xl">{fullName}</CardTitle>
                        <p className="text-muted-foreground">{user.email}</p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p>{user.username}</p>
                </div>
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Roles</p>
                    <p>{user.roles.join(', ')}</p>
                </div>

                <div className="flex gap-2 pt-4">
                    {!isEditing ? (
                        <Button onClick={handleEdit}>Edit Profile</Button>
                    ) : (
                        <>
                            <Button
                                onClick={handleSave}
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending ? 'Saving...' : 'Save'}
                            </Button>
                            <Button variant="outline" onClick={handleCancel}>
                                Cancel
                            </Button>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default UserProfile;
```

**Usage:**

```typescript
<SuspenseLoader>
    <UserProfile userId='123' onUpdate={() => console.log('Updated')} />
</SuspenseLoader>
```

---

## Example 2: Complete Feature Structure

Real example based on `features/users/`:

```
features/
  users/
    api/
      userApi.ts                # API service layer
    components/
      UserProfile.tsx           # Main component (from Example 1)
      UserList.tsx              # List component
      UserForm.tsx              # Form component
      modals/
        DeleteUserModal.tsx     # Modal component
    hooks/
      useSuspenseUser.ts        # Suspense query hook
      useUserMutations.ts       # Mutation hooks
      useUserPermissions.ts     # Feature-specific hook
    helpers/
      userHelpers.ts            # Utility functions
      validation.ts             # Validation logic
    types/
      index.ts                  # TypeScript interfaces
    index.ts                    # Public API exports
```

### API Service (userApi.ts)

```typescript
import apiClient from '@/lib/apiClient';
import type { User, CreateUserPayload, UpdateUserPayload } from '../types';

export const userApi = {
  getUser: async (userId: string): Promise<User> => {
    const { data } = await apiClient.get(`/users/${userId}`);
    return data;
  },

  getUsers: async (): Promise<User[]> => {
    const { data } = await apiClient.get('/users');
    return data;
  },

  createUser: async (payload: CreateUserPayload): Promise<User> => {
    const { data } = await apiClient.post('/users', payload);
    return data;
  },

  updateUser: async (userId: string, payload: UpdateUserPayload): Promise<User> => {
    const { data } = await apiClient.put(`/users/${userId}`, payload);
    return data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}`);
  },
};
```

### Suspense Hook (useSuspenseUser.ts)

```typescript
import { useSuspenseQuery } from '@tanstack/react-query';
import { userApi } from '../api/userApi';
import type { User } from '../types';

export function useSuspenseUser(userId: string) {
  return useSuspenseQuery<User, Error>({
    queryKey: ['user', userId],
    queryFn: () => userApi.getUser(userId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useSuspenseUsers() {
  return useSuspenseQuery<User[], Error>({
    queryKey: ['users'],
    queryFn: () => userApi.getUsers(),
    staleTime: 1 * 60 * 1000,
  });
}
```

### Types (types/index.ts)

```typescript
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export type UpdateUserPayload = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;
```

---

## Example 3: Complete Route with Lazy Loading

```typescript
/**
 * User profile route
 * Path: /users/:userId
 */
import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';
import { SuspenseLoader } from '~components/SuspenseLoader';

const UserProfile = lazy(() =>
    import('@/features/users/components/UserProfile').then(
        (module) => ({ default: module.UserProfile })
    )
);

export const Route = createFileRoute('/users/$userId')({
    component: UserProfilePage,
    loader: ({ params }) => ({
        crumb: `User ${params.userId}`,
    }),
});

function UserProfilePage() {
    const { userId } = Route.useParams();

    return (
        <SuspenseLoader>
            <UserProfile
                userId={userId}
                onUpdate={() => console.log('Profile updated')}
            />
        </SuspenseLoader>
    );
}

export default UserProfilePage;
```

---

## Example 4: List with Search and Filtering

```typescript
import React, { useState, useMemo } from 'react';
import { useDebounce } from 'use-debounce';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { userApi } from '../api/userApi';

export const UserList: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch] = useDebounce(searchTerm, 300);

    const { data: users } = useSuspenseQuery({
        queryKey: ['users'],
        queryFn: () => userApi.getUsers(),
    });

    const filteredUsers = useMemo(() => {
        if (!debouncedSearch) return users;

        return users.filter(user =>
            user.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            user.email.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [users, debouncedSearch]);

    return (
        <div className="space-y-4">
            <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="max-w-md"
            />

            <div className="space-y-2">
                {filteredUsers.map(user => (
                    <Card key={user.id}>
                        <CardContent className="flex items-center justify-between p-4">
                            <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};
```

---

## Example 5: Form with Validation

```typescript
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { userApi } from '../api/userApi';

const userSchema = z.object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
});

type UserFormData = z.infer<typeof userSchema>;

interface CreateUserFormProps {
    onSuccess?: () => void;
}

export const CreateUserForm: React.FC<CreateUserFormProps> = ({ onSuccess }) => {
    const queryClient = useQueryClient();

    const form = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            username: '',
            email: '',
            firstName: '',
            lastName: '',
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: UserFormData) => userApi.createUser(data),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('User created successfully');
            form.reset();
            onSuccess?.();
        },

        onError: () => {
            toast.error('Failed to create user');
        },
    });

    const onSubmit = (data: UserFormData) => {
        createMutation.mutate(data);
    };

    return (
        <Card className="max-w-md">
            <CardHeader>
                <CardTitle>Create User</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
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
                                        <Input type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>First Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Last Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={createMutation.isPending}
                        >
                            {createMutation.isPending ? 'Creating...' : 'Create User'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

export default CreateUserForm;
```

---

## Example 6: Parent Container with Lazy Loading

```typescript
import React from 'react';
import { SuspenseLoader } from '~components/SuspenseLoader';

const UserList = React.lazy(() => import('./UserList'));
const UserStats = React.lazy(() => import('./UserStats'));
const ActivityFeed = React.lazy(() => import('./ActivityFeed'));

export const UserDashboard: React.FC = () => {
    return (
        <div className="p-4 space-y-4">
            <SuspenseLoader>
                <UserStats />
            </SuspenseLoader>

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-[2]">
                    <SuspenseLoader>
                        <UserList />
                    </SuspenseLoader>
                </div>

                <div className="flex-1">
                    <SuspenseLoader>
                        <ActivityFeed />
                    </SuspenseLoader>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
```

---

## Example 7: Dialog with Form

```typescript
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { UserPlus } from 'lucide-react';

const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
});

type FormData = z.infer<typeof formSchema>;

interface AddUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: FormData) => Promise<void>;
}

export const AddUserDialog: React.FC<AddUserDialogProps> = ({
    open,
    onOpenChange,
    onSubmit,
}) => {
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: '', email: '' },
    });

    const handleClose = () => {
        form.reset();
        onOpenChange(false);
    };

    const handleFormSubmit = async (data: FormData) => {
        await onSubmit(data);
        handleClose();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Add User
                    </DialogTitle>
                    <DialogDescription>
                        Enter the user's details below.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} autoFocus />
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
                                        <Input type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button type="submit">Add User</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
```

---

## Example 8: Parallel Data Fetching

```typescript
import React from 'react';
import { useSuspenseQueries } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { userApi } from '../api/userApi';
import { statsApi } from '../api/statsApi';
import { activityApi } from '../api/activityApi';

export const Dashboard: React.FC = () => {
    const [statsQuery, usersQuery, activityQuery] = useSuspenseQueries({
        queries: [
            {
                queryKey: ['stats'],
                queryFn: () => statsApi.getStats(),
            },
            {
                queryKey: ['users', 'active'],
                queryFn: () => userApi.getActiveUsers(),
            },
            {
                queryKey: ['activity', 'recent'],
                queryFn: () => activityApi.getRecent(),
            },
        ],
    });

    return (
        <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{statsQuery.data.total}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Active Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{usersQuery.data.length}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{activityQuery.data.length}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
```

---

## Example 9: Optimistic Update

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { User } from '../types';

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => userApi.toggleStatus(userId),

    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ['users'] });

      const previousUsers = queryClient.getQueryData<User[]>(['users']);

      queryClient.setQueryData<User[]>(['users'], (old) => {
        return (
          old?.map((user) => (user.id === userId ? { ...user, active: !user.active } : user)) || []
        );
      });

      toast.success('Status updated');
      return { previousUsers };
    },

    onError: (err, userId, context) => {
      queryClient.setQueryData(['users'], context?.previousUsers);
      toast.error('Failed to update status');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
```

---

## Summary

**Key Takeaways:**

1. **Component Pattern**: React.FC + lazy + Suspense + useSuspenseQuery
2. **Feature Structure**: Organized subdirectories (api/, components/, hooks/, etc.)
3. **Routing**: Folder-based with lazy loading
4. **Data Fetching**: useSuspenseQuery with cache-first strategy
5. **Forms**: React Hook Form + Zod validation + shadcn Form components
6. **Error Handling**: toast from sonner + onError callbacks
7. **Performance**: useMemo, useCallback, React.memo, debouncing
8. **Styling**: Tailwind CSS utilities + shadcn/ui components

**See other resources for detailed explanations of each pattern.**
