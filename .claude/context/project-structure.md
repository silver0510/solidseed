---
created: 2026-01-06T09:03:33Z
last_updated: 2026-01-07T00:56:54Z
version: 2.0
author: Claude Code PM System
---

# Project Structure

## Directory Organization

```
Korella/
├── .claude/                         # Project management and configuration
│   ├── agents/                      # Specialized agent configurations
│   │   ├── backend-development/
│   │   ├── better-auth/
│   │   ├── code-analyzer/
│   │   ├── parallel-worker/
│   │   └── test-runner/
│   ├── ccpm/                        # CCPM system files
│   │   └── scripts/                 # PM command scripts
│   ├── commands/                    # Custom slash commands
│   │   ├── context/                 # Context management commands
│   │   ├── pm/                      # Project management commands (40+ files)
│   │   ├── testing/                 # Test execution commands
│   │   ├── code-rabbit.md
│   │   ├── prompt.md
│   │   └── re-init.md
│   ├── context/                     # Project context documentation
│   │   ├── progress.md              # Current status and next steps
│   │   ├── project-structure.md     # This file
│   │   ├── tech-context.md          # Technologies and dependencies
│   │   ├── system-patterns.md       # Architecture patterns
│   │   ├── product-context.md       # Product requirements
│   │   ├── project-brief.md         # Project scope and goals
│   │   ├── project-overview.md      # Features and capabilities
│   │   ├── project-vision.md        # Long-term direction
│   │   ├── project-style-guide.md   # Coding standards
│   │   └── README.md                # Context system documentation
│   ├── epics/                       # Technical implementation plans
│   │   └── user-authentication/     # User auth epic
│   │       ├── epic.md              # Technical plan and architecture
│   │       ├── 001.md               # Database schema task
│   │       ├── 002.md               # Better Auth integration
│   │       ├── 003.md               # Core API endpoints
│   │       ├── 004.md               # Password management
│   │       ├── 005.md               # Session management
│   │       ├── 006.md               # Frontend UI
│   │       ├── 007.md               # Email service
│   │       ├── 008.md               # OAuth provider setup
│   │       ├── 009.md               # Trial period integration
│   │       └── 010.md               # Testing and deployment
│   ├── hooks/                       # Git hooks and automation
│   │   ├── README.md
│   │   └── user-prompt-submit.sh.example
│   ├── prds/                        # Product Requirements Documents
│   │   ├── client-hub.md            # Client management feature
│   │   └── user-authentication.md   # Authentication system
│   ├── rules/                       # Development guidelines
│   │   ├── agent-coordination.md    # Multi-agent patterns
│   │   ├── branch-operations.md     # Git branch workflows
│   │   ├── datetime.md              # ISO 8601 standards
│   │   ├── frontmatter-operations.md
│   │   ├── github-operations.md     # GitHub CLI patterns
│   │   ├── path-standards.md        # Relative path requirements
│   │   ├── standard-patterns.md     # Command patterns
│   │   ├── strip-frontmatter.md     # Frontmatter handling
│   │   ├── test-execution.md        # Testing standards
│   │   ├── use-ast-grep.md          # AST-based search
│   │   └── worktree-operations.md   # Git worktree workflows
│   ├── skills/                      # Reusable skill definitions
│   │   ├── backend-development/
│   │   ├── better-auth/             # Better Auth automation
│   │   ├── frontend-development/
│   │   ├── ui-styling/              # Tailwind/shadcn automation
│   │   └── ui-ux-pro-max/
│   ├── ccpm.config                  # GitHub repo configuration
│   ├── settings.json.example        # Settings template
│   └── settings.local.json          # Local settings (gitignored)
├── CLAUDE.md                        # Developer guide for Claude Code
└── LOCAL_MODE.md                    # Local workflow documentation
```

## Key Directory Purposes

### `.claude/` - Project Management Hub

The `.claude/` directory is the heart of the CCPM (Claude Code Project Management) system. All project documentation, requirements, tasks, and configurations live here.

### `.claude/prds/` - Requirements

Product Requirements Documents that define features from a user perspective:

- Business value and problem statements
- User stories and personas
- Acceptance criteria
- Database schemas
- Out of scope items

**Naming Convention:** `feature-name.md` (lowercase, hyphen-separated)

### `.claude/epics/` - Technical Plans

Each epic is a subdirectory containing:

- `epic.md` - Overall technical plan, architecture decisions, API designs
- `###.md` - Individual implementation tasks (001.md, 002.md, etc.)

**Naming Convention:** `feature-name/` directory, numbered task files

### `.claude/commands/` - Slash Commands

Custom commands organized by category:

- `pm/` - Project management (prd-new, epic-decompose, status, etc.)
- `context/` - Context system (create, prime, update)
- `testing/` - Test execution (run, prime)

