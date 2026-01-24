---
task: 008
name: Mobile Quick Add and Responsiveness
analyzed: 2026-01-24T15:12:30Z
streams: 1
---

# Task 008 Analysis: Mobile Quick Add and Responsiveness

## Scope

Implement mobile-optimized features for rapid deal creation and management on mobile devices, ensuring the entire deal workflow completes in under 30 seconds.

## Work Streams

### Stream A: Mobile Optimizations

**Agent Type:** frontend-development

**Files to Create:**
- `features/deals/components/mobile/QuickAddFAB.tsx` - Floating action button
- `features/deals/components/mobile/QuickAddSheet.tsx` - Bottom sheet form
- `features/deals/components/mobile/SwipeableCard.tsx` - Card with swipe gestures
- `features/deals/hooks/useDealQuickAdd.ts` - Quick add logic
- `features/deals/hooks/useSwipeGesture.ts` - Swipe gesture handler

**Files to Modify:**
- `features/deals/components/DealPipelineBoard.tsx` - Add FAB and swipe to cards
- `features/deals/components/DealCard.tsx` - Add swipe gesture support
- `features/deals/components/DealDetailPage.tsx` - Ensure mobile responsiveness

**Work:**

1. **Floating Action Button (FAB)**:
   - Fixed position bottom-right on pipeline page
   - Only visible on mobile (< 768px)
   - Opens QuickAddSheet on tap
   - Material design style with shadow
   - "+" icon

2. **Quick Add Bottom Sheet**:
   - Slides up from bottom
   - Minimal form with only essential fields:
     - Deal type selector (required)
     - Client selector with search (required)
     - Address/property field with voice-to-text button
     - Deal value (number input)
     - Photo upload button (optional)
   - Auto-generate deal name: "{address} - {client}" or "{amount} - {client}"
   - Default expected_close_date to +30 days from now
   - Submit creates deal and navigates to detail page
   - Target: < 30 second completion time

3. **Voice-to-Text Integration**:
   - Button next to address field
   - Uses Web Speech API (browser native)
   - Microphone icon with recording indicator
   - Transcribes directly into address field
   - Fallback for unsupported browsers

4. **Photo Upload Button**:
   - Opens camera on mobile devices
   - Accepts photo from gallery as fallback
   - Compresses image to < 5MB
   - Uploads to deal documents with type "photo"
   - Shows preview before upload

5. **Swipe Gestures for Stage Changes**:
   - Swipe right on deal card → advance to next stage
   - Swipe left on deal card → retreat to previous stage
   - Visual feedback during swipe (arrow indicators)
   - Confirmation for terminal stages (won/lost)
   - Only enabled on mobile (< 768px)
   - Uses touch events API

6. **Mobile Responsiveness Verification**:
   - Pipeline accordion works at 375px width
   - Deal detail tabs scroll horizontally on mobile
   - All forms fit within 375px viewport
   - No horizontal overflow
   - Touch targets at least 44px (Apple HIG)

## Technical Notes

- Use React Hook Form for quick add form (lightweight)
- shadcn/ui Sheet component for bottom sheet
- Web Speech API for voice-to-text (check browser support)
- Touch events for swipe gestures (prevent scroll during swipe)
- CSS media queries: `@media (max-width: 768px)`
- Haptic feedback on successful swipe (if available)
- Optimistic UI updates for instant feedback

## Validation Criteria

- [ ] FAB appears on mobile pipeline page
- [ ] Quick add sheet opens on FAB tap
- [ ] Voice-to-text works in supported browsers
- [ ] Photo upload compresses and uploads
- [ ] Swipe right advances stage
- [ ] Swipe left retreats stage
- [ ] Deal creation completes in < 30 seconds
- [ ] Pipeline accordion works at 375px
- [ ] Detail page tabs scroll horizontally
- [ ] No horizontal overflow on mobile

## Performance Targets

- **Quick add form load**: < 500ms
- **Photo upload**: < 3 seconds
- **Voice transcription**: Real-time
- **Swipe gesture response**: < 100ms (60fps)
- **Total deal creation**: < 30 seconds (from FAB tap to saved)

## Estimated Time

8 hours
