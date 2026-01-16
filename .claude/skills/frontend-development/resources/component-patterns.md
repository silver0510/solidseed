# Component Patterns

Modern React component architecture for the application emphasizing type safety, lazy loading, and Suspense boundaries.

---

## React.FC Pattern (PREFERRED)

### Why React.FC

All components use the `React.FC<Props>` pattern for:

- Explicit type safety for props
- Consistent component signatures
- Clear prop interface documentation
- Better IDE autocomplete

### Basic Pattern

```typescript
import React from 'react';

interface MyComponentProps {
    /** User ID to display */
    userId: number;
    /** Optional callback when action occurs */
    onAction?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ userId, onAction }) => {
    return (
        <div>
            User: {userId}
        </div>
    );
};

export default MyComponent;
```

**Key Points:**

- Props interface defined separately with JSDoc comments
- `React.FC<Props>` provides type safety
- Destructure props in parameters
- Default export at bottom

---

## Lazy Loading Pattern

### When to Lazy Load

Lazy load components that are:

- Heavy (DataGrid, charts, rich text editors)
- Route-level components
- Modal/dialog content (not shown initially)
- Below-the-fold content

### How to Lazy Load

```typescript
import React from 'react';

// Lazy load heavy component
const PostDataGrid = React.lazy(() => import('./grids/PostDataGrid'));

// For named exports
const MyComponent = React.lazy(() =>
  import('./MyComponent').then((module) => ({
    default: module.MyComponent,
  }))
);
```

**Example from PostTable.tsx:**

```typescript
/**
 * Main post table container component
 */
import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';

// Lazy load PostDataGrid to optimize bundle size
const PostDataGrid = React.lazy(() => import('./grids/PostDataGrid'));

import { SuspenseLoader } from '~components/SuspenseLoader';

export const PostTable: React.FC<PostTableProps> = ({ formId }) => {
    return (
        <div>
            <SuspenseLoader>
                <PostDataGrid formId={formId} />
            </SuspenseLoader>
        </div>
    );
};

export default PostTable;
```

---

## Suspense Boundaries

### SuspenseLoader Component

**Import:**

```typescript
import { SuspenseLoader } from '~components/SuspenseLoader';
// Or
import { SuspenseLoader } from '@/components/SuspenseLoader';
```

**Usage:**

```typescript
<SuspenseLoader>
    <LazyLoadedComponent />
</SuspenseLoader>
```

**What it does:**

- Shows loading indicator while lazy component loads
- Smooth fade-in animation
- Consistent loading experience
- Prevents layout shift

### Where to Place Suspense Boundaries

**Route Level:**

```typescript
// routes/my-route/index.tsx
const MyPage = lazy(() => import('@/features/my-feature/components/MyPage'));

function Route() {
    return (
        <SuspenseLoader>
            <MyPage />
        </SuspenseLoader>
    );
}
```

**Component Level:**

```typescript
function ParentComponent() {
    return (
        <div>
            <Header />
            <SuspenseLoader>
                <HeavyDataGrid />
            </SuspenseLoader>
        </div>
    );
}
```

**Multiple Boundaries:**

```typescript
function Page() {
    return (
        <div className="space-y-6">
            <SuspenseLoader>
                <HeaderSection />
            </SuspenseLoader>

            <SuspenseLoader>
                <MainContent />
            </SuspenseLoader>

            <SuspenseLoader>
                <Sidebar />
            </SuspenseLoader>
        </div>
    );
}
```

Each section loads independently, better UX.

---

## Component Structure Template

### Recommended Order

```typescript
/**
 * Component description
 * What it does, when to use it
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Feature imports
import { myFeatureApi } from '../api/myFeatureApi';
import type { MyData } from '~types/myData';

// Component imports
import { SuspenseLoader } from '~components/SuspenseLoader';

// Hooks
import { useAuth } from '@/hooks/useAuth';

// 1. PROPS INTERFACE (with JSDoc)
interface MyComponentProps {
    /** The ID of the entity to display */
    entityId: number;
    /** Optional callback when action completes */
    onComplete?: () => void;
    /** Display mode */
    mode?: 'view' | 'edit';
}

// 2. COMPONENT DEFINITION
export const MyComponent: React.FC<MyComponentProps> = ({
    entityId,
    onComplete,
    mode = 'view',
}) => {
    // 3. HOOKS (in this order)
    // - Context hooks first
    const { user } = useAuth();

    // - Data fetching
    const { data } = useSuspenseQuery({
        queryKey: ['myEntity', entityId],
        queryFn: () => myFeatureApi.getEntity(entityId),
    });

    // - Local state
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(mode === 'edit');

    // - Memoized values
    const filteredData = useMemo(() => {
        return data.filter(item => item.active);
    }, [data]);

    // - Effects
    useEffect(() => {
        // Setup
        return () => {
            // Cleanup
        };
    }, []);

    // 4. EVENT HANDLERS (with useCallback)
    const handleItemSelect = useCallback((itemId: string) => {
        setSelectedItem(itemId);
    }, []);

    const handleSave = useCallback(async () => {
        try {
            await myFeatureApi.updateEntity(entityId, { /* data */ });
            toast.success('Entity updated successfully');
            onComplete?.();
        } catch (error) {
            toast.error('Failed to update entity');
        }
    }, [entityId, onComplete]);

    // 5. RENDER
    return (
        <div className="p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">My Component</h2>
                <Button onClick={handleSave}>Save</Button>
            </div>

            <Card>
                <CardContent className="p-4">
                    {filteredData.map(item => (
                        <div key={item.id}>{item.name}</div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
};

// 6. EXPORT (default export at bottom)
export default MyComponent;
```

