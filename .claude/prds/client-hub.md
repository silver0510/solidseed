---
name: client-hub
description: Centralized client management platform for real estate professionals with comprehensive profiles, document management, and activity tracking
status: backlog
created: 2026-01-06T04:47:14Z
---

# PRD: Client Hub

## Executive Summary

The Client Hub is the central nervous system of SolidSeed CRM, designed specifically for real estate professionals (realtors, agents, and loan officers) to manage all client information and interactions in one place. This feature providing a mobile-first, modern interface for managing thousands of client relationships while building toward an integrated email marketing and communication platform.

**Value Proposition**: Enable real estate professionals to maintain comprehensive client profiles, track interactions, manage documents, and organize tasks—all essential for building and maintaining strong client relationships that drive retention and repeat business.

**Key Differentiator**: Data portability that allows agents to retain their client information when switching brokers, combined with a mobile-first design for on-the-go access.

---

## Problem Statement

### What problem are we solving?

Real estate professionals struggle with fragmented client information scattered across email, spreadsheets, paper files, and multiple systems. This fragmentation leads to:

- Missed follow-ups and lost opportunities
- Difficulty accessing client information during property showings or meetings
- Time wasted searching for documents and contact details
- Poor client experience due to agents not having context readily available
- Risk of losing all client data when switching brokers

### Why is this important now?

1. **Market Competition**: Real estate agents need every advantage to maintain client relationships in a competitive market
2. **Mobile Work Nature**: Agents work primarily on-the-go and need mobile-first solutions
3. **Foundation for Platform**: Client Hub is the foundation that enables email marketing, communication tracking, and automation features planned for future releases
4. **Client Retention Focus**: With client retention as our primary metric, a robust client management system is essential

---

## User Stories

### Primary User Personas

**Persona 1: Sarah - Independent Real Estate Agent**

- 35 years old, 5 years in real estate
- Manages ~500 active clients
- Works primarily from mobile device during showings and open houses
- Needs quick access to client preferences and history while in the field
- Frustrated with current system being desktop-centric and expensive

**Persona 2: Michael - Team Lead at Brokerage**

- 42 years old, 10 years experience
- Manages 1,200+ clients across buyer, seller, and past client segments
- Needs to organize clients by tags and track all touchpoints
- Concerned about losing client data if leaving current brokerage
- Requires document management for contracts, disclosures, inspection reports

**Persona 3: Jennifer - Loan Officer**

- 38 years old, 7 years in mortgage lending
- Works with ~800 clients in various stages of loan process
- Needs to track important dates (rate locks, closing dates, birthdays)
- Requires secure document storage for sensitive financial documents
- Works across desktop and mobile depending on context

### Detailed User Journeys

#### Journey 1: Adding a New Client After Open House

**Scenario**: Sarah meets potential buyers at an open house and wants to capture their information immediately.

1. Sarah opens SolidSeed on her phone during the open house
2. Clicks "Add New Client" button
3. Enters name, email, phone while talking with prospects
4. Adds tag "Open House - 123 Main St - Jan 2026"
5. Creates task "Follow up on property preferences" for tomorrow
6. Adds note about what they liked about the property
7. Saves client profile
8. Continues showing property with all info captured

**Pain Points Addressed**:

- No need to remember details later or use paper notes
- Information immediately searchable and accessible
- Automatic task creation ensures follow-up happens

#### Journey 2: Preparing for Client Meeting

**Scenario**: Michael has a listing appointment with an existing client and needs to review their history.

1. Searches for client name in Client Hub
2. Reviews client profile showing:
   - Previous properties bought/sold
   - Communication history
   - Important dates (birthday, previous closing dates)
   - All notes from past interactions
3. Reviews uploaded documents (previous contracts, disclosures)
4. Adds new note with meeting agenda
5. Creates task for post-meeting follow-up
6. Arrives at meeting fully prepared with context

**Pain Points Addressed**:

- Complete client context available in seconds
- No searching through email or files
- Professional preparation builds client trust

#### Journey 3: Document Management During Transaction

**Scenario**: Jennifer needs to manage loan documents for a client in the closing process.

