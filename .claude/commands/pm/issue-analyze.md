---
allowed-tools: Bash, Read, Write, LS
---

# Issue Analyze

Analyze a task to identify parallel work streams for maximum efficiency.

Works with both GitHub-synced issues and local-only tasks.

## Usage

```bash
# GitHub issue (synced)
/pm:issue-analyze <issue_number>

# Local task (not synced)
/pm:issue-analyze <task_path>

# Examples
/pm:issue-analyze 123                                    # GitHub issue #123
/pm:issue-analyze .claude/epics/user-authentication/001.md  # Local task
/pm:issue-analyze user-authentication/001                   # Shorthand for local task
```

## Quick Check

### 1. Detect Input Type and Load Task

```bash
# Check if argument is numeric (GitHub issue)
if [[ "$ARGUMENTS" =~ ^[0-9]+$ ]]; then
  MODE="github"
  ISSUE_NUMBER="$ARGUMENTS"

  # Find local task file
  TASK_FILE=$(find .claude/epics -name "$ISSUE_NUMBER.md" -o -path "*/$ISSUE_NUMBER.md" | head -1)

  if [ -z "$TASK_FILE" ]; then
    echo "❌ No local task for issue #$ISSUE_NUMBER"
    echo "Run: /pm:import first"
    exit 1
  fi

  TASK_NUMBER="$ISSUE_NUMBER"
  TASK_ID="issue #$ISSUE_NUMBER"
else
  MODE="local"
  TASK_PATH="$ARGUMENTS"

  # Normalize path
  if [[ "$TASK_PATH" == .claude/epics/* ]]; then
    TASK_FILE="$TASK_PATH"
  elif [[ "$TASK_PATH" == */*.md ]]; then
    TASK_FILE=".claude/epics/$TASK_PATH"
  elif [[ "$TASK_PATH" == */* ]]; then
    TASK_FILE=".claude/epics/$TASK_PATH.md"
  else
    echo "❌ Invalid task path format"
    echo "Use: epic-name/task-number or full path"
    exit 1
  fi

  # Check file exists
  if [ ! -f "$TASK_FILE" ]; then
    echo "❌ Task file not found: $TASK_FILE"
    exit 1
  fi

  TASK_NUMBER=$(basename "$TASK_FILE" .md)
  TASK_ID="task $TASK_NUMBER"
fi

# Extract epic name
EPIC_NAME=$(echo "$TASK_FILE" | sed 's|.claude/epics/||' | sed 's|/.*||')
```

### 2. Check for Existing Analysis

```bash
ANALYSIS_FILE=".claude/epics/$EPIC_NAME/$TASK_NUMBER-analysis.md"

if [ -f "$ANALYSIS_FILE" ]; then
  echo "⚠️ Analysis already exists for $TASK_ID"
  echo "Overwrite? (yes/no)"
  # Only proceed with explicit 'yes'
fi
```

## Instructions

### 1. Read Task Context

**For GitHub Issues (MODE=github)**:

Get issue details from GitHub:

```bash
gh issue view $ISSUE_NUMBER --json title,body,labels
```

**For Both Modes**:

Read local task file (`$TASK_FILE`) to understand:

- Description
- Checklist items
- Referenced epic sections
- Dependencies
- Effort estimate

Also read epic.md to understand full technical context.

### 2. Identify Parallel Work Streams

Analyze the issue to identify independent work that can run in parallel:

**Common Patterns:**

- **Database Layer**: Schema, migrations, models
- **Service Layer**: Business logic, data access
- **API Layer**: Endpoints, validation, middleware
- **UI Layer**: Components, pages, styles
- **Test Layer**: Unit tests, integration tests
- **Documentation**: API docs, README updates

**Key Questions:**

- What files will be created/modified?
- Which changes can happen independently?
- What are the dependencies between changes?
- Where might conflicts occur?

### 3. Create Analysis File

Get current datetime: `date -u +"%Y-%m-%dT%H:%M:%SZ"`

Create `$ANALYSIS_FILE` (determined in Quick Check):

