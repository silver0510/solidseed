---
allowed-tools: Bash, Read, Write, LS
---

# Create Initial Context

This command creates the initial project context documentation in `.claude/context/` by analyzing the current project state and establishing comprehensive baseline documentation.

## Required Rules

**IMPORTANT:** Before executing this command, read and follow:

- `.claude/rules/datetime.md` - For getting real current date/time
- `.claude/rules/database-operations.md` - For database schema conventions

## Preflight Checklist

Before proceeding, complete these validation steps.
Do not bother the user with preflight checks progress ("I'm not going to ..."). Just do them and move on.

### 1. Context Directory Check

- Run: `ls -la .claude/context/ 2>/dev/null`
- If directory exists and has files:
  - Count existing files: `ls -1 .claude/context/*.md 2>/dev/null | wc -l`
  - Ask user: "⚠️ Found {count} existing context files. Overwrite all context? (yes/no)"
  - Only proceed with explicit 'yes' confirmation
  - If user says no, suggest: "Use /context:update to refresh existing context"

### 2. Project Type Detection

- Check for project indicators:
  - Node.js: `test -f package.json && echo "Node.js project detected"`
  - Python: `test -f requirements.txt || test -f pyproject.toml && echo "Python project detected"`
  - Rust: `test -f Cargo.toml && echo "Rust project detected"`
  - Go: `test -f go.mod && echo "Go project detected"`
- Run: `git status 2>/dev/null` to confirm this is a git repository
- If not a git repo, ask: "⚠️ Not a git repository. Continue anyway? (yes/no)"

### 3. Directory Creation

- If `.claude/` doesn't exist, create it: `mkdir -p .claude/context/`
- Verify write permissions: `touch .claude/context/.test && rm .claude/context/.test`
- If permission denied, tell user: "❌ Cannot create context directory. Check permissions."

### 4. Get Current DateTime

- Run: `date -u +"%Y-%m-%dT%H:%M:%SZ"`
- Store this value for use in all context file frontmatter

### 5. Check Database Schema

- Check if `.claude/database/database.dbml` exists
- If exists, load it for database documentation in tech-stack.md
- If not, note: "⚠️ No database.dbml found. Consider running /pm:db-sync generate"

## Instructions

### 1. Pre-Analysis Validation

- Confirm project root directory is correct (presence of .git, package.json, etc.)
- Check for existing documentation that can inform context (README.md, docs/)
- If README.md doesn't exist, ask user for project description

### 2. Systematic Project Analysis

Gather information in this order:

**Project Detection:**

- Run: `find . -maxdepth 2 \( -name 'package.json' -o -name 'requirements.txt' -o -name 'pyproject.toml' -o -name 'pom.xml' -o -name 'build.gradle' -o -name 'build.gradle.kts' -o -name '*.sln' -o -name '*.csproj' -o -name 'Gemfile' -o -name 'Cargo.toml' -o -name 'go.mod' -o -name 'composer.json' -o -name 'pubspec.yaml' -o -name 'CMakeLists.txt' -o -name 'Dockerfile' -o -name 'docker-compose.yml' -o -name 'Package.swift' -o -type d -name '*.xcodeproj' -o -type d -name '*.xcworkspace' \) 2>/dev/null`
- Run: `git remote -v 2>/dev/null` to get repository information
- Run: `git branch --show-current 2>/dev/null` to get current branch

**Codebase Analysis:**

- Run: `find . -type f \( -name '*.js' -o -name '*.ts' -o -name '*.jsx' -o -name '*.tsx' -o -name '*.py' -o -name '*.rs' -o -name '*.go' -o -name '*.php' -o -name '*.swift' -o -name '*.java' -o -name '*.kt' -o -name '*.kts' -o -name '*.cs' -o -name '*.rb' -o -name '*.dart' -o -name '*.c' -o -name '*.h' -o -name '*.cpp' -o -name '*.hpp' -o -name '*.sh' \) 2>/dev/null | head -20`
- Run: `ls -la` to see root directory structure
- Read README.md if it exists

### 3. Context File Creation with Frontmatter

Each context file MUST include frontmatter with real datetime:

```yaml
---
created: [Use REAL datetime from date command]
last_updated: [Use REAL datetime from date command]
version: 1.0
author: Claude Code PM System
---
```

Generate the following initial context files:

#### Core Context Files (5 files):

1. **`README.md`** - Introduction to the context system
   - Purpose of context files
   - How to use context commands
   - Context workflow overview
   - No frontmatter required (static documentation)

