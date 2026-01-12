# Claude Code Project Management (CCPM)

A markdown-based project management system integrated into the `.claude/` directory. CCPM works entirely offline with optional GitHub integration.

## Quick Start

```bash
# 1. Start a new session
/context:prime

# 2. Create requirements
/pm:prd-new feature-name

# 3. Generate technical plan
/pm:prd-parse feature-name

# 4. Break into tasks
/pm:epic-decompose feature-name

# 5. View your work
/pm:epic-show feature-name
```

## Directory Structure

```
.claude/
├── CCPM-README.md              # This file - CCPM documentation
├── prds/                       # Product Requirements Documents
│   └── feature-name.md
├── epics/                      # Technical implementation plans
│   └── feature-name/
│       ├── epic.md             # Technical plan
│       ├── 001.md              # Task files
│       ├── 002.md
│       └── ...
├── database/                   # Database schema documentation
│   └── database.dbml           # DBML schema (source of truth)
├── context/                    # Project context files
│   ├── README.md
│   ├── project.md
│   ├── tech-stack.md
│   ├── progress.md
│   └── style-guide.md
├── commands/                   # Slash command definitions
│   ├── pm/                     # Project management commands
│   ├── context/                # Context commands
│   └── testing/                # Test commands
├── rules/                      # Development guidelines
├── skills/                     # Reusable skill definitions
├── agents/                     # Specialized agent configurations
└── ccpm.config                 # GitHub repository configuration
```

## Workflows

### Context Workflow

Manage project understanding across sessions:

| Step | Command | When |
|------|---------|------|
| Initialize | `/context:create` | Project start (once) |
| Load | `/context:prime` | Session start |
| Save | `/context:update` | Session end |

### Feature Development Workflow

```mermaid
graph LR
    A[PRD] --> B[Epic]
    B --> C[Tasks]
    C --> D[Implementation]
    D --> E[Complete]
```

1. **Create PRD**: `/pm:prd-new feature-name`
2. **Parse to Epic**: `/pm:prd-parse feature-name`
3. **Decompose Tasks**: `/pm:epic-decompose feature-name`
4. **Start Work**: `/pm:issue-start epic-name 001`
5. **Complete Task**: `/pm:issue-complete epic-name 001`

### Database Schema Workflow

CCPM maintains database schema documentation in DBML format:

| Step | Command | Description |
|------|---------|-------------|
| Validate | `/pm:db-sync validate` | Check DBML matches migrations |
| Update | `/pm:db-sync update` | Update DBML from migrations |
| Generate | `/pm:db-sync generate` | Regenerate DBML from scratch |

The `database.dbml` file is automatically referenced by:
- `/pm:prd-parse` - References existing schema when designing features
- `/pm:epic-decompose` - Ensures database tasks include DBML updates
- `/context:prime` - Loads schema as part of project understanding
- `/context:create` - Includes schema in tech-stack documentation
- `/context:update` - Detects schema changes

## Command Reference

### Context Commands

| Command | Description |
|---------|-------------|
| `/context:create` | Initialize project context documentation |
| `/context:prime` | Load context for new session |
| `/context:update` | Update context after development |

### PRD Commands

| Command | Description |
|---------|-------------|
| `/pm:prd-new <name>` | Create new Product Requirements Document |
| `/pm:prd-parse <name>` | Convert PRD to technical epic |
| `/pm:prd-list` | List all PRDs |
| `/pm:prd-status` | Show PRD statuses |
| `/pm:prd-edit <name>` | Edit existing PRD |

### Epic Commands

| Command | Description |
|---------|-------------|
| `/pm:epic-decompose <name>` | Break epic into tasks |
| `/pm:epic-show <name>` | View epic and all tasks |
| `/pm:epic-list` | List all epics |
| `/pm:epic-status <name>` | Show epic status |
| `/pm:epic-edit <name>` | Edit epic details |
| `/pm:epic-close <name>` | Close completed epic |
| `/pm:epic-refresh <name>` | Refresh epic from PRD |

### Task/Issue Commands

| Command | Description |
|---------|-------------|
| `/pm:issue-show <epic> <number>` | View task details |
| `/pm:issue-start <epic> <number>` | Start working on task |
| `/pm:issue-complete <epic> <number>` | Mark task complete |
| `/pm:issue-close <epic> <number>` | Close task |
| `/pm:issue-reopen <epic> <number>` | Reopen closed task |
| `/pm:issue-edit <epic> <number>` | Edit task |
| `/pm:issue-analyze <epic> <number>` | Analyze task for implementation |

### Database Commands

| Command | Description |
|---------|-------------|
| `/pm:db-sync` | Validate DBML against migrations (default) |
| `/pm:db-sync validate` | Check DBML matches migrations |
| `/pm:db-sync update` | Update DBML from migrations |
| `/pm:db-sync generate` | Regenerate DBML from scratch |