1. Opens client profile for borrower
2. Uploads pre-approval letter to "Documents" section with description "Pre-Approval Letter - Jan 2026"
3. Uploads appraisal report with description "Property Appraisal - 123 Main St"
4. Uploads final closing disclosure with description "Final Closing Disclosure"
5. Shares document link with client via email
6. Marks task "Upload closing documents" as complete
7. All documents organized chronologically and accessible for future reference

**Pain Points Addressed**:

- Secure document storage
- Easy categorization and retrieval
- Audit trail of what was shared and when

---

## Requirements

### Functional Requirements

#### FR1: Client Profile Management

**FR1.1: Client Creation and Registration**

- **FR1.1.1**: System shall provide form to create new client with required fields: Name (VARCHAR 255), Email (VARCHAR 255), Phone (VARCHAR 50)
- **FR1.1.2**: System shall provide optional fields: Birthday (DATE), Address (TEXT)
- **FR1.1.3**: System shall validate email format before saving
- **FR1.1.4**: System shall enforce unique constraint on email field
- **FR1.1.5**: System shall enforce unique constraint on phone field
- **FR1.1.6**: System shall validate phone format: +1-XXX-XXX-XXXX
- **FR1.1.7**: System shall generate unique UUID for each client
- **FR1.1.8**: System shall display confirmation message upon successful creation
- **FR1.1.9**: System shall redirect user to new client profile page after creation
- **FR1.1.10**: System shall support bulk import of clients via CSV file
- **FR1.1.11**: System shall provide downloadable CSV template with headers: Name, Email, Phone, Birthday, Address
- **FR1.1.12**: System shall validate CSV format and headers on upload
- **FR1.1.13**: System shall preview first 5 records before confirming import
- **FR1.1.14**: System shall provide import summary showing success and error counts
- **FR1.1.15**: System shall generate downloadable error log for failed imports

**FR1.2: Client Profile Viewing and Search**

- **FR1.2.1**: System shall display list of all clients with basic information
- **FR1.2.2**: System shall display complete client profile with sections: Contact Information, Personal Information, Documents, Notes, Tasks
- **FR1.2.3**: System shall load client profile within 2 seconds
- **FR1.2.4**: System shall provide real-time search (within 500ms response time)
- **FR1.2.5**: System shall support search by name, email, and phone number
- **FR1.2.6**: System shall support case-insensitive search
- **FR1.2.7**: System shall support partial match searching
- **FR1.2.8**: System shall display message when no search results found

**FR1.3: Client Profile Updates and Deletion**

- **FR1.3.1**: System shall allow editing of all client profile fields
- **FR1.3.2**: System shall validate updated information before saving
- **FR1.3.3**: System shall update `updated_at` timestamp on any modification
- **FR1.3.4**: System shall display confirmation message after successful update
- **FR1.3.5**: System shall require confirmation before deleting client
- **FR1.3.6**: System shall implement soft delete using `is_deleted` flag
- **FR1.3.7**: System shall prevent deletion of clients with active deals/transactions
- **FR1.3.8**: System shall retain all associated data (documents, notes, tasks) when client is soft deleted

**FR1.4: Client Organization and Tagging**

- **FR1.4.1**: System shall allow agents to create custom tags
- **FR1.4.2**: System shall allow multiple tags per client
- **FR1.4.3**: System shall provide tag-based filtering of client list
- **FR1.4.4**: System shall display tag count per client in list view
- **FR1.4.5**: System shall support tag autocomplete to prevent duplicates

#### FR2: Document Management

**FR2.1: Document Upload and Storage**

- **FR2.1.1**: System shall support file upload from client profile
- **FR2.1.2**: System shall support file types: PDF, DOC, DOCX, JPG, PNG
- **FR2.1.3**: System shall enforce maximum file size of 10MB
- **FR2.1.4**: System shall validate file type before upload
- **FR2.1.5**: System shall require document name/description
- **FR2.1.6**: System shall store files securely with access control
- **FR2.1.7**: System shall display upload progress for files
- **FR2.1.8**: System shall generate unique file path for each uploaded document
- **FR2.1.9**: System shall record upload timestamp and uploader user ID

**FR2.2: Document Organization**

- **FR2.2.1**: System shall display all documents for a client in chronological order (newest first)
- **FR2.2.2**: System shall display total document count per client
- **FR2.2.3**: System shall allow sorting documents by name, upload date, or file type

**FR2.3: Document Viewing and Management**