---

## Component Separation

### When to Split Components

**Split into multiple components when:**

- Component exceeds 300 lines
- Multiple distinct responsibilities
- Reusable sections
- Complex nested JSX

**Example:**

```typescript
// ❌ AVOID - Monolithic
function MassiveComponent() {
    // 500+ lines
    // Search logic
    // Filter logic
    // Grid logic
    // Action panel logic
}

// ✅ PREFERRED - Modular
function ParentContainer() {
    return (
        <div className="space-y-4">
            <SearchAndFilter onFilter={handleFilter} />
            <DataGrid data={filteredData} />
            <ActionPanel onAction={handleAction} />
        </div>
    );
}
```

### When to Keep Together

**Keep in same file when:**

- Component < 200 lines
- Tightly coupled logic
- Not reusable elsewhere
- Simple presentation component

---

## Export Patterns

### Named Const + Default Export (PREFERRED)

```typescript
export const MyComponent: React.FC<Props> = ({ ... }) => {
    // Component logic
};

export default MyComponent;
```

**Why:**

- Named export for testing/refactoring
- Default export for lazy loading convenience
- Both options available to consumers

### Lazy Loading Named Exports

```typescript
const MyComponent = React.lazy(() =>
  import('./MyComponent').then((module) => ({
    default: module.MyComponent,
  }))
);
```

---

## Component Communication

### Props Down, Events Up

```typescript
// Parent
function Parent() {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    return (
        <Child
            data={data}                    // Props down
            onSelect={setSelectedId}       // Events up
        />
    );
}

// Child
interface ChildProps {
    data: Data[];
    onSelect: (id: string) => void;
}

export const Child: React.FC<ChildProps> = ({ data, onSelect }) => {
    return (
        <div onClick={() => onSelect(data[0].id)}>
            {/* Content */}
        </div>
    );
};
```

### Avoid Prop Drilling

**Use context for deep nesting:**

```typescript
// ❌ AVOID - Prop drilling 5+ levels
<A prop={x}>
  <B prop={x}>
    <C prop={x}>
      <D prop={x}>
        <E prop={x} />  // Finally uses it here
      </D>
    </C>
  </B>
</A>

// ✅ PREFERRED - Context or TanStack Query
const MyContext = createContext<MyData | null>(null);

function Provider({ children }) {
    const { data } = useSuspenseQuery({ ... });
    return <MyContext.Provider value={data}>{children}</MyContext.Provider>;
}

function DeepChild() {
    const data = useContext(MyContext);
    // Use data directly
}
```

---

## Advanced Patterns

### Compound Components

```typescript
// CustomCard.tsx
export const CustomCard: React.FC<CardProps> & {
    Header: typeof CardHeader;
    Body: typeof CardBody;
    Footer: typeof CardFooter;
} = ({ children, className }) => {
    return <div className={cn('rounded-lg border bg-card shadow-sm', className)}>{children}</div>;
};

CustomCard.Header = CardHeader;
CustomCard.Body = CardBody;
CustomCard.Footer = CardFooter;

// Usage
<CustomCard>
    <CustomCard.Header>Title</CustomCard.Header>
    <CustomCard.Body>Content</CustomCard.Body>
    <CustomCard.Footer>Actions</CustomCard.Footer>
</CustomCard>
```

### Render Props (Rare, but useful)

```typescript
interface DataProviderProps {
    children: (data: Data) => React.ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
    const { data } = useSuspenseQuery({ ... });
    return <>{children(data)}</>;
};

// Usage
<DataProvider>
    {(data) => <Display data={data} />}
</DataProvider>
```

---

## Summary

**Modern Component Recipe:**

1. `React.FC<Props>` with TypeScript
2. Lazy load if heavy: `React.lazy(() => import())`
3. Wrap in `<SuspenseLoader>` for loading
4. Use `useSuspenseQuery` for data
5. Import aliases (@/, ~types, ~components)
6. Event handlers with `useCallback`
7. Default export at bottom
8. No early returns for loading states

**See Also:**

- [data-fetching.md](data-fetching.md) - useSuspenseQuery details
- [loading-and-error-states.md](loading-and-error-states.md) - Suspense best practices
- [complete-examples.md](complete-examples.md) - Full working examples
