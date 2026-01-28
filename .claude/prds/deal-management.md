---
name: deal-management
description: Multi-type deal pipeline system for tracking real estate and mortgage transactions from lead to close
status: backlog
created: 2026-01-22T15:45:34Z
updated: 2026-01-28T03:31:45Z
---

# Deal Management

## Overview

**Purpose**: Enable real estate agents and loan officers to track transactions through customizable pipelines, managing deals from initial lead through successful closing. The system supports multiple deal types (residential sales, mortgage loans) with type-specific fields, automated milestone tracking, and commission calculations, replacing spreadsheet-based workflows with a centralized mobile-friendly platform.

**Target Users**:

- Real estate agents - Track residential property sales from showing through closing, manage multiple deals simultaneously, calculate commissions
- Loan officers - Track mortgage applications through underwriting and funding, manage loan pipelines, monitor approval milestones

**Business Value**:

- Increased agent productivity through centralized deal tracking (replacing spreadsheets and external tools)
- Higher close rates through systematic milestone tracking and follow-up reminders
- Accurate commission forecasting for financial planning
- Foundation for future monetization (premium deal types, workflow automation)

## Scope

### In Scope

- Two fixed deal types: Residential Sale and Mortgage Loan
- Visual pipeline board (Kanban) with drag-and-drop stage management
- Type-specific fields stored flexibly (JSONB) for future extensibility
- Automated milestone creation based on deal type and stage
- Document upload and management per deal
- Activity timeline logging all deal changes
- Commission calculation and tracking
- Deal-to-client linking (required relationship)
- Mobile-responsive web interface with quick deal creation
- Basic reporting (pipeline value, expected commissions, deal velocity)
- Single owner per deal (assigned_to agent/loan officer)
- Deal list view (alternative to Kanban) with sorting and filtering

### Out of Scope

- Custom deal type creation by users (V2 feature)
- Team collaboration features (multiple owners, comments, @mentions)
- Native mobile apps (iOS/Android)
- Email integration and automatic activity logging
- Calendar synchronization
- External integrations (MLS, DocuSign, title companies)
- Workflow automation and triggers
- Advanced reporting and custom report builder
- Deal templates
- Bulk operations (bulk stage updates, bulk delete)
- Commercial lease and investment deal types (V2)

### Success Criteria

- [ ] Users can create both residential sale and mortgage loan deals with appropriate fields
- [ ] Pipeline board displays all deals organized by stage with drag-and-drop functionality
- [ ] Stage changes automatically log activities and update deal status
- [ ] Milestones auto-create when deals reach specific stages (e.g., "Under Contract")
- [ ] Commission calculations automatically update when deal value or rates change
- [ ] Documents can be uploaded and associated with specific deals
- [ ] Mobile users can create and update deals in under 30 seconds
- [ ] Deal detail page renders correctly on 375px mobile screens
- [ ] Pipeline reports show accurate value totals by stage
- [ ] Deals appear in client profile "Active Deals" widget

## Functional Requirements

### Feature Group 1: Deal Type System

**Description**: Configurable deal type templates defining pipeline stages, required fields, and default milestones for each transaction type.

#### Requirement 1.0: Deal Type Onboarding

- **User Story**: As a new user, I want to select which deal types I work with during onboarding so that my dashboard shows only relevant deals
- **Acceptance Criteria**:
  - [ ] After email verification (before dashboard access), show onboarding screen: "What type of deals do you work with?"
  - [ ] Two checkboxes displayed: "Residential Sales" and "Mortgage Loans"
  - [ ] Both checkboxes checked by default
  - [ ] Require at least one selection to continue
  - [ ] Note displayed: "You can change this later in Deal Settings"
  - [ ] Continue button saves preferences and redirects to dashboard
  - [ ] User preferences stored in `user_deal_preferences` table or `users.enabled_deal_types` JSONB field
  - [ ] Dashboard filters deal types based on saved preferences
  - [ ] Deal Settings page allows toggling deal types with same note
- **Business Rules**:
  - At least one deal type must be enabled at all times
  - First-time users see onboarding screen only once
  - Returning users (after logout) skip onboarding
  - If only one deal type enabled, dashboard defaults to filtered view
  - If both enabled, dashboard shows both types with tabs/filters

#### Requirement 1.1: Deal Type Configuration Storage

- **User Story**: As a system administrator, I want deal types stored in a configuration table so that each type can have custom pipelines and fields
- **Acceptance Criteria**:
  - [ ] `deal_types` table exists with fields: type_code, type_name, icon, color, pipeline_stages (JSONB), enabled_fields (JSONB), default_milestones (JSONB)
  - [ ] Two seed records exist: "residential_sale" and "mortgage"
  - [ ] Pipeline stages JSONB contains array of stage objects with code, name, order
  - [ ] Enabled fields JSONB defines which fields are required/optional/visible for each type
  - [ ] Default milestones JSONB defines milestone templates with offset days
- **Business Rules**:
  - Deal types with `is_system = true` cannot be deleted by users
  - `type_code` must be unique and kebab-case format
  - Pipeline stages must have sequential order values (1, 2, 3, etc.)

#### Requirement 1.2: Residential Sale Deal Type

- **User Story**: As a real estate agent, I want a residential sale deal type with property-specific fields so that I can track home sales
- **Acceptance Criteria**:
  - [ ] Pipeline stages: lead, qualifying, showing, offer, contract, closing, closed, lost (8 stages)
  - [ ] Required fields: property_address, deal_side, listing_price
  - [ ] Optional fields: property_type, bedrooms, bathrooms, square_feet, mls_number, sale_price, financing_type, lender_name, year_built, lot_size
  - [ ] Default milestones: inspection (10 days), appraisal (14 days), financing_approval (21 days), final_walkthrough (28 days), closing (30 days)
  - [ ] Icon: "home", Color: "#3B82F6" (blue)
