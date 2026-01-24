---
task: 007
name: Client Integration Widget
analyzed: 2026-01-24T14:44:03Z
streams: 1
---

# Task 007 Analysis: Client Integration Widget

## Scope

Add "Active Deals" widget to client detail page and deal-related filters to client list view.

## Work Streams

### Stream A: Client Integration

**Agent Type:** frontend-development

**Files to Create:**
- `features/clients/components/ClientDealsWidget.tsx` - Active deals widget
- `features/clients/components/DealBadge.tsx` - Deal count badge
- `features/clients/hooks/useClientDeals.ts` - Fetch deals for client

**Files to Modify:**
- `features/clients/components/ClientDetailPage.tsx` - Add widget
- `features/clients/components/ClientList.tsx` - Add filter and badges
- `features/clients/components/ClientCard.tsx` - Add deal count badge

**Work:**

1. **ClientDealsWidget Component**:
   - Displays active deals for a client
   - Shows: Deal name, type icon, stage badge, value, expected close date
   - Limit to 10 deals max
   - "View All Deals" link (navigates to deal list filtered by client)
   - "Add Deal" button (navigates to create deal with client_id pre-filled)
   - Click deal to navigate to deal detail page
   - Empty state: "No active deals" with "Add Deal" CTA

2. **DealBadge Component**:
   - Shows deal count on client card
   - Color-coded:
     - Green: 1-2 deals
     - Amber: 3-5 deals
     - Red: 6+ deals
   - Small circular badge with number
   - Position: Top-right corner of client card

3. **Client List Filter**:
   - Add "Has Active Deals" checkbox to filters
   - Filter clients with at least one active deal (status = 'active')
   - Update client cards to show deal count badge

4. **Integration Points**:
   - Add widget to ClientDetailPage (below client info, above documents)
   - Query deals by client_id: GET /api/deals?client_id={id}&status=active
   - Navigate to `/deals/new?client_id={id}` for "Add Deal"
   - Navigate to `/deals?client_id={id}` for "View All Deals"
   - Navigate to `/deals/{dealId}` when clicking deal

## Technical Notes

- Use React Query for data fetching
- Cache client deals data (5 min stale time)
- Use shadcn/ui Badge, Card components
- Deal type icons from existing icon set
- Stage badges use existing stage color coding
- Mobile-responsive (375px+)

## Validation Criteria

- [ ] Widget displays client's active deals
- [ ] "Add Deal" pre-fills client_id
- [ ] "View All Deals" filters by client
- [ ] Deal count badge appears on client cards
- [ ] Badge colors correctly (green/amber/red)
- [ ] "Has Active Deals" filter works
- [ ] Empty state shows when no deals
- [ ] Click deal navigates to detail

## Estimated Time

4 hours
