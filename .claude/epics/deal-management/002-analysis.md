---
task: 002
name: Deal Service and API Endpoints
analyzed: 2026-01-24T14:25:23Z
streams: 2
---

# Task 002 Analysis: Deal Service and API Endpoints

## Scope

Implement the complete API layer for deal management including TypeScript types, Supabase service functions, and Next.js API routes.

## Work Streams

### Stream A: Types and Service Layer

**Files to Create:**
- `src/types/deals.ts` - All TypeScript types
- `src/lib/deals.ts` - Supabase client service functions

**Work:**
1. Create TypeScript types from epic.md lines 735-898
2. Implement service functions:
   - getDealTypes()
   - getPipelineDeals()
   - createDeal() with validation and commission calculation
   - changeDealStage() with milestone auto-creation
   - logActivity()

### Stream B: API Routes

**Files to Create:**
- `src/app/api/deals/route.ts` - POST /api/deals
- `src/app/api/deals/[id]/route.ts` - GET, PATCH, DELETE
- `src/app/api/deals/[id]/stage/route.ts` - PATCH for stage changes
- `src/app/api/deals/[id]/activities/route.ts` - POST for activities
- `src/app/api/deals/pipeline/route.ts` - GET pipeline view

**Work:**
1. Create API routes following epic.md lines 583-731
2. Implement request validation
3. Connect to service layer
4. Handle errors properly

## Technical Notes

- Use Supabase client from existing auth setup
- Commission calculation: commission_amount = deal_value * (rate/100)
- Agent commission: commission_amount * (split_percent/100)
- Stage change to 'contract'/'application' triggers auto-milestone creation
- All activities logged immutably

## Validation Criteria

- [ ] Types compile without errors
- [ ] Service functions handle all CRUD operations
- [ ] API routes return proper status codes
- [ ] Commission calculations correct
- [ ] Stage changes create activity logs
