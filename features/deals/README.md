# Deals Feature

Pipeline board with drag-and-drop for managing deals across stages.

## Components

### DealPipelineBoard
Main Kanban-style board component with drag-and-drop functionality.

**Usage:**
```tsx
import { DealPipelineBoard } from '@/features/deals/components';

<Suspense fallback={<Loader />}>
  <DealPipelineBoard dealTypeId="dt_123" userId="user_123" />
</Suspense>
```

**Props:**
- `dealTypeId?: string` - Filter deals by type
- `userId?: string` - Filter deals by assigned user

**Features:**
- Desktop: Horizontal stage columns with drag-and-drop
- Mobile: Accordion view (< 768px)
- Pipeline summary (total value, commission, active deals)
- Terminal stage modals for won/lost deals
- Optimistic UI updates

### DealCard
Individual deal card component with draggable functionality.

**Features:**
- Shows deal name, client, value, expected close date
- Deal type badge with icon
- Days in pipeline indicator
- Click to navigate to deal detail
- Drag visual feedback

### StageColumn
Column component for each pipeline stage.

**Features:**
- Stage header with name, count, total value
- Droppable zone for deal cards
- Scrollable card list
- Empty state handling
- Visual feedback on drag over

## Hooks

### usePipelineDeals
React Query hook for fetching pipeline data.

**Usage:**
```tsx
import { usePipelineDeals } from '@/features/deals/hooks';

const { data, refetch } = usePipelineDeals({
  dealTypeId: 'dt_123',
  assignedTo: 'user_123',
});
```

**Returns:**
```typescript
{
  data: PipelineResponse;
  refetch: () => void;
  isLoading: boolean;
  error: Error | null;
}
```

### useDealDragDrop
Hook for managing drag-and-drop logic.

**Usage:**
```tsx
import { useDealDragDrop } from '@/features/deals/hooks';

const {
  handleDragEnd,
  terminalStageModal,
  closeTerminalModal,
  confirmTerminalStage
} = useDealDragDrop();

<DndContext onDragEnd={handleDragEnd}>
  {/* ... */}
</DndContext>
```

**Features:**
- Optimistic UI updates
- Stage change API calls
- Error handling with rollback
- Terminal stage modal state
- Toast notifications

## API Integration

The components integrate with these API endpoints:

- **GET /api/deals/pipeline** - Fetch deals grouped by stage
  - Query params: `deal_type_id`, `assigned_to`, `limit`
  - Returns: `{ stages: PipelineStageData[], summary: PipelineSummary }`

- **PATCH /api/deals/:id/stage** - Change deal stage
  - Body: `{ new_stage: string, lost_reason?: string }`
  - Returns: Updated deal

## Installation

### Dependencies

The @dnd-kit packages are already installed. You need to install the accordion component:

```bash
npm install @radix-ui/react-accordion
```

### Files Created

```
features/deals/
├── components/
│   ├── DealCard.tsx
│   ├── StageColumn.tsx
│   ├── DealPipelineBoard.tsx
│   └── index.ts
└── hooks/
    ├── usePipelineDeals.ts
    ├── useDealDragDrop.ts
    └── index.ts

components/ui/
└── accordion.tsx (new)
```

## Mobile Support

The pipeline board automatically switches to accordion view on screens < 768px:

- Desktop: Horizontal columns with drag-and-drop
- Mobile: Vertical accordion with collapsible stages
- Each stage expands to show deal cards
- No drag-and-drop on mobile (tap to expand/navigate)

## Styling

All components use:
- Tailwind CSS for styling
- shadcn/ui components (Card, Badge, Button, Dialog, etc.)
- Mobile-first responsive design (375px+ width)
- Consistent color scheme from deal types

## Error Handling

- Network errors show toast notifications
- Failed drag operations rollback optimistically updated UI
- Suspense boundaries handle loading states
- Error boundaries catch component errors

## Next Steps

1. Install @radix-ui/react-accordion
2. Test with real API endpoints
3. Add unit tests for components
4. Add integration tests for drag-and-drop
5. Fine-tune mobile styling
6. Add deal type filter tabs
7. Add bulk actions (assign, delete, export)