2. **`progress.md`** - Current project status and recent work
   - Include: Current phase, completed tasks, next steps
   - Include: Recent commits, outstanding changes, blockers
   - Include: Timeline and milestone tracking

3. **`project.md`** - Consolidated project overview
   - Include: What we're building (elevator pitch)
   - Include: Current status (brief)
   - Include: Core features (3-5 main features with brief descriptions)
   - Include: Project scope (in scope, out of scope)
   - Include: Key decisions (technology choices, architecture decisions)
   - Include: Success metrics (MVP criteria, business metrics)
   - Include: Competitive advantages
   - Include: Project constraints and risks

4. **`tech-stack.md`** - Technology stack and architecture
   - Include: Core technologies (database, backend, frontend)
   - Include: Services & tools (email, monitoring, storage, testing)
   - Include: Architecture patterns (mobile-first, soft delete, auth patterns)
   - Include: Directory structure (streamlined version)
   - Include: Database schema overview from `.claude/database/database.dbml`:
     - List all tables with brief descriptions
     - Note table groups (authentication, client_hub, etc.)
     - Reference the DBML file for full details
   - Include: Environment variables (key variables)
   - Include: Integration requirements (setup instructions)
   - Include: Performance targets and cost analysis

5. **`style-guide.md`** - Coding standards and conventions
   - Include: Documentation standards (markdown, frontmatter, datetime)
   - Include: Code standards (naming, comments, error handling)
   - Include: Database standards (table names, migrations)
   - Include: API standards (endpoints, responses)
   - Include: Testing standards (test structure, coverage)
   - Include: Git standards (commits, branches)

### 4. Quality Validation

After creating each file:

- Verify file was created successfully
- Check file is not empty (minimum 10 lines of content)
- Ensure frontmatter is present and valid (except README.md)
- Validate markdown formatting is correct

### 5. Error Handling

**Common Issues:**

- **No write permissions:** "❌ Cannot write to .claude/context/. Check permissions."
- **Disk space:** "❌ Insufficient disk space for context files."
- **File creation failed:** "❌ Failed to create {filename}. Error: {error}"

If any file fails to create:

- Report which files were successfully created
- Provide option to continue with partial context
- Never leave corrupted or incomplete files

### 6. Post-Creation Summary

Provide comprehensive summary:

```
📋 Context Creation Complete

📁 Created context in: .claude/context/
✅ Files created: {count}/5

📊 Context Summary:
  - Project Type: {detected_type}
  - Language: {primary_language}
  - Git Status: {clean/changes}
  - Dependencies: {count} packages

📝 File Details:
  ✅ README.md ({lines} lines) - Context system documentation
  ✅ progress.md ({lines} lines) - Current status and next steps
  ✅ project.md ({lines} lines) - Project overview and scope
  ✅ tech-stack.md ({lines} lines) - Technology stack and architecture
  ✅ style-guide.md ({lines} lines) - Coding standards

⏰ Created: {timestamp}
🔄 Next: Use /context:prime to load context in new sessions
💡 Tip: Run /context:update regularly to keep context current
```

## Context Gathering Commands

Use these commands to gather project information:

- Target directory: `.claude/context/` (create if needed)
- Current git status: `git status --short`
- Recent commits: `git log --oneline -10`
- Project README: Read `README.md` if exists
- Package files: Check for package.json, requirements.txt, pyproject.toml, composer.json, Gemfile, Cargo.toml, go.mod, pom.xml, build.gradle, build.gradle.kts, _.sln, _.csproj, Package.swift, _.xcodeproj, _.xcworkspace, pubspec.yaml, CMakeLists.txt, Dockerfile, or docker-compose.yml etc.
- Documentation scan: `find . -type f -name '*.md' -path '*/docs/*' 2>/dev/null | head -10`
- Test detection: `find . \( -path '*/.*' -prune \) -o \( -type d \( -name 'test' -o -name 'tests' -o -name '__tests__' -o -name 'spec' \) -o -type f \( -name '*[._]test.*' -o -name '*[._]spec.*' -o -name 'test_*.*' -o -name '*_test.*' \) \) 2>/dev/null | head -10`

## Important Notes

- **Always use real datetime** from system clock, never placeholders
- **Ask for confirmation** before overwriting existing context
- **Validate each file** is created successfully
- **Provide detailed summary** of what was created
- **Handle errors gracefully** with specific guidance

$ARGUMENTS