### Status Commands

| Command | Description |
|---------|-------------|
| `/pm:status` | Project dashboard |
| `/pm:next` | Show next priority tasks |
| `/pm:in-progress` | Show tasks in progress |
| `/pm:blocked` | Show blocked tasks |
| `/pm:standup` | Generate standup summary |
| `/pm:search <term>` | Search across all files |
| `/pm:validate` | Check file integrity |

### GitHub Sync Commands (Optional)

| Command | Description |
|---------|-------------|
| `/pm:epic-sync <name>` | Push epic to GitHub Issues |
| `/pm:issue-sync <epic> <number>` | Sync task with GitHub |
| `/pm:sync` | Bidirectional GitHub sync |
| `/pm:epic-oneshot <name>` | Create and sync in one step |

### Utility Commands

| Command | Description |
|---------|-------------|
| `/pm:help` | Show help information |
| `/pm:init` | Initialize CCPM structure |
| `/pm:clean` | Clean up stale files |
| `/pm:import` | Import from external source |

## File Formats

### PRD Frontmatter

```yaml
---
name: feature-name
description: Brief description
status: backlog  # backlog, in-progress, complete
created: 2026-01-12T10:00:00Z
updated: 2026-01-12T10:00:00Z
---
```

### Epic Frontmatter

```yaml
---
name: feature-name
status: backlog  # backlog, in-progress, completed
created: 2026-01-12T10:00:00Z
progress: 0%
prd: .claude/prds/feature-name.md
github: # Updated when synced
---
```

### Task Frontmatter

```yaml
---
name: Task Title
status: open  # open, in-progress, closed
created: 2026-01-12T10:00:00Z
updated: 2026-01-12T10:00:00Z
github: # Updated when synced
depends_on: [001, 002]  # Task dependencies
parallel: true  # Can run in parallel?
---
```

### DBML Format

```dbml
Table table_name {
  id varchar(255) [pk, note: 'Unique identifier (CUID)']
  field_name type [constraints, note: 'Description']
  created_at timestamptz [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    field_name [name: 'idx_table_field']
  }

  note: 'Table description'
}
```

## Rules Reference

CCPM includes development rules in `.claude/rules/`:

| Rule | Purpose |
|------|---------|
| `datetime.md` | ISO 8601 datetime standards |
| `database-operations.md` | DBML conventions and integration |
| `frontmatter-operations.md` | YAML frontmatter standards |
| `path-standards.md` | Relative path requirements |
| `github-operations.md` | GitHub CLI patterns |
| `standard-patterns.md` | Common command patterns |
| `strip-frontmatter.md` | Removing frontmatter for GitHub |
| `test-execution.md` | Test running standards |
| `branch-operations.md` | Git branch patterns |
| `worktree-operations.md` | Git worktree patterns |
| `agent-coordination.md` | Multi-agent coordination |
| `use-ast-grep.md` | AST-Grep integration |

## Local Mode Benefits

CCPM works entirely offline:

- **No external dependencies** - Works without GitHub/internet
- **Full privacy** - All data stays local
- **Version control friendly** - All files are markdown
- **Team collaboration** - Share `.claude/` directory via git
- **Customizable** - Edit templates and workflows freely
- **Fast** - No API calls or network delays

## Manual Task Management

Update task status directly in frontmatter:

```markdown
---
name: Implement user login API
status: in-progress  # Change: open → in-progress → closed
updated: 2026-01-12T15:30:00Z  # Update timestamp
---
```

Status progression: `open` → `in-progress` → `closed`

## Best Practices

### Context Management

1. Run `/context:prime` at session start
2. Run `/context:update` at session end
3. Keep context files under 500 lines each

### Task Organization

1. Keep tasks small (1-3 days each)
2. Use `depends_on` for sequential tasks
3. Mark `parallel: true` for independent tasks
4. Include "Tests written" in every checklist

### Database Schema

1. Always update `database.dbml` when creating migrations
2. Run `/pm:db-sync validate` before starting database work
3. Include DBML updates in database task checklists
4. Follow existing naming conventions from DBML

### PRD to Implementation

1. Write complete PRDs before parsing
2. Review epic before decomposing
3. Keep tasks focused and atomic
4. Reference epic sections, don't duplicate content

## Changelog

### 2026-01-12
- Added database schema documentation (`database.dbml`)
- Added `/pm:db-sync` command
- Updated commands to reference DBML:
  - `/pm:prd-parse` - References existing schema
  - `/pm:epic-decompose` - Ensures DBML update tasks
  - `/context:prime` - Loads schema
  - `/context:create` - Documents schema
  - `/context:update` - Detects schema changes
- Added `database-operations.md` rule

---

*This file is updated each time the CCPM workflow improves. Last updated: 2026-01-12*