- **FR2.3.1**: System shall provide in-browser preview for PDF files
- **FR2.3.2**: System shall allow download of all document types
- **FR2.3.3**: System shall preserve original filename on download
- **FR2.3.4**: System shall require confirmation before deleting documents
- **FR2.3.5**: System shall remove document from both database and storage on deletion
- **FR2.3.6**: System shall display success confirmation after deletion

#### FR3: Notes and Task Management

**FR3.1: Notes Management**

- **FR3.1.1**: System shall allow agents to add notes to client profiles
- **FR3.1.2**: System shall require non-empty note content (minimum 1 character)
- **FR3.1.3**: System shall allow marking notes as important
- **FR3.1.4**: System shall automatically timestamp notes
- **FR3.1.5**: System shall record note author (user ID)
- **FR3.1.6**: System shall display notes in reverse chronological order (newest first)
- **FR3.1.7**: System shall visually distinguish important notes
- **FR3.1.8**: System shall allow filtering notes by date range
- **FR3.1.9**: System shall allow filtering notes by important flag

**FR3.2: Task Management**

- **FR3.2.1**: System shall allow creation of tasks linked to client profiles
- **FR3.2.2**: System shall require task title (VARCHAR 255) and due date (DATE)
- **FR3.2.3**: System shall provide optional task description (TEXT)
- **FR3.2.4**: System shall support priority levels: Low, Medium, High
- **FR3.2.5**: System shall support task statuses: Pending, Completed
- **FR3.2.6**: System shall warn when past due date is selected
- **FR3.2.7**: System shall record completion timestamp when task is marked complete
- **FR3.2.8**: System shall allow uncompleting tasks (reversible completion)
- **FR3.2.9**: System shall sort tasks by due date
- **FR3.2.10**: System shall visually highlight overdue tasks (red)
- **FR3.2.11**: System shall visually highlight tasks due today (yellow)
- **FR3.2.12**: System shall display tasks in both client profile and agent's task dashboard
- **FR3.2.13**: System shall allow filtering tasks by priority
- **FR3.2.14**: System shall display task count per client

#### FR4: Data Management and Export

**FR4.1: Data Portability**

- **FR4.1.1**: System shall allow export of all client data to CSV format
- **FR4.1.2**: System shall include all client fields in export
- **FR4.1.3**: System shall allow selective export (filtered by tags, date ranges)
- **FR4.1.4**: System shall generate export within 30 seconds for up to 5,000 clients

### Non-Functional Requirements

#### NFR1: Performance

**NFR1.1**: Client profile page load time shall not exceed 2 seconds on 4G mobile connection
**NFR1.2**: Search results shall appear within 500ms of user input
**NFR1.3**: System shall support 1,000+ clients per agent without performance degradation
**NFR1.4**: Document upload shall show progress indicator and complete within 30 seconds for 10MB files
**NFR1.5**: Client list shall support infinite scroll/pagination for smooth browsing of large client lists
**NFR1.6**: System shall handle concurrent access from multiple agents without blocking

#### NFR2: Security and Privacy

**NFR2.1**: System shall implement GDPR-compliant data handling
**NFR2.2**: System shall encrypt documents at rest using AES-256 encryption
**NFR2.3**: System shall encrypt data in transit using TLS 1.3
**NFR2.4**: System shall implement role-based access control (RBAC)
**NFR2.5**: System shall ensure agents can only access their assigned clients
**NFR2.6**: System shall maintain audit log of all create, update, delete operations
**NFR2.7**: System shall record user ID and timestamp for all data modifications
**NFR2.8**: System shall support GDPR right to be forgotten (permanent data deletion)
**NFR2.9**: System shall provide data export for GDPR data portability requirement
**NFR2.10**: System shall secure file storage with access control lists (ACL)

#### NFR3: Scalability

**NFR3.1**: System shall support up to 5,000 clients per agent
**NFR3.2**: System shall support multi-tenant architecture for SaaS deployment
**NFR3.3**: Database schema shall support horizontal scaling
**NFR3.4**: File storage shall use cloud-based solution (S3 or equivalent) for scalability
**NFR3.5**: System shall handle 100+ concurrent users per organization without degradation

#### NFR4: Mobile and Responsiveness