- **Business Rules**:
  - Deal_side must be one of: buyer_side, seller_side, dual_agency
  - Property_type must be one of: single_family, condo, townhouse, multi_family, land
  - Sale_price only editable after deal reaches "contract" stage
  - Milestones auto-create when deal moves to "contract" stage

#### Requirement 1.3: Mortgage Loan Deal Type

- **User Story**: As a loan officer, I want a mortgage loan deal type with lending-specific fields so that I can track loan applications through funding
- **Acceptance Criteria**:
  - [ ] Pipeline stages: lead, prequalification, application, processing, underwriting, approval, closing, funded (8 stages)
  - [ ] Required fields: loan_amount, loan_type, loan_purpose, property_address
  - [ ] Optional fields: purchase_price, down_payment, down_payment_percent, interest_rate, loan_term_years, credit_score, debt_to_income_ratio, employment_type, lender_name, loan_officer, estimated_closing_costs
  - [ ] Default milestones: credit_pull (1 day), appraisal_ordered (5 days), appraisal_complete (12 days), underwriting_complete (21 days), clear_to_close (28 days), closing_scheduled (35 days)
  - [ ] Icon: "calculator", Color: "#10B981" (green)
- **Business Rules**:
  - Loan_type must be one of: conventional, fha, va, usda, jumbo, heloc, other
  - Loan_purpose must be one of: purchase, refinance, cash_out_refinance, construction
  - Loan_term_years must be one of: 15, 20, 25, 30
  - Employment_type must be one of: w2, self_employed, retired, other
  - Milestones auto-create when deal moves to "application" stage
  - Down_payment_percent auto-calculates if down_payment and purchase_price both provided

### Feature Group 2: Deal CRUD Operations

**Description**: Core functionality for creating, reading, updating, and deleting deals with proper validation and permissions.

#### Requirement 2.1: Create Deal

- **User Story**: As an agent/loan officer, I want to create a new deal linked to a client so that I can start tracking a transaction
- **Acceptance Criteria**:
  - [ ] Create deal form presents deal type selection as first step
  - [ ] Form dynamically renders fields based on selected deal type's enabled_fields configuration
  - [ ] Required fields are validated before submission
  - [ ] Client selection is required (searchable dropdown of existing clients)
  - [ ] Deal name auto-generates as "{property_address/loan_amount} - {client_name}" if not provided
  - [ ] Created_by and assigned_to default to current user
  - [ ] Initial stage defaults to first stage in deal type's pipeline
  - [ ] Status defaults to "active"
  - [ ] Deal_data JSONB populated with type-specific fields
  - [ ] Success message displays with link to view created deal
- **Business Rules**:
  - Must have valid user authentication token
  - Client_id must reference existing non-deleted client
  - Deal_type_id must reference active deal type
  - Commission_rate must be between 0 and 100
  - Expected_close_date must be in the future (warning if past)

#### Requirement 2.2: View Deal Details

- **User Story**: As an agent/loan officer, I want to view comprehensive deal information so that I can understand the current state and history
- **Acceptance Criteria**:
  - [ ] Deal detail page renders with 5 tabs: Overview, Details, Milestones, Documents, Activity
  - [ ] Overview tab shows: stage progress bar, financial summary, key dates, quick actions
  - [ ] Details tab shows: all deal fields in editable form, organized by section
  - [ ] Milestones tab shows: timeline view of upcoming and completed milestones
  - [ ] Documents tab shows: uploaded files with download links
  - [ ] Activity tab shows: chronological log of all changes
  - [ ] Page header displays: deal name, client link, stage badge, assigned agent
  - [ ] Mobile view (375px+) stacks sections vertically
- **Business Rules**:
  - Only assigned_to user or users with "view_all_deals" permission can view
  - Soft-deleted deals show "Archived" badge and read-only

#### Requirement 2.3: Update Deal

- **User Story**: As an agent/loan officer, I want to update deal information so that I can keep records current
- **Acceptance Criteria**:
  - [ ] Deal fields are editable inline on Details tab
  - [ ] Changes auto-save on field blur with visual confirmation
  - [ ] Required field validation prevents saving invalid data
  - [ ] Updated_at timestamp updates on any field change
  - [ ] Field changes log activity: "Updated {field_name} from {old} to {new}"
  - [ ] Commission amounts recalculate automatically when deal_value or rates change
  - [ ] Optimistic UI updates with rollback on error
- **Business Rules**:
  - Only assigned_to user or admin can update deal
  - Cannot change deal_type_id after creation
  - Cannot change client_id if milestones or documents exist (integrity)
  - Stage changes must go through dedicated stage change endpoint (not direct update)

#### Requirement 2.4: Delete Deal (Soft Delete)

- **User Story**: As an agent/loan officer, I want to delete incorrect deals so that my pipeline stays clean
- **Acceptance Criteria**:
  - [ ] Delete action requires confirmation modal: "Delete {deal_name}? This cannot be undone."
  - [ ] Sets is_deleted = true rather than hard delete
  - [ ] Soft-deleted deals excluded from pipeline board and reports
  - [ ] Soft-deleted deals cascade: milestones, documents, activities also soft-deleted
  - [ ] Deleted deals appear in "Archived Deals" view (admin only)
  - [ ] Success message: "Deal deleted successfully"
- **Business Rules**:
  - Only assigned_to user or admin can delete
  - Deals with status "closed_won" require additional confirmation
  - Deletion logs activity: "Deal deleted by {user_name}"

### Feature Group 3: Pipeline Management

**Description**: Visual Kanban board for managing deals through pipeline stages with drag-and-drop functionality.

#### Requirement 3.1: Pipeline Board Display