Each command is a markdown file with frontmatter defining allowed tools.

### `.claude/rules/` - Development Standards

Guidelines that all code and commands must follow:

- `datetime.md` - Always use real system time, ISO 8601 format
- `path-standards.md` - Use relative paths, never expose local structure
- `github-operations.md` - GitHub CLI patterns and protections
- `standard-patterns.md` - Command consistency requirements

### `.claude/skills/` - Automation Skills

Reusable automation scripts for common tasks:

- `better-auth/` - Better Auth initialization scripts
- `ui-styling/` - Tailwind and shadcn/ui automation
- Python-based scripts with tests

### `.claude/context/` - Living Documentation

Project knowledge base that evolves with the codebase:

- Current progress and status
- Technical context and dependencies
- Architecture patterns
- Product requirements
- Style guides

## File Naming Patterns

### Frontmatter Files

All PRDs, epics, and tasks use YAML frontmatter:

```yaml
---
name: feature-name
status: open | in-progress | completed
created: 2026-01-06T09:03:33Z
updated: 2026-01-06T09:03:33Z
---
```

### Task Numbering

Tasks within epics are zero-padded three-digit numbers:

- `001.md` - First task (usually database/foundation)
- `002.md` - Second task
- `010.md` - Tenth task

Allows for up to 999 tasks per epic (typically 5-15 tasks).

### Documentation Files

- `README.md` - Informational documentation
- `CLAUDE.md` - Developer guide for AI assistants
- `LOCAL_MODE.md` - Workflow documentation
- All lowercase with hyphens: `project-brief.md`

## Module Organization

### Project Management (`.claude/commands/pm/`)

40+ commands organized functionally:

- PRD lifecycle: `prd-new`, `prd-parse`, `prd-list`, `prd-edit`, `prd-status`
- Epic management: `epic-decompose`, `epic-sync`, `epic-show`, `epic-status`
- Issue tracking: `issue-start`, `issue-sync`, `issue-close`, `issue-analyze`
- Workflow: `status`, `next`, `standup`, `blocked`, `in-progress`
- Maintenance: `clean`, `validate`, `search`, `init`

### Context System (`.claude/commands/context/`)

3 core commands:

- `create` - Initialize project context
- `prime` - Load context for new session
- `update` - Refresh context after changes

### Agents (`.claude/agents/`)

Specialized agent configurations for:

- Backend development
- Better Auth setup
- Code analysis
- Parallel execution
- Test running

## Integration Points

### Git Integration

- Not currently a git repository (git status failed)
- CCPM supports git worktrees and branches
- Rules defined in `.claude/rules/branch-operations.md`

### GitHub Integration (Optional)

- CCPM can sync to GitHub Issues
- `.claude/ccpm.config` manages repository detection
- Protection against syncing to wrong repository

### Local-Only Mode

- Full functionality without GitHub
- All data in `.claude/` directory
- Version control friendly (all markdown files)
- See `LOCAL_MODE.md` for complete workflow

## Application Structure (Finalized - Next.js 15 App Router)

When implementation begins, the application will follow this structure:

```
Korella/
├── .claude/                         # Project management (existing)
├── app/                             # Next.js App Router
│   ├── (auth)/                      # Auth route group (public)
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── verify-email/
│   │   │   └── page.tsx
│   │   ├── reset-password/
│   │   │   └── page.tsx
│   │   └── layout.tsx               # Auth layout (logo, centered form)
│   ├── (dashboard)/                 # Dashboard route group (protected)
│   │   ├── clients/
│   │   │   ├── page.tsx             # Client list
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx         # Client details
│   │   │   │   ├── documents/
│   │   │   │   ├── notes/
│   │   │   │   └── tasks/
│   │   │   └── new/
│   │   │       └── page.tsx         # New client form
│   │   ├── documents/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   ├── profile/
│   │   │   ├── email/               # Phase 2: Email integration
│   │   │   └── billing/
│   │   ├── layout.tsx               # Dashboard layout (sidebar, nav)
│   │   └── page.tsx                 # Dashboard home
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...all]/
│   │   │       └── route.ts         # Better Auth API handler
│   │   ├── clients/
│   │   │   ├── route.ts             # GET (list), POST (create)
│   │   │   └── [id]/
│   │   │       └── route.ts         # GET, PUT, DELETE
│   │   ├── documents/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── notes/
│   │   │   └── route.ts
│   │   ├── tasks/
│   │   │   └── route.ts
│   │   ├── webhooks/                # Phase 2: Email tracking
│   │   │   ├── nylas/
│   │   │   └── inngest/
│   │   └── health/
│   │       └── route.ts             # Health check endpoint
│   ├── layout.tsx                   # Root layout (fonts, providers)
│   ├── page.tsx                     # Landing page (public)
│   ├── error.tsx                    # Error boundary
│   ├── not-found.tsx                # 404 page
│   └── loading.tsx                  # Loading state
├── components/
│   ├── ui/                          # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   └── ...                      # 45+ components
│   ├── forms/                       # Reusable form components
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   ├── client-form.tsx
│   │   └── ...
│   ├── layouts/                     # Layout components
│   │   ├── dashboard-header.tsx
│   │   ├── sidebar.tsx
│   │   └── mobile-nav.tsx
│   └── providers/                   # Context providers
│       ├── auth-provider.tsx
│       ├── query-provider.tsx
│       └── theme-provider.tsx
├── lib/
│   ├── auth.ts                      # Better Auth configuration
│   ├── db.ts                        # Supabase client initialization
│   ├── api-client.ts                # Fetch wrapper with JWT injection
│   ├── utils.ts                     # Utility functions
│   ├── storage.ts                   # Supabase Storage client
│   ├── email.ts                     # Resend email client (Phase 1)
│   ├── nylas.ts                     # Nylas client (Phase 2)
│   └── validations/                 # Zod schemas
│       ├── auth.ts
│       ├── client.ts
│       └── document.ts
├── features/                        # Feature-based modules
│   ├── auth/                        # Authentication feature
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── clients/                     # Client management
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── documents/                   # Document management
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   └── email-marketing/             # Phase 2: Email campaigns
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── types/
├── supabase/
│   ├── migrations/                  # Database migrations
│   │   ├── 20260107_create_auth_tables.sql
│   │   ├── 20260107_create_client_tables.sql
│   │   └── ...
│   └── seed.sql                     # Seed data (optional)
├── tests/
│   ├── unit/                        # Vitest unit tests
│   │   ├── lib/
│   │   ├── components/
│   │   └── features/
│   ├── integration/                 # Vitest integration tests
│   │   ├── api/
│   │   └── auth/
│   └── e2e/                         # Playwright E2E tests
│       ├── auth.spec.ts
│       ├── clients.spec.ts
│       └── ...
├── public/                          # Static assets
│   ├── manifest.json                # PWA manifest
│   ├── sw.js                        # Service worker (generated)
│   ├── icons/                       # App icons
│   ├── images/
│   └── fonts/
├── emails/                          # React Email templates
│   ├── verification.tsx
│   ├── password-reset.tsx
│   └── welcome.tsx
├── .claude/                         # (documented above)
├── .env.local                       # Environment variables (gitignored)
├── .env.example                     # Environment template
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json                    # TypeScript configuration
├── next.config.js                   # Next.js configuration
├── tailwind.config.ts               # Tailwind configuration
├── postcss.config.js                # PostCSS configuration
├── vitest.config.ts                 # Vitest configuration
├── playwright.config.ts             # Playwright configuration
├── CLAUDE.md                        # Developer guide
├── LOCAL_MODE.md                    # Local workflow guide
└── README.md                        # Project README
```

## File Organization Principles

### Route Groups (Next.js App Router)

- **`(auth)`** - Public authentication pages (login, register, verify)
- **`(dashboard)`** - Protected application pages (requires authentication)

Route groups don't affect URLs but allow different layouts.

### Feature Modules

Each feature in `features/` follows this structure:

```
feature-name/
├── components/     # Feature-specific components
├── hooks/          # Custom React hooks
├── services/       # API calls and business logic
└── types/          # TypeScript type definitions
```

This keeps related code together and enables easy feature extraction.

### API Routes

RESTful API structure:

- `GET /api/clients` - List all clients
- `POST /api/clients` - Create client
- `GET /api/clients/[id]` - Get single client
- `PUT /api/clients/[id]` - Update client
- `DELETE /api/clients/[id]` - Delete client

All routes follow this pattern for consistency.

## Component Organization

### shadcn/ui Components (`components/ui/`)

Install via CLI: `npx shadcn-ui@latest add button`

Components are copied into the codebase (not npm packages) for full customization.

### Custom Components

- **Forms** - Reusable form components with React Hook Form + Zod
- **Layouts** - Page structure components (headers, sidebars)
- **Providers** - Context providers for global state

### Mobile-First Design

All components designed for:

- Minimum width: 375px (iPhone SE)
- Touch targets: 44x44px minimum
- Responsive breakpoints: xs, sm, md, lg
- Progressive enhancement for desktop

## Notes

- Tech stack finalized: Next.js 15, Tailwind, shadcn/ui, TanStack Query, Zustand
- Application structure defined but no code written yet
- Ready to begin implementation with `npm create next-app@latest`
- Structure optimized for mobile-first CRM platform
- Feature-based organization for scalability
- PWA capabilities included for offline support
- TypeScript throughout for type safety
