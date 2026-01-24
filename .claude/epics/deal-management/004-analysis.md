---
task: 004
name: Pipeline Board with Drag-and-Drop
analyzed: 2026-01-24T14:44:03Z
streams: 1
---

# Task 004 Analysis: Pipeline Board with Drag-and-Drop

## Scope

Build a Kanban-style pipeline board component with drag-and-drop functionality for managing deals across pipeline stages.

## Work Streams

### Stream A: Pipeline Board Component

**Agent Type:** frontend-development

**Files to Create:**
- `features/deals/components/DealPipelineBoard.tsx` - Main Kanban board
- `features/deals/components/DealCard.tsx` - Individual deal card
- `features/deals/components/StageColumn.tsx` - Stage column component
- `features/deals/hooks/usePipelineDeals.ts` - Data fetching hook
- `features/deals/hooks/useDealDragDrop.ts` - Drag-and-drop logic

**Work:**

1. **Dependencies**: Install @dnd-kit/core, @dnd-kit/sortable

2. **DealPipelineBoard Component**:
   - Fetch deals grouped by stage using GET /api/deals/pipeline
   - Render stage columns horizontally
   - Deal type filter tabs at top
   - Mobile: Accordion view (< 768px)
   - Uses React Query for data management

3. **StageColumn Component**:
   - Header: Stage name, deal count, total value
   - Droppable zone for deal cards
   - Scrollable card list

4. **DealCard Component**:
   - Draggable card
   - Display: Deal name, client name, deal value, expected close date
   - Click to navigate to deal detail
   - Visual: Deal type icon, stage indicator

5. **Drag-and-Drop**:
   - Use @dnd-kit/core for DnD
   - Optimistic UI updates
   - Call PATCH /api/deals/:id/stage on drop
   - Handle errors with rollback
   - Show close/lost reason modal for terminal stages

6. **Mobile Accordion**:
   - Each stage is collapsible section
   - Deal cards stack vertically
   - Tap to expand/collapse stages

## Technical Notes

- Follow frontend-development skill patterns (Suspense, lazy loading, useSuspenseQuery)
- Use shadcn/ui components (Card, Badge, Button)
- Tailwind CSS for styling
- Mobile-first responsive design (375px+)
- Optimistic updates for smooth UX
- Error boundaries for drag-drop failures

## Validation Criteria

- [ ] Drag-and-drop works smoothly
- [ ] Stage changes persist to database
- [ ] Optimistic UI updates correctly
- [ ] Mobile accordion view at < 768px
- [ ] Deal type filters work
- [ ] Close/lost modals capture reasons
- [ ] Loading states during API calls

## Estimated Time

16 hours