- **User Story**: As an agent/loan officer, I want to see all my deals organized by stage so that I can manage my pipeline visually
- **Acceptance Criteria**:
  - [ ] Board displays horizontal columns for each stage in current deal type
  - [ ] Column headers show: stage name, deal count, total value
  - [ ] Deal cards display: deal name, client name, deal value, days in stage, assigned agent
  - [ ] Cards color-coded by deal type
  - [ ] Empty states show: "No deals in {stage}" with "Add Deal" button
  - [ ] Board filters: deal type tabs, "My Deals" vs "Team Deals", date range, assigned agent
  - [ ] Board loads deals with pagination (20 per stage initially, infinite scroll)
  - [ ] Mobile view (< 768px) shows vertical accordion with expandable stages
- **Business Rules**:
  - Default view shows only current user's deals (assigned_to = current_user)
  - Only shows deals with is_deleted = false
  - Stages ordered by pipeline_stages.order from deal type configuration
  - Deal count and total value exclude soft-deleted deals

#### Requirement 3.2: Drag-and-Drop Stage Change

- **User Story**: As an agent/loan officer, I want to drag deals between stages so that I can quickly update pipeline status
- **Acceptance Criteria**:
  - [ ] Deal cards are draggable within Kanban columns
  - [ ] Drop zones highlight when dragging over valid column
  - [ ] Dropping card updates current_stage immediately (optimistic UI)
  - [ ] Stage change logs activity: "Moved from {old_stage} to {new_stage}"
  - [ ] If move fails, card returns to original column with error toast
  - [ ] Moving to "closed" or "lost" stages triggers additional modal (see 3.3)
  - [ ] Touch devices support drag-and-drop with long-press
- **Business Rules**:
  - Can only drag own deals (assigned_to = current_user) unless admin
  - Cannot drag deals to stages not in current deal type's pipeline
  - Stage change updates updated_at timestamp
  - Moving to "contract" stage (residential) auto-creates milestones
  - Moving to "application" stage (mortgage) auto-creates milestones

#### Requirement 3.3: Closing and Losing Deals

- **User Story**: As an agent/loan officer, I want to mark deals as won or lost so that I can track outcomes
- **Acceptance Criteria**:
  - [ ] Moving deal to "Closed Won" stage triggers modal: "Confirm closing details"
  - [ ] Modal prompts for: actual_close_date (defaults to today), sale_price/final_loan_amount
  - [ ] Confirmation sets status = "closed_won", closed_at = NOW()
  - [ ] Moving deal to "Closed Lost" stage triggers modal: "Why was this deal lost?"
  - [ ] Modal requires lost_reason text field (min 10 characters)
  - [ ] Confirmation sets status = "closed_lost", closed_at = NOW()
  - [ ] Closed deals removed from pipeline board (moved to "Closed Deals" archive)
  - [ ] Cancelling modal returns card to previous stage
- **Business Rules**:
  - Actual_close_date must be <= today (cannot be future)
  - Closed deals are immutable (require admin to reopen)
  - Lost_reason required for analytics (cannot skip)
  - Days_in_pipeline frozen at close (closed_at - created_at)

#### Requirement 3.4: Deal List View

- **User Story**: As an agent/loan officer, I want a table view of deals so that I can sort and filter data quickly
- **Acceptance Criteria**:
  - [ ] Toggle button switches between Kanban and List view
  - [ ] Table columns: deal name, client, type (icon), stage, value, expected close, days in pipeline, assigned to
  - [ ] All columns sortable (ascending/descending)
  - [ ] Filters: deal type, stage, date range, assigned agent, status
  - [ ] Inline editing: click stage cell shows dropdown to change stage
  - [ ] Pagination: 50 rows per page with page navigation
  - [ ] Export button downloads CSV of filtered results
  - [ ] Mobile view (< 768px) shows cards instead of table
- **Business Rules**:
  - Default sort: expected_close_date ascending (soonest first)
  - CSV export limited to 1000 rows
  - Inline stage change follows same rules as drag-and-drop
  - Export filename format: "deals*export*{YYYY-MM-DD}.csv"

### Feature Group 4: Milestones & Timeline

**Description**: Track key dates and events in the deal lifecycle with automated milestone creation and status management.

#### Requirement 4.1: Milestone Auto-Creation

- **User Story**: As an agent/loan officer, I want milestones to auto-create when deals progress so that I don't forget important dates
- **Acceptance Criteria**:
  - [ ] When residential deal moves to "contract" stage, create 5 milestones based on default_milestones
  - [ ] When mortgage deal moves to "application" stage, create 6 milestones based on default_milestones
  - [ ] Scheduled_date calculates from stage_change_date + days_offset
  - [ ] All milestones start with status = "pending"
  - [ ] Activity logs: "Created {count} milestones: {milestone_names}"
  - [ ] Duplicates prevented (check if milestones already exist)
- **Business Rules**:
  - Milestone scheduled_date based on expected_close_date or current_date
  - If expected_close_date exists, work backwards: close_date - milestone_offset
  - If no expected_close_date, work forwards: current_date + milestone_offset
  - Auto-created milestones cannot be edited by user (name/type locked)
  - Moving deal backward in pipeline does not delete milestones

#### Requirement 4.2: Manual Milestone Management

- **User Story**: As an agent/loan officer, I want to add custom milestones so that I can track deal-specific events
- **Acceptance Criteria**:
  - [ ] "Add Milestone" button on Milestones tab
  - [ ] Form fields: milestone_name (required), scheduled_date (required), notes (optional)
  - [ ] Milestone type defaults to "custom"
  - [ ] Custom milestones can be edited and deleted
  - [ ] Milestones sorted by scheduled_date ascending
  - [ ] Past milestones with status "pending" highlighted in red (overdue)
- **Business Rules**:
  - Milestone_name max 255 characters
  - Scheduled_date can be past or future
  - Only assigned_to user can add/edit/delete milestones
  - Deleting milestone requires confirmation if status = "completed"

#### Requirement 4.3: Milestone Completion