```markdown
---
task: $TASK_NUMBER
title: { task_title }
analyzed: { current_datetime }
estimated_hours: { total_hours }
parallelization_factor: { 1.0-5.0 }
---

# Parallel Work Analysis: {TASK_ID}

## Overview

{Brief description of what needs to be done}

## Parallel Streams

### Stream A: {Stream Name}

**Scope**: {What this stream handles}
**Files**:

- {file_pattern_1}
- {file_pattern_2}
  **Agent Type**: {backend|frontend|fullstack|database}-specialist
  **Can Start**: immediately
  **Estimated Hours**: {hours}
  **Dependencies**: none

### Stream B: {Stream Name}

**Scope**: {What this stream handles}
**Files**:

- {file_pattern_1}
- {file_pattern_2}
  **Agent Type**: {agent_type}
  **Can Start**: immediately
  **Estimated Hours**: {hours}
  **Dependencies**: none

### Stream C: {Stream Name}

**Scope**: {What this stream handles}
**Files**:

- {file_pattern_1}
  **Agent Type**: {agent_type}
  **Can Start**: after Stream A completes
  **Estimated Hours**: {hours}
  **Dependencies**: Stream A

## Coordination Points

### Shared Files

{List any files multiple streams need to modify}:

- `src/types/index.ts` - Streams A & B (coordinate type updates)
- Project configuration files (package.json, pom.xml, Cargo.toml, etc.) - Stream B (add dependencies)
- Build configuration files (build.gradle, CMakeLists.txt, etc.) - Stream C (build system changes)

### Sequential Requirements

{List what must happen in order}:

1. Database schema before API endpoints
2. API types before UI components
3. Core logic before tests

## Conflict Risk Assessment

- **Low Risk**: Streams work on different directories
- **Medium Risk**: Some shared type files, manageable with coordination
- **High Risk**: Multiple streams modifying same core files

## Parallelization Strategy

**Recommended Approach**: {sequential|parallel|hybrid}

{If parallel}: Launch Streams A, B simultaneously. Start C when A completes.
{If sequential}: Complete Stream A, then B, then C.
{If hybrid}: Start A & B together, C depends on A, D depends on B & C.

## Expected Timeline

With parallel execution:

- Wall time: {max_stream_hours} hours
- Total work: {sum_all_hours} hours
- Efficiency gain: {percentage}%

Without parallel execution:

- Wall time: {sum_all_hours} hours

## Notes

{Any special considerations, warnings, or recommendations}
```

### 4. Validate Analysis

Ensure:

- All major work is covered by streams
- File patterns don't unnecessarily overlap
- Dependencies are logical
- Agent types match the work type
- Time estimates are reasonable

### 5. Output

**For GitHub Issues**:

```
✅ Analysis complete for issue #$ISSUE_NUMBER

Identified {count} parallel work streams:
  Stream A: {name} ({hours}h)
  Stream B: {name} ({hours}h)
  Stream C: {name} ({hours}h)

Parallelization potential: {factor}x speedup
  Sequential time: {total}h
  Parallel time: {reduced}h

Files at risk of conflict:
  {list shared files if any}

Next: Start work with /pm:issue-start $ISSUE_NUMBER
```

**For Local Tasks**:

```
✅ Analysis complete for task $TASK_NUMBER

Identified {count} parallel work streams:
  Stream A: {name} ({hours}h)
  Stream B: {name} ({hours}h)
  Stream C: {name} ({hours}h)

Parallelization potential: {factor}x speedup
  Sequential time: {total}h
  Parallel time: {reduced}h

Files at risk of conflict:
  {list shared files if any}

Next: Start work with /pm:issue-start $TASK_PATH
Note: This is a local-only task (not synced to GitHub)
```

## Important Notes

- Analysis is local only - not synced to GitHub
- Focus on practical parallelization, not theoretical maximum
- Consider agent expertise when assigning streams
- Account for coordination overhead in estimates
- Prefer clear separation over maximum parallelization