**NFR4.1**: UI shall be mobile-first, optimized for smartphone screens (375px - 428px width)
**NFR4.2**: UI shall be responsive across tablet (768px+) and desktop (1024px+)
**NFR4.3**: Touch targets shall be minimum 44x44px for mobile usability
**NFR4.4**: System shall work offline with local caching and sync when connection restored (future enhancement consideration)
**NFR4.5**: Forms shall use mobile-optimized input types (tel, email, date pickers)

#### NFR5: Reliability and Availability

**NFR5.1**: System shall maintain 99.9% uptime
**NFR5.2**: System shall implement automated database backups every 24 hours
**NFR5.3**: System shall implement point-in-time recovery capability
**NFR5.4**: System shall gracefully handle upload failures with retry mechanism
**NFR5.5**: System shall display clear error messages for all failure scenarios

#### NFR6: Usability

**NFR6.1**: New users shall be able to create first client within 2 minutes without training
**NFR6.2**: System shall provide inline help text for complex features
**NFR6.3**: System shall display clear validation error messages
**NFR6.4**: System shall provide keyboard shortcuts for power users
**NFR6.5**: System shall follow accessibility standards (WCAG 2.1 AA)

#### NFR7: Subscription and Multi-tenancy

**NFR7.1**: System shall enforce feature access based on user subscription tier
**NFR7.2**: System shall implement data isolation between different tenant organizations
**NFR7.3**: System shall track usage metrics per tenant for billing purposes
**NFR7.4**: System shall support subscription tier limits (e.g., max clients, storage)

---

## Success Criteria

### Primary Metric: Client Retention

**Target**: Increase agent's client retention rate by 25% within 6 months of using Client Hub

**Measurement Approach**:

- Track frequency of client interactions (notes, tasks, emails)
- Monitor task completion rate for follow-ups
- Measure time between client touchpoints
- Survey agents on client relationship quality

### Secondary Metrics

**Adoption and Engagement**:

1. **Active Usage**: 80% of users access Client Hub at least 3 times per week
2. **Client Profile Completeness**: 90% of client profiles have at least one note and one task
3. **Mobile Usage**: 60% of sessions occur on mobile devices
4. **Document Upload**: Average 5+ documents per client

**Efficiency Gains**: 5. **Search Speed**: Users find client information in under 10 seconds (vs. 2+ minutes with previous tools) 6. **Task Completion**: 85% of tasks completed within due date 7. **Time Savings**: Agents report saving 5+ hours per week on client management

**Data Quality**: 8. **Profile Accuracy**: Less than 5% duplicate clients 9. **Data Portability**: 100% of agents able to export their client data successfully

**Business Metrics**: 10. **User Retention**: 90% of users continue using SolidSeed after 3 months 11. **Feature Satisfaction**: Net Promoter Score (NPS) of 40+ for Client Hub 12. **Conversion from FollowUpBoss**: 30% of FollowUpBoss users who trial SolidSeed convert to paid subscription

---

## Constraints & Assumptions

### Technical Constraints

1. **File Storage Limit**: 10MB per document to manage storage costs and maintain performance
2. **Browser Support**: Must support modern browsers (Chrome, Safari, Firefox, Edge) - last 2 versions
3. **Mobile OS**: Must support iOS 14+ and Android 10+
4. **API Rate Limits**: Future email integration will be subject to third-party API limits (e.g., SendGrid, Twilio)

### Business Constraints

1. **Budget**: Development must be completed within allocated budget for MVP
2. **Timeline**: Client Hub must launch within Q1 2026
3. **Compliance**: Must be GDPR compliant before launch (EU market requirement)
4. **Subscription Model**: Feature access must align with planned subscription tiers

### Resource Constraints

1. **Development Team**: Limited to current engineering team size
2. **Infrastructure**: Must use existing cloud infrastructure (AWS/GCP)
3. **Support**: Customer support team must be trained before launch

### Assumptions

1. **User Behavior**: Agents will primarily access on mobile during work hours
2. **Data Volume**: Average agent has 500-1,500 clients
3. **Document Usage**: Average 3-5 documents per client
4. **Task Creation**: Average 2-3 active tasks per client at any time
5. **Note Frequency**: Agents add notes after each significant client interaction (estimated 2-3 per client per month)
6. **Internet Connectivity**: Users have reliable internet connection (4G or better)
7. **Migration**: Users will use CSV import for initial data load
8. **Tag Usage**: Agents will create 10-20 commonly used tags (property types, lead sources, transaction stages)
9. **Subscription**: Most users will be on mid-tier subscription (not basic, not enterprise)
10. **Admin Dashboard**: System admin dashboard exists separately for monitoring (not part of this PRD)