- **User Story**: As an agent/loan officer, I want to mark milestones complete so that I can track progress
- **Acceptance Criteria**:
  - [ ] Checkbox next to each milestone to mark complete
  - [ ] Checking sets status = "completed", completed_date = NOW()
  - [ ] Unchecking sets status = "pending", completed_date = NULL
  - [ ] Completed milestones show checkmark icon and strikethrough
  - [ ] Activity logs: "Completed milestone: {milestone_name}"
  - [ ] Milestone completion triggers UI confetti animation (optional delight feature)
- **Business Rules**:
  - Can complete milestones in any order
  - Completed milestones remain visible (not hidden)
  - Completion updates deal's updated_at timestamp

#### Requirement 4.4: Milestone Timeline View

- **User Story**: As an agent/loan officer, I want a visual timeline of milestones so that I can see upcoming deadlines
- **Acceptance Criteria**:
  - [ ] Timeline displays milestones chronologically with vertical line
  - [ ] Each milestone shows: name, date, status icon, notes
  - [ ] Today's date marked with prominent indicator
  - [ ] Overdue milestones (past date, status pending) shown in red
  - [ ] Upcoming milestones (within 7 days) shown in amber
  - [ ] Future milestones shown in gray
  - [ ] Mobile view (375px+) shows simplified list format
- **Business Rules**:
  - Timeline scrolls to today's date on load
  - Maximum 50 milestones per deal (prevent abuse)

### Feature Group 5: Documents & Attachments

**Description**: Upload, store, and manage documents associated with deals (contracts, disclosures, reports, etc.).

#### Requirement 5.1: Document Upload

- **User Story**: As an agent/loan officer, I want to upload documents to deals so that I can keep all transaction files organized
- **Acceptance Criteria**:
  - [ ] "Upload Document" button on Documents tab
  - [ ] File picker supports multiple file selection
  - [ ] Drag-and-drop zone for file uploads
  - [ ] Document type dropdown: contract, disclosure, inspection_report, appraisal, closing_statement, other
  - [ ] Optional description field for context
  - [ ] Upload progress bar shows percentage
  - [ ] Success message: "{filename} uploaded successfully"
  - [ ] Activity logs: "Uploaded document: {filename}"
- **Business Rules**:
  - Max file size: 25MB per file
  - Allowed file types: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX
  - Files stored in Supabase Storage: `deals/{deal_id}/documents/{file_id}_{filename}`
  - Only assigned_to user can upload documents
  - Virus scanning required before storage (Supabase integration)

#### Requirement 5.2: Document Display & Download

- **User Story**: As an agent/loan officer, I want to view and download deal documents so that I can access transaction files
- **Acceptance Criteria**:
  - [ ] Documents listed with: filename, type, size, upload date, uploaded by
  - [ ] Click filename downloads file
  - [ ] Document type icons differentiate file categories
  - [ ] Sort options: date uploaded, filename, type
  - [ ] Filter by document type
  - [ ] Empty state: "No documents uploaded yet" with upload button
- **Business Rules**:
  - Download generates signed URL valid for 60 seconds
  - File preview (PDF, images) opens in browser modal
  - Documents from soft-deleted deals remain accessible to admins

#### Requirement 5.3: Document Deletion

- **User Story**: As an agent/loan officer, I want to delete incorrect documents so that I can keep files organized
- **Acceptance Criteria**:
  - [ ] Delete icon (trash) next to each document
  - [ ] Confirmation modal: "Delete {filename}? This cannot be undone."
  - [ ] Successful deletion removes from list immediately
  - [ ] Activity logs: "Deleted document: {filename}"
  - [ ] Hard delete from Supabase Storage
- **Business Rules**:
  - Only uploader or assigned_to user can delete documents
  - Deletion requires confirmation (no undo)
  - Document metadata remains in database (soft delete) for audit trail

### Feature Group 6: Activity Feed & History

**Description**: Comprehensive audit log of all deal changes, interactions, and system events.

#### Requirement 6.1: Automatic Activity Logging

- **User Story**: As an agent/loan officer, I want all deal changes logged automatically so that I can track history
- **Acceptance Criteria**:
  - [ ] Stage changes log: "Moved from {old_stage} to {new_stage}"
  - [ ] Field updates log: "Updated {field_name}"
  - [ ] Milestone completions log: "Completed milestone: {name}"
  - [ ] Document uploads log: "Uploaded document: {filename}"
  - [ ] Document deletions log: "Deleted document: {filename}"
  - [ ] Each activity shows: timestamp, user, activity type, description
  - [ ] Activities sorted reverse chronologically (newest first)
- **Business Rules**:
  - Activities immutable (cannot edit or delete)
  - System-generated activities have created_by = deal owner
  - Activity descriptions max 500 characters

#### Requirement 6.2: Manual Activity Logging

- **User Story**: As an agent/loan officer, I want to add manual notes and activities so that I can document interactions
- **Acceptance Criteria**:
  - [ ] "Add Note" button on Activity tab
  - [ ] Form fields: activity_type dropdown (note, call, email, meeting, showing), title (required), description (optional)
  - [ ] Rich text editor for description with formatting options
  - [ ] Timestamp defaults to NOW() but can be changed to past date
  - [ ] Success message: "Activity added"
  - [ ] Activity appears at top of feed immediately
- **Business Rules**:
  - Activity_type must be one of: note, call, email, meeting, showing, other
  - Title max 255 characters, description max 2000 characters
  - Cannot backdate activities more than 90 days
  - Only assigned_to user can add manual activities

#### Requirement 6.3: Activity Filtering

- **User Story**: As an agent/loan officer, I want to filter activities so that I can find specific events quickly
- **Acceptance Criteria**:
  - [ ] Filter dropdown: All, Stage Changes, Notes, Documents, Milestones
  - [ ] Date range filter: Last 7 days, Last 30 days, All time, Custom range
  - [ ] Search box filters by description text
  - [ ] Filter persists during session (localStorage)
  - [ ] Clear filters button resets to default (All, All time)
