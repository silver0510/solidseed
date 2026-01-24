# Installation Instructions

## Required Dependencies

The following npm package needs to be installed for the accordion component (mobile view):

```bash
npm install @radix-ui/react-accordion
```

## Verification

After installation, verify all dependencies are installed:

```bash
npm list @dnd-kit/core @dnd-kit/sortable @radix-ui/react-accordion
```

Expected output:
```
├── @dnd-kit/core@6.3.1
├── @dnd-kit/sortable@10.0.0
└── @radix-ui/react-accordion@1.x.x
```

## Usage Example

### 1. Create a Pipeline Board Page

```tsx
// app/deals/pipeline/page.tsx
import { Suspense } from 'react';
import { DealPipelineBoard } from '@/features/deals/components';
import { Loader2 } from 'lucide-react';

function PipelineLoader() {
  return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function PipelinePage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-3xl font-bold">Deal Pipeline</h1>

      <Suspense fallback={<PipelineLoader />}>
        <DealPipelineBoard />
      </Suspense>
    </div>
  );
}
```

### 2. With Filters

```tsx
// app/deals/pipeline/page.tsx
import { Suspense } from 'react';
import { DealPipelineBoard } from '@/features/deals/components';

export default function PipelinePage({
  searchParams,
}: {
  searchParams: { dealTypeId?: string; userId?: string };
}) {
  return (
    <div className="container mx-auto p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <DealPipelineBoard
          dealTypeId={searchParams.dealTypeId}
          userId={searchParams.userId}
        />
      </Suspense>
    </div>
  );
}
```

### 3. Wrap with QueryClientProvider

Make sure your app is wrapped with React Query's QueryClientProvider:

```tsx
// app/layout.tsx or app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

## Testing

### Manual Testing Checklist

- [ ] Install @radix-ui/react-accordion
- [ ] Pipeline board loads without errors
- [ ] Desktop view shows horizontal columns
- [ ] Mobile view (< 768px) shows accordion
- [ ] Drag a deal to another stage
- [ ] Optimistic UI updates immediately
- [ ] Stage change persists after API call
- [ ] Error shows toast and rolls back
- [ ] Terminal stage (won/lost) shows modal
- [ ] Lost deal requires reason
- [ ] Click deal card navigates to detail

### Browser Testing

- Chrome (latest)
- Safari (latest)
- Firefox (latest)
- Mobile Safari (iOS)
- Mobile Chrome (Android)

## Troubleshooting

### "Cannot find module '@radix-ui/react-accordion'"

Install the missing dependency:
```bash
npm install @radix-ui/react-accordion
```

### Drag-and-drop not working

Check that:
1. DnD sensors are configured (pointer sensor with 8px activation distance)
2. DealCard uses useSortable hook
3. StageColumn uses useDroppable hook
4. DndContext wraps the columns

### API errors

Verify API endpoints are running:
```bash
curl http://localhost:3000/api/deals/pipeline
```

### TypeScript errors

Run type checking:
```bash
npm run type-check
```

## Production Checklist

Before deploying to production:

- [ ] All dependencies installed
- [ ] Type checking passes
- [ ] Build succeeds (`npm run build`)
- [ ] API endpoints tested
- [ ] Mobile responsive verified
- [ ] Drag-and-drop tested on touch devices
- [ ] Error boundaries in place
- [ ] Loading states handled
- [ ] Analytics tracking added (if applicable)
