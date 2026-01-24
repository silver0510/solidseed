---
task: 005
name: Deal Detail Page with Tabs
analyzed: 2026-01-24T15:00:31Z
streams: 1
---

# Task 005 Analysis: Deal Detail Page with Tabs

## Scope

Build a comprehensive deal detail page with 5 tabs for viewing and editing deal information, milestones, documents, and activities.

## Work Streams

### Stream A: Deal Detail Page

**Agent Type:** frontend-development

**Files to Create:**
- `app/(dashboard)/deals/[id]/page.tsx` - Deal detail page route
- `features/deals/components/DealDetailPage.tsx` - Main detail page component
- `features/deals/components/tabs/OverviewTab.tsx` - Stage progress & financial summary
- `features/deals/components/tabs/DetailsTab.tsx` - Deal form with dynamic fields
- `features/deals/components/tabs/MilestonesTab.tsx` - Milestone timeline
- `features/deals/components/tabs/DocumentsTab.tsx` - Document upload & list
- `features/deals/components/tabs/ActivityTab.tsx` - Activity feed
- `features/deals/components/DealForm.tsx` - Dynamic form based on deal type
- `features/deals/components/MilestoneTimeline.tsx` - Timeline component
- `features/deals/components/DocumentUploader.tsx` - File upload component
- `features/deals/hooks/useDealDetail.ts` - Fetch deal with all relations
- `features/deals/hooks/useDealMutations.ts` - Update mutations

**Work:**

1. **DealDetailPage Component**:
   - shadcn/ui Tabs for navigation
   - 5 tabs: Overview, Details, Milestones, Documents, Activity
   - Responsive layout (375px+)
   - Loading states with Suspense
   - Error boundaries

2. **Overview Tab**:
   - Stage progress bar (visual pipeline)
   - Financial summary card: Deal value, commission rate, commission amount, agent commission
   - Key dates: Expected close, actual close, days in pipeline
   - Quick actions: Change stage, Mark won/lost

3. **Details Tab**:
   - DealForm with dynamic fields from `deal_type.enabled_fields`
   - Required vs optional fields
   - Enum field dropdowns
   - Inline editing with auto-save (debounced)
   - Commission recalculation on value/rate changes
   - Validation with zod

4. **Milestones Tab**:
   - MilestoneTimeline component
   - Timeline view with dates
   - Completion toggle (pending → completed)
   - Add new milestone button
   - Visual: Line connecting milestones, checkmarks for completed

5. **Documents Tab**:
   - DocumentUploader component (multipart upload)
   - Document list with download links
   - Document type badges
   - Delete confirmation dialog
   - File size validation (25MB max)

6. **Activity Tab**:
   - Activity feed (reverse chronological)
   - Filter by activity type
   - Activity type icons and colors
   - Stage change activities show old → new stage
   - "Load more" pagination

7. **Deal Creation Flow**:
   - Create route: `app/(dashboard)/deals/new/page.tsx`
   - Step 1: Select deal type
   - Step 2: Select client (or create new)
   - Step 3: Fill deal form
   - Auto-create milestones on creation

## Technical Notes

- Use React Query (useSuspenseQuery) for data fetching
- shadcn/ui Tabs, Form, Input, Select, DatePicker components
- Tailwind CSS for styling
- Mobile-first responsive design
- Optimistic updates for inline editing
- Debounce auto-save (500ms)
- File upload uses multipart/form-data
- Activity feed uses infinite scroll or pagination

## API Endpoints Used

- GET /api/deals/:id - Fetch deal with relations
- PATCH /api/deals/:id - Update deal fields
- PATCH /api/deals/:id/stage - Change stage
- GET /api/deals/:id/activities - Fetch activities
- POST /api/deals/:id/activities - Log activity
- GET /api/deals/:id/documents - List documents
- POST /api/deals/:id/documents - Upload document
- DELETE /api/deals/:id/documents/:docId - Delete document
- GET /api/deal-types - Fetch deal types for creation

## Validation Criteria

- [ ] All 5 tabs render correctly
- [ ] Dynamic form shows correct fields for deal type
- [ ] Inline editing auto-saves
- [ ] Commission recalculates on value/rate change
- [ ] Milestones can be toggled completed
- [ ] Document upload works (25MB max)
- [ ] Activity feed shows all activities
- [ ] Mobile responsive (375px+)
- [ ] Deal creation flow works end-to-end

## Estimated Time

12 hours