---

## Out of Scope

### Explicitly NOT Building in Initial Release

1. **Email Sending**: While we're building the foundation, actual email sending from client profile is future enhancement
2. **SMS Sending**: SMS capabilities deferred to future release
3. **Communication History Import**: Importing historical emails/calls from other systems is out of scope
4. **Mobile Apps**: Native iOS/Android apps are out of scope; mobile-first responsive web is sufficient
5. **Duplicate Detection**: Automated duplicate detection is deferred; manual checking via unique email/phone is sufficient for MVP
6. **Calendar Integration**: Syncing tasks with Google Calendar, Outlook, etc. is future enhancement
7. **Team Collaboration**: Multiple agents accessing same client is out of scope (single agent ownership only)
8. **Advanced Reporting**: Analytics dashboard for client insights is future enhancement
9. **Custom Fields**: Ability to add custom fields to client profiles is deferred
10. **Document Categorization**: Custom categories for organizing documents is deferred to future release
11. **Deal/Transaction Pipeline**: Tracking deals through stages is separate feature
12. **Email Marketing Campaigns**: While we're integrating with email marketing feature later, campaign management is separate
13. **Client Portal**: Client-facing portal for viewing documents is out of scope
14. **E-signature Integration**: DocuSign/HelloSign integration is future enhancement
15. **Property Matching**: Matching clients to properties based on preferences is out of scope
16. **Multi-language Support**: English only for initial release
17. **Client Merge**: Merging duplicate client profiles is future enhancement
18. **Automated Task Creation**: AI-driven task suggestions based on client behavior is future enhancement
19. **Voice Notes**: Audio note recording is out of scope

---

## Dependencies

### External Dependencies

1. **Cloud Storage Provider**: AWS S3 or Google Cloud Storage for document storage
2. **Email Service**: Future integration with SendGrid, Mailgun, or similar for email sending capability
3. **SMS Provider**: Future integration with Twilio for SMS sending capability
4. **Authentication System**: Depends on user authentication/authorization system (assumed to exist)
5. **Subscription Management**: Depends on billing/subscription system for tier enforcement
6. **Admin Dashboard**: Assumes separate admin dashboard exists for system monitoring

### Internal Dependencies

1. **User Management**: User authentication, authorization, and profile management must be implemented
2. **Database Infrastructure**: PostgreSQL (or similar) database must be provisioned
3. **File Storage**: Secure file storage infrastructure must be configured
4. **API Framework**: RESTful API or GraphQL API must be established
5. **Frontend Framework**: Modern frontend framework (React, Vue, or similar) must be selected
6. **Mobile UI Framework**: Responsive CSS framework or mobile-first component library

### Team Dependencies

1. **Design Team**: UI/UX designs for all screens and mobile layouts
2. **Legal Team**: GDPR compliance review and privacy policy updates
3. **DevOps Team**: Infrastructure setup, deployment pipeline, monitoring
4. **QA Team**: Test plans, mobile device testing, security testing
5. **Product Team**: Subscription tier definition and feature gating rules
6. **Customer Success**: Training materials, onboarding flow, support documentation

### Data Dependencies

1. **CSV Import Format**: Standard format for bulk import must be documented
2. **Data Migration**: If users are migrating from FollowUpBoss, export format compatibility
3. **Validation Rules**: Phone number format, email validation standards
4. **Timezone Handling**: UTC storage with user timezone display

---

## Database Schema

### clients

