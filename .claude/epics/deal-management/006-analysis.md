---
task: 006
name: Deal List View with Filtering
analyzed: 2026-01-24T14:44:03Z
streams: 1
---

# Task 006 Analysis: Deal List View with Filtering

## Scope

Build a table-based list view for deals with sorting, filtering, inline editing, pagination, and CSV export.

## Work Streams

### Stream A: List View Component

**Agent Type:** frontend-development

**Files to Create:**
- `features/deals/components/DealListView.tsx` - Main table view
- `features/deals/components/DealFilters.tsx` - Filter controls
- `features/deals/components/ViewToggle.tsx` - Kanban/List toggle
- `features/deals/hooks/useDealFilters.ts` - Filter state management
- `features/deals/utils/exportDealsToCSV.ts` - CSV export utility

**Work:**

1. **DealListView Component**:
   - Data table with columns: Deal Name, Client, Type, Stage, Value, Expected Close, Days in Pipeline
   - Sortable columns (click header to sort)
   - Inline stage dropdown for quick changes
   - Pagination: 50 rows per page
   - Mobile: Card view (< 768px) stacked vertically

2. **DealFilters Component**:
   - Deal Type multi-select
   - Stage multi-select
   - Status radio (All, Active, Closed Won, Closed Lost)
   - Date range picker (expected close date)
   - Assigned Agent filter
   - "Clear All Filters" button

3. **ViewToggle Component**:
   - Toggle between Kanban (board) and List (table) views
   - Persist preference in localStorage
   - Icon buttons with labels

4. **CSV Export**:
   - Export button above table
   - Applies current filters
   - Max 1000 rows
   - Columns: All visible columns plus additional metadata
   - Filename: `deals-export-${date}.csv`

5. **Sorting**:
   - Click column header to sort ascending
   - Click again for descending
   - Visual indicator (arrow icon)

6. **Mobile Card View**:
   - Each deal as a card
   - Show: Deal name, client, stage badge, value
   - Tap to expand for more details
   - Inline stage change still available

## Technical Notes

- Use shadcn/ui Table component
- TanStack Table for sorting/filtering
- React Query for data fetching
- Debounce filter inputs (300ms)
- URL params for filter state (shareable links)
- CSV export uses Papa Parse library

## Validation Criteria

- [ ] Table displays all deal fields
- [ ] Sorting works on all columns
- [ ] Filters apply correctly
- [ ] Pagination works (50 per page)
- [ ] CSV export downloads filtered data
- [ ] Mobile card view at < 768px
- [ ] View toggle persists preference
- [ ] Inline stage editing works

## Estimated Time

8 hours