- **Business Rules**:
  - Filters combine with AND logic
  - Search is case-insensitive substring match
  - Maximum 500 activities displayed (pagination for older)

### Feature Group 7: Financial Calculations

**Description**: Automated commission calculations and financial tracking for deals.

#### Requirement 7.1: Commission Auto-Calculation

- **User Story**: As an agent/loan officer, I want commissions calculated automatically so that I can forecast income accurately
- **Acceptance Criteria**:
  - [ ] Commission_amount = deal_value × (commission_rate / 100)
  - [ ] Agent_commission = commission_amount × (commission_split_percent / 100)
  - [ ] Calculations trigger when deal_value, commission_rate, or commission_split_percent change
  - [ ] Calculated values display in Overview tab financial summary
  - [ ] Values format as currency with 2 decimal places
  - [ ] "Edit Commission" button allows manual override
- **Business Rules**:
  - Commission_rate defaults to 3.0% for residential sales, 1.0% for mortgages
  - Commission_split_percent defaults to 80% (agent keeps 80%, brokerage gets 20%)
  - Manual overrides persist (don't recalculate automatically)
  - Negative commissions not allowed (validation error)

#### Requirement 7.2: Deal Value Aggregation

- **User Story**: As an agent/loan officer, I want to see total pipeline value so that I can understand potential revenue
- **Acceptance Criteria**:
  - [ ] Pipeline board header shows: "Total Pipeline Value: ${total}"
  - [ ] Total calculates sum of all deal_value for active deals
  - [ ] Breakdown by stage shows in column headers
  - [ ] Expected commissions displayed: "Expected Commission: ${total_agent_commission}"
  - [ ] Filter by date range updates totals
  - [ ] Dashboard widget shows "Closing This Month" total value
- **Business Rules**:
  - Only includes deals with status = "active" or "pending"
  - Excludes soft-deleted deals
  - Expected commissions only count deals with expected_close_date <= end of period

### Feature Group 8: Client Integration

**Description**: Bidirectional relationship between deals and clients in the existing Client Hub.

#### Requirement 8.1: Deal-Client Linking

- **User Story**: As an agent/loan officer, I want deals linked to clients so that I can see all client transactions
- **Acceptance Criteria**:
  - [ ] Deal creation requires client_id selection (foreign key constraint)
  - [ ] Client detail page shows "Active Deals" widget
  - [ ] Widget displays: deal name, type icon, stage, value, expected close
  - [ ] Click deal navigates to deal detail page
  - [ ] "Add Deal" button in widget pre-fills client
  - [ ] Maximum 10 deals displayed, "View All Deals" link for more
- **Business Rules**:
  - Cannot create deal without valid client
  - Client cannot be deleted if active deals exist (constraint)
  - Secondary_client_ids can link multiple clients to one deal

#### Requirement 8.2: Client List Filtering

- **User Story**: As an agent/loan officer, I want to filter clients by deal status so that I can identify active opportunities
- **Acceptance Criteria**:
  - [ ] Client list filter: "Has Active Deals" checkbox
  - [ ] Checking filter shows only clients with active deals
  - [ ] Deal count badge appears next to client name in list
  - [ ] Badge shows count of active deals
  - [ ] Badge color-coded: green (1-2 deals), amber (3-5 deals), red (6+ deals)
- **Business Rules**:
  - Badge only counts deals with status = "active" or "pending"
  - Soft-deleted deals excluded from count
  - Filter combines with other client filters (tags, status)

### Feature Group 9: Mobile Experience

**Description**: Mobile-responsive interface optimized for on-the-go deal management.

#### Requirement 9.1: Mobile Pipeline View

- **User Story**: As an agent/loan officer, I want to manage deals on mobile so that I can update pipelines during showings
- **Acceptance Criteria**:
  - [ ] Pipeline board responsive for 375px+ screen width
  - [ ] Stages stack vertically on mobile (accordion style)
  - [ ] Tap stage header expands/collapses to show deals
  - [ ] Deal cards show condensed view: name, value, days in stage
  - [ ] Swipe deal card right to advance stage
  - [ ] Swipe deal card left to go back stage
  - [ ] Long-press card shows quick action menu
  - [ ] Bottom navigation bar: Pipeline, Deals, Clients, Profile
- **Business Rules**:
  - Mobile view prioritizes "My Deals" (no team view on mobile)
  - Maximum 20 deals per stage on mobile (performance)
  - Swipe gestures require 50% card width movement to trigger

#### Requirement 9.2: Mobile Quick Add

- **User Story**: As an agent/loan officer, I want to add deals quickly from mobile so that I can capture opportunities in the field
- **Acceptance Criteria**:
  - [ ] Floating action button (FAB) on pipeline page
  - [ ] Tapping FAB opens bottom sheet with minimal form
  - [ ] Form fields: Deal type (toggle), Client (search), Property address OR Loan amount, Deal value, Stage
  - [ ] Voice-to-text button for address/notes input
  - [ ] Photo upload button for property images (saved as documents)
  - [ ] "Quick Add" button saves and returns to pipeline
  - [ ] "Add & View" button saves and navigates to deal detail
  - [ ] Form completes in under 30 seconds
- **Business Rules**:
  - Deal name auto-generates from address/amount + client
  - Expected_close_date defaults to +30 days
  - Photo uploads queue in background (don't block save)

#### Requirement 9.3: Mobile Deal Detail

- **User Story**: As an agent/loan officer, I want to view deal details on mobile so that I can access information during meetings
- **Acceptance Criteria**:
  - [ ] Deal detail page responsive for 375px+ width
  - [ ] Tab navigation uses horizontal scroll on mobile
  - [ ] Key metrics (value, stage, close date) always visible at top
  - [ ] Forms stack fields vertically (1 column)
  - [ ] Documents show thumbnail grid (3 columns)
  - [ ] Activity feed shows infinite scroll (no pagination buttons)
  - [ ] Quick actions sticky footer: Change Stage, Add Note, Upload Doc
- **Business Rules**:
  - Mobile view hides less-critical fields (progressive disclosure)
  - "Show More" button expands full field list
  - Forms auto-save on field blur (no explicit save button)

### Feature Group 10: Reporting & Analytics

**Description**: Standard reports and dashboards for pipeline analysis and forecasting.

#### Requirement 10.1: Pipeline Dashboard

- **User Story**: As an agent/loan officer, I want a dashboard showing key metrics so that I can monitor performance
- **Acceptance Criteria**:
  - [ ] Dashboard displays 4 key metric cards: Total Pipeline Value, Expected Commissions (This Month), Active Deals, Average Days to Close
  - [ ] "Pipeline by Stage" bar chart shows deal count and value per stage
  - [ ] "Closing This Week" list shows deals with expected_close_date in next 7 days
  - [ ] "Stale Deals" alert shows deals with no activity in 30+ days
  - [ ] "Recent Activity" feed shows last 10 activities across all deals
  - [ ] Date range selector: This Week, This Month, This Quarter, Custom
- **Business Rules**:
  - Metrics calculate only for current user's deals (assigned_to)
  - Average Days to Close calculates from closed deals only
  - Stale deals defined as: no activities and no field updates for 30 days
  - Dashboard refreshes every 5 minutes (WebSocket or polling)

#### Requirement 10.2: Commission Report

- **User Story**: As an agent/loan officer, I want a commission report so that I can forecast income
- **Acceptance Criteria**:
  - [ ] Report table shows: Deal name, Client, Stage, Deal value, Commission amount, Agent commission, Expected close date
  - [ ] Group by: Month, Quarter, Year
  - [ ] Filter by: Deal type, Stage, Date range
  - [ ] Totals row at bottom: Total deals, Total value, Total commission
  - [ ] Export to CSV button
  - [ ] "Closed Only" toggle filters to closed_won deals
- **Business Rules**:
  - Expected commissions only include deals with expected_close_date in selected period
  - Closed commissions only include deals with status = closed_won and closed_at in period
  - Export filename: "commission*report*{start*date}*{end_date}.csv"

#### Requirement 10.3: Deal Velocity Report

- **User Story**: As an agent/loan officer, I want to see time in each stage so that I can identify bottlenecks
- **Acceptance Criteria**:
  - [ ] Report shows average days in each stage across all deals
  - [ ] Bar chart visualizes time per stage
  - [ ] Filter by: Deal type, Date range, Status (active vs closed)
  - [ ] "Slowest Deals" list shows deals exceeding average by 50%+
  - [ ] "Fastest Deals" list shows deals closed in under average time
  - [ ] Export to CSV button
- **Business Rules**:
  - Calculate from deal_activities stage_change timestamps
  - Only include completed stages (deals that exited stage)
  - Exclude deals in current stage from that stage's average
  - Minimum 5 deals required for meaningful average (show warning if less)

#### Requirement 10.4: Win/Loss Analysis

- **User Story**: As an agent/loan officer, I want to see close rates so that I can improve my sales process
- **Acceptance Criteria**:
  - [ ] Report shows: Total deals, Closed won, Closed lost, Close rate %
  - [ ] Lost reasons displayed in bar chart (grouped by category)
  - [ ] Filter by: Deal type, Date range
  - [ ] "Lost Deals" table shows: Deal name, Client, Lost reason, Stage when lost
  - [ ] Win rate by stage funnel visualization
  - [ ] Export to CSV button
- **Business Rules**:
  - Close rate = (closed_won / (closed_won + closed_lost)) × 100
  - Only include deals with status = closed_won or closed_lost
  - Date range filters by closed_at timestamp
  - Lost reasons grouped into categories: pricing, timing, financing, competition, other

## Database Schema

### user_deal_preferences

| Field                      | Type        | Null | Description                       | Validation                |
| -------------------------- | ----------- | ---- | --------------------------------- | ------------------------- |
| id                         | UUID        | No   | Primary key                       | Auto-generated            |
| user_id                    | UUID        | No   | User reference                    | FK to users.id, UNIQUE    |
| residential_sale_enabled   | BOOLEAN     | No   | Residential sales enabled         | Default true              |
| mortgage_loan_enabled      | BOOLEAN     | No   | Mortgage loans enabled            | Default true              |
| onboarding_completed       | BOOLEAN     | No   | User completed onboarding         | Default false             |
| created_at                 | TIMESTAMPTZ | No   | Creation timestamp                | Default CURRENT_TIMESTAMP |
| updated_at                 | TIMESTAMPTZ | No   | Last update timestamp             | Default CURRENT_TIMESTAMP |

**Indexes:** user_id (unique)

**Constraints:** CHECK (residential_sale_enabled = true OR mortgage_loan_enabled = true)

### deal_types

| Field              | Type         | Null | Description                    | Validation                |
| ------------------ | ------------ | ---- | ------------------------------ | ------------------------- |
| id                 | UUID         | No   | Primary key                    | Auto-generated            |
| type_code          | VARCHAR(50)  | No   | Unique identifier (kebab-case) | Unique constraint         |
| type_name          | VARCHAR(100) | No   | Display name                   | Max 100 chars             |
| icon               | VARCHAR(50)  | Yes  | Icon identifier for UI         | Optional                  |
| color              | VARCHAR(7)   | Yes  | Hex color code                 | Format: #RRGGBB           |
| pipeline_stages    | JSONB        | No   | Array of stage objects         | Valid JSON array          |
| enabled_fields     | JSONB        | No   | Field configuration object     | Valid JSON object         |
| default_milestones | JSONB        | Yes  | Milestone template array       | Valid JSON array          |
| is_system          | BOOLEAN      | No   | System-managed type            | Default true              |
| is_active          | BOOLEAN      | No   | Active status                  | Default true              |
| created_by         | UUID         | Yes  | Creator user ID                | FK to users.id            |
| created_at         | TIMESTAMPTZ  | No   | Creation timestamp             | Default CURRENT_TIMESTAMP |
| updated_at         | TIMESTAMPTZ  | No   | Last update timestamp          | Default CURRENT_TIMESTAMP |

**Indexes:** type_code (unique), is_active

### deals

| Field                    | Type          | Null | Description            | Validation                                                |
| ------------------------ | ------------- | ---- | ---------------------- | --------------------------------------------------------- |
| id                       | UUID          | No   | Primary key            | Auto-generated                                            |
| deal_name                | VARCHAR(255)  | No   | Deal display name      | Max 255 chars                                             |
| deal_type_id             | UUID          | No   | Reference to deal type | FK to deal_types.id                                       |
| client_id                | UUID          | No   | Primary client         | FK to clients.id                                          |
| secondary_client_ids     | UUID[]        | Yes  | Additional clients     | Array of valid UUIDs                                      |
| current_stage            | VARCHAR(50)   | No   | Current pipeline stage | Must match deal_type stages                               |
| status                   | VARCHAR(50)   | No   | Deal status            | Enum: active, pending, closed_won, closed_lost, cancelled |
| deal_value               | DECIMAL(12,2) | Yes  | Transaction amount     | >= 0                                                      |
| commission_rate          | DECIMAL(5,2)  | Yes  | Commission percentage  | 0-100                                                     |
| commission_amount        | DECIMAL(12,2) | Yes  | Calculated commission  | >= 0                                                      |
| commission_split_percent | DECIMAL(5,2)  | Yes  | Agent split percentage | 0-100                                                     |
| agent_commission         | DECIMAL(12,2) | Yes  | Agent's commission     | >= 0                                                      |
| expected_close_date      | DATE          | Yes  | Expected closing date  | Optional                                                  |
| actual_close_date        | DATE          | Yes  | Actual closing date    | <= today                                                  |
| days_in_pipeline         | INTEGER       | Yes  | Days from creation     | Auto-calculated                                           |
| deal_data                | JSONB         | No   | Type-specific fields   | Valid JSON object, default {}                             |
| notes                    | TEXT          | Yes  | General notes          | Optional                                                  |
| lost_reason              | TEXT          | Yes  | Reason if lost         | Required if status=closed_lost                            |
| referral_source          | VARCHAR(255)  | Yes  | How deal was sourced   | Optional                                                  |
| created_by               | UUID          | No   | Creator user ID        | FK to users.id                                            |
| assigned_to              | UUID          | No   | Owner user ID          | FK to users.id                                            |
| is_deleted               | BOOLEAN       | No   | Soft delete flag       | Default false                                             |
| created_at               | TIMESTAMPTZ   | No   | Creation timestamp     | Default CURRENT_TIMESTAMP                                 |
| updated_at               | TIMESTAMPTZ   | No   | Last update timestamp  | Default CURRENT_TIMESTAMP                                 |
| closed_at                | TIMESTAMPTZ   | Yes  | Close timestamp        | Set when status=closed\_\*                                |

**Indexes:** client_id, deal_type_id, (assigned_to, status), current_stage, expected_close_date, is_deleted, created_at, deal_data (GIN index)

### deal_milestones

| Field          | Type         | Null | Description            | Validation                          |
| -------------- | ------------ | ---- | ---------------------- | ----------------------------------- |
| id             | UUID         | No   | Primary key            | Auto-generated                      |
| deal_id        | UUID         | No   | Parent deal            | FK to deals.id, CASCADE             |
| milestone_type | VARCHAR(50)  | No   | Milestone category     | Max 50 chars                        |
| milestone_name | VARCHAR(255) | No   | Display name           | Max 255 chars                       |
| scheduled_date | DATE         | Yes  | Target date            | Optional                            |
| completed_date | DATE         | Yes  | Actual completion date | Optional                            |
| status         | VARCHAR(20)  | No   | Milestone status       | Enum: pending, completed, cancelled |
| notes          | TEXT         | Yes  | Additional notes       | Optional                            |
| created_by     | UUID         | No   | Creator user ID        | FK to users.id                      |
| created_at     | TIMESTAMPTZ  | No   | Creation timestamp     | Default CURRENT_TIMESTAMP           |
| updated_at     | TIMESTAMPTZ  | No   | Last update timestamp  | Default CURRENT_TIMESTAMP           |

**Indexes:** (deal_id, scheduled_date), (scheduled_date, status)

### deal_documents

| Field         | Type         | Null | Description           | Validation                                                                         |
| ------------- | ------------ | ---- | --------------------- | ---------------------------------------------------------------------------------- |
| id            | UUID         | No   | Primary key           | Auto-generated                                                                     |
| deal_id       | UUID         | No   | Parent deal           | FK to deals.id, CASCADE                                                            |
| document_type | VARCHAR(50)  | No   | Document category     | Enum: contract, disclosure, inspection_report, appraisal, closing_statement, other |
| file_name     | VARCHAR(255) | No   | Original filename     | Max 255 chars                                                                      |
| file_path     | TEXT         | No   | Supabase storage path | Unique                                                                             |
| file_size     | INTEGER      | No   | Size in bytes         | > 0, <= 26214400 (25MB)                                                            |
| file_type     | VARCHAR(50)  | No   | MIME type             | Valid MIME                                                                         |
| description   | TEXT         | Yes  | User description      | Optional                                                                           |
| uploaded_by   | UUID         | No   | Uploader user ID      | FK to users.id                                                                     |
| uploaded_at   | TIMESTAMPTZ  | No   | Upload timestamp      | Default CURRENT_TIMESTAMP                                                          |

**Indexes:** (deal_id, document_type), uploaded_at

### deal_activities

| Field         | Type         | Null | Description               | Validation                                                                      |
| ------------- | ------------ | ---- | ------------------------- | ------------------------------------------------------------------------------- |
| id            | UUID         | No   | Primary key               | Auto-generated                                                                  |
| deal_id       | UUID         | No   | Parent deal               | FK to deals.id, CASCADE                                                         |
| activity_type | VARCHAR(50)  | No   | Activity category         | Enum: stage_change, note, call, email, meeting, showing, document_upload, other |
| title         | VARCHAR(255) | No   | Activity summary          | Max 255 chars                                                                   |
| description   | TEXT         | Yes  | Detailed description      | Optional, max 2000 chars                                                        |
| old_stage     | VARCHAR(50)  | Yes  | Previous stage            | For stage_change type                                                           |
| new_stage     | VARCHAR(50)  | Yes  | New stage                 | For stage_change type                                                           |
| created_by    | UUID         | No   | User who created activity | FK to users.id                                                                  |
| created_at    | TIMESTAMPTZ  | No   | Activity timestamp        | Default CURRENT_TIMESTAMP                                                       |

**Indexes:** (deal_id, created_at), activity_type

## Business Rules

1. **Deal Type Preferences**: Users select enabled deal types during onboarding (after email verification, before dashboard access)
   - At least one deal type must be enabled at all times (database constraint)
   - Both types enabled by default on onboarding screen
   - Users can change preferences later in Deal Settings with note displayed
   - Dashboard and pipeline views automatically filter based on preferences
   - Empty states handle when user has no deals of enabled type

2. **Deal Type Immutability**: Once a deal is created, its `deal_type_id` cannot be changed (data structure incompatibility)

3. **Client Requirement**: All deals MUST link to an existing client via `client_id` (foreign key constraint, no orphan deals)

4. **Commission Calculations**:
   - `commission_amount = deal_value × (commission_rate / 100)`
   - `agent_commission = commission_amount × (commission_split_percent / 100)`
   - Calculations trigger automatically on value/rate changes unless manually overridden

5. **Pipeline Stage Rules**:
   - Deals can only move between stages defined in their `deal_type.pipeline_stages`
   - Moving to "closed" or "lost" stages sets `status` and `closed_at` automatically
   - Moving to "closed_lost" requires `lost_reason` (mandatory field)

6. **Milestone Auto-Creation**:
   - Residential Sale: Moving to "contract" stage creates 5 default milestones
   - Mortgage Loan: Moving to "application" stage creates 6 default milestones
   - Milestones scheduled based on `expected_close_date` or `current_date + offset`

7. **Soft Delete Cascade**:
   - Deleting deal sets `is_deleted = true` for deal, milestones, documents, activities
   - Soft-deleted deals excluded from all lists, reports, and calculations
   - Hard delete from storage only for documents (files removed)

8. **Days in Pipeline**:
   - For active deals: `days_in_pipeline = CURRENT_DATE - created_at`
   - For closed deals: `days_in_pipeline = closed_at - created_at` (frozen)
   - Calculation runs daily via scheduled job

9. **Commission Defaults**:
   - Residential Sale: `commission_rate = 3.0%`, `commission_split_percent = 80%`
   - Mortgage Loan: `commission_rate = 1.0%`, `commission_split_percent = 80%`
   - Users can override defaults per deal

10. **Document Storage**:
   - Max file size: 25MB
   - Allowed types: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX
   - Storage path: `deals/{deal_id}/documents/{file_id}_{filename}`
   - Virus scanning required before storage

11. **Activity Logging**:
    - All stage changes automatically logged
    - Field updates log activity with old/new values
    - Manual activities (notes, calls, meetings) user-created
    - Activities are immutable (cannot be edited or deleted)

12. **Permissions**:
    - Users can only view/edit deals where `assigned_to = current_user_id` OR they have admin role
    - Users can only upload documents to their assigned deals
    - Users can only add milestones and activities to their assigned deals

13. **Close Date Validation**:
    - `actual_close_date` must be <= today (cannot close deals in future)
    - `expected_close_date` can be past (warning shown) or future
    - Deals with `expected_close_date` in past highlighted as "overdue"

14. **Secondary Clients**:
    - `secondary_client_ids` allows multiple clients per deal (e.g., co-buyers)
    - All linked clients must be non-deleted
    - Maximum 5 secondary clients per deal

15. **Stage Progression Tracking**:
    - System tracks time spent in each stage via `deal_activities` timestamps
    - Stage analytics calculate average time per stage
    - Used for velocity reporting and bottleneck identification

16. **Lost Reason Analytics**:
    - Lost reasons categorized for reporting: pricing, timing, financing, competition, other
    - Free-text field allows detailed capture
    - Used for win/loss analysis and process improvement

## Dependencies

**External Systems**:

- Supabase PostgreSQL: Database hosting and management
- Supabase Storage: Document file storage with signed URLs
- Supabase Auth: User authentication and session management (Better Auth integration)

**Existing Features**:

- Client Hub: Client profiles and management (clients table)
- User Authentication: User accounts, roles, permissions (users table)
- Task Management: Optional linking between deals and tasks (future integration)

**Data Requirements**:

- Users table: Creator and assigned_to relationships
- Clients table: Deal-client linking (foreign key dependency)
- Real-time updates: WebSocket or polling for pipeline board refresh

**Technical Stack**:

- Next.js 14+ with App Router
- React 18+ with Server Components
- TypeScript for type safety
- Tailwind CSS for styling
- Supabase JS client library
- React Query for data fetching and caching
- React DnD or dnd-kit for drag-and-drop
- Recharts or Chart.js for analytics visualizations

**Infrastructure**:

- Supabase CLI for migrations
- Database connection via `SUPABASE_DATABASE_URL` environment variable
- Storage bucket configuration in Supabase Dashboard
- RLS policies for row-level security (deals visible only to assigned users)

**Future Dependencies (V2)**:

- Email service (SendGrid, Postmark) for email integration
- Calendar API (Google Calendar, Outlook) for milestone sync
- MLS API for property data import
- DocuSign API for contract signing
- Webhook infrastructure for external integrations