| Field Name  | Type         | Allow Null | Description                 | Validation Rule                           |
| ----------- | ------------ | ---------- | --------------------------- | ----------------------------------------- |
| id          | UUID         | No         | Primary key identifier      | Auto-generated UUID                       |
| name        | VARCHAR(255) | No         | Client full name            | Required, min 1 character                 |
| email       | VARCHAR(255) | No         | Client email address        | Required, valid email format, unique      |
| phone       | VARCHAR(50)  | No         | Client phone number         | Required, format: +1-XXX-XXX-XXXX, unique |
| birthday    | DATE         | Yes        | Client birthday             | Optional, format: YYYY-MM-DD              |
| address     | TEXT         | Yes        | Client mailing/home address | Optional                                  |
| is_deleted  | BOOLEAN      | No         | Soft delete flag            | Default: false                            |
| created_at  | TIMESTAMP    | No         | Creation timestamp          | Auto-generated                            |
| updated_at  | TIMESTAMP    | No         | Last update timestamp       | Auto-updated                              |
| created_by  | UUID         | No         | User who created the client | Foreign key to users table                |
| assigned_to | UUID         | No         | Agent assigned to client    | Foreign key to users table                |

**Indexes**:

- Primary Key: `id`
- Unique: `email`, `phone`
- Index: `assigned_to`, `is_deleted`, `created_at`

### client_tags

| Field Name | Type         | Allow Null | Description            | Validation Rule              |
| ---------- | ------------ | ---------- | ---------------------- | ---------------------------- |
| id         | UUID         | No         | Primary key identifier | Auto-generated UUID          |
| client_id  | UUID         | No         | Reference to client    | Foreign key to clients table |
| tag_name   | VARCHAR(100) | No         | Tag label              | Required, min 1 character    |
| created_at | TIMESTAMP    | No         | Creation timestamp     | Auto-generated               |
| created_by | UUID         | No         | User who created tag   | Foreign key to users table   |

**Indexes**:

- Primary Key: `id`
- Composite Index: `client_id`, `tag_name` (unique together)
- Index: `tag_name`

### client_documents

| Field Name  | Type         | Allow Null | Description                | Validation Rule                   |
| ----------- | ------------ | ---------- | -------------------------- | --------------------------------- |
| id          | UUID         | No         | Primary key identifier     | Auto-generated UUID               |
| client_id   | UUID         | No         | Reference to client        | Foreign key to clients table      |
| file_name   | VARCHAR(255) | No         | Original filename          | Required                          |
| file_path   | TEXT         | No         | Storage path/URL           | Required, unique                  |
| file_size   | INTEGER      | No         | File size in bytes         | Max: 10485760 (10MB)              |
| file_type   | VARCHAR(50)  | No         | MIME type                  | Allowed: PDF, DOC, DOCX, JPG, PNG |
| description | TEXT         | Yes        | Document description       | Optional                          |
| uploaded_by | UUID         | No         | User who uploaded document | Foreign key to users table        |
| uploaded_at | TIMESTAMP    | No         | Upload timestamp           | Auto-generated                    |

**Indexes**:

- Primary Key: `id`
- Index: `client_id`, `uploaded_at`

### client_notes

| Field Name   | Type      | Allow Null | Description            | Validation Rule              |
| ------------ | --------- | ---------- | ---------------------- | ---------------------------- |
| id           | UUID      | No         | Primary key identifier | Auto-generated UUID          |
| client_id    | UUID      | No         | Reference to client    | Foreign key to clients table |
| content      | TEXT      | No         | Note content           | Required, min 1 character    |
| is_important | BOOLEAN   | No         | Important flag         | Default: false               |
| created_by   | UUID      | No         | User who created note  | Foreign key to users table   |
| created_at   | TIMESTAMP | No         | Creation timestamp     | Auto-generated               |
| updated_at   | TIMESTAMP | No         | Last update timestamp  | Auto-updated                 |

**Indexes**:

- Primary Key: `id`
- Index: `client_id`, `created_at`, `is_important`

### client_tasks

| Field Name   | Type         | Allow Null | Description            | Validation Rule                |
| ------------ | ------------ | ---------- | ---------------------- | ------------------------------ |
| id           | UUID         | No         | Primary key identifier | Auto-generated UUID            |
| client_id    | UUID         | No         | Reference to client    | Foreign key to clients table   |
| title        | VARCHAR(255) | No         | Task title             | Required, min 1 character      |
| description  | TEXT         | Yes        | Task description       | Optional                       |
| due_date     | DATE         | No         | Task due date          | Required, format: YYYY-MM-DD   |
| priority     | VARCHAR(20)  | No         | Task priority          | Enum: low, medium, high        |
| status       | VARCHAR(20)  | No         | Task status            | Enum: pending, completed       |
| completed_at | TIMESTAMP    | Yes        | Completion timestamp   | Auto-set when status=completed |
| created_by   | UUID         | No         | User who created task  | Foreign key to users table     |
| assigned_to  | UUID         | No         | User assigned to task  | Foreign key to users table     |
| created_at   | TIMESTAMP    | No         | Creation timestamp     | Auto-generated                 |
| updated_at   | TIMESTAMP    | No         | Last update timestamp  | Auto-updated                   |

**Indexes**:

- Primary Key: `id`
- Index: `client_id`, `assigned_to`, `due_date`, `status`, `priority`

---

## Business Rules

1. **Email Uniqueness**: Each client email must be unique within the system to prevent duplicate client records and ensure accurate communication tracking.

2. **Phone Uniqueness**: Each client phone number must be unique within the system to prevent duplicate client records.

3. **Soft Delete Policy**: Client records must use soft delete (`is_deleted` flag) rather than hard delete to maintain data integrity, preserve audit trails, and comply with data retention requirements.

4. **Data Portability**: All client data must be exportable to allow agents to retain their client information when switching brokers (key differentiator for the platform).

5. **Document Size Limits**: Uploaded documents must not exceed 10MB to ensure system performance and reasonable storage costs.

6. **Task Due Date Validation**: While the system allows creating tasks with past due dates (with warning), overdue tasks must be visually highlighted to ensure agents don't miss follow-ups.

7. **Access Control**: Agents can only view and manage clients assigned to them, ensuring data privacy and preventing unauthorized access to client information.

8. **Audit Trail**: All create, update, and delete operations must record the user who performed the action and the timestamp for accountability and compliance purposes.

9. **Required Contact Information**: At minimum, clients must have name, email, and phone to ensure agents have multiple channels to reach their clients (aligned with real estate communication needs).

10. **Birthday Tracking**: Birthday field is optional but recommended, as it enables automated relationship-building campaigns (birthday greetings, anniversary emails) in future releases.

11. **Document Storage**: Documents are stored with descriptive names/descriptions to enable quick identification. Document categorization may be added in future releases based on user feedback.

12. **Subscription-Based Access**: Feature access is controlled by user's subscription tier; agents on lower tiers may have limits on client count or storage.

13. **Multi-Tenancy Isolation**: Data must be completely isolated between different tenant organizations (brokerages).

14. **Tag Organization**: Tags are user-created and not pre-defined, allowing flexibility for different real estate workflows.

15. **GDPR Compliance**: Users can request complete data export or permanent deletion of their client data to comply with GDPR requirements.

---

## Technical Architecture Considerations

### Frontend

- Mobile-first responsive design
- Progressive Web App (PWA) capabilities for mobile experience
- Optimistic UI updates for better perceived performance
- Local caching for frequently accessed client profiles

### Backend

- RESTful API or GraphQL for client-server communication
- Multi-tenant database architecture with tenant isolation
- Row-level security for data access control
- Background job processing for bulk operations (CSV import)

### Storage

- Cloud-based object storage (S3, GCS) for documents
- CDN for document delivery
- Signed URLs for secure document access

### Security

- JWT-based authentication
- Role-based access control (RBAC)
- Encryption at rest and in transit
- Audit logging for all data modifications

---

## Future Enhancements (Post-MVP)

1. Email sending directly from client profile
2. SMS sending capability
3. Communication history tracking (email, call logs)
4. Calendar integration for task syncing
5. Automated duplicate detection
6. Client merge functionality
7. Custom fields for client profiles
8. Document categorization (custom categories)
9. Deal/transaction pipeline tracking
10. Advanced reporting and analytics
11. Mobile native apps (iOS/Android)
12. Client portal for document access
13. E-signature integration
14. Voice note recording
15. AI-driven task suggestions
16. Multi-language support

---

## Appendix

### Glossary

- **Agent**: Real estate professional using the CRM (realtor, loan officer)
- **Client**: Individual or entity managed by an agent in the CRM
- **Soft Delete**: Marking record as deleted without removing from database
- **Tag**: User-created label for organizing clients
- **Multi-tenancy**: Architecture supporting multiple isolated organizations

### References

- FollowUpBoss: Existing CRM
- GDPR: General Data Protection Regulation (EU data privacy law)
- WCAG 2.1 AA: Web Content Accessibility Guidelines

### Revision History

- 2026-01-06: Initial PRD created
