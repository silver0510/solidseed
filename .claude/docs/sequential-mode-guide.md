# Sequential Mode Guide

## Overview

The PM system now supports two execution modes:
- **Parallel Mode** (default): Analyzes tasks into work streams and executes them simultaneously with multiple agents
- **Sequential Mode** (`--sequential`): Creates step-by-step plans and executes one step at a time

## When to Use Sequential Mode

Use `--sequential` when:
- Task requires strict ordering of steps
- You want simpler coordination (no parallel agent conflicts)
- Learning/educational purposes (easier to follow)
- Task is simple enough that parallelization adds complexity
- You prefer predictable, linear progress

Use **parallel mode** (default) when:
- Task has independent components that can be built simultaneously
- Speed is important (multiple agents working in parallel)
- Task complexity justifies parallel execution
- You're comfortable with agent coordination

## Usage

### Step 1: Analyze the Task

**Parallel Mode (default)**:
```bash
/pm:issue-analyze client-hub/003
```
Creates analysis with parallel work streams (Stream A, Stream B, Stream C).

**Sequential Mode**:
```bash
/pm:issue-analyze client-hub/003 --sequential
```
Creates analysis with ordered steps (Step 1, Step 2, Step 3).

### Step 2: Start the Task

**Parallel Mode**:
```bash
/pm:issue-start client-hub/003
```
Launches multiple agents simultaneously to work on different streams.

**Sequential Mode**:
```bash
/pm:issue-start client-hub/003 --sequential
```
Executes one step at a time, waiting for each to complete before starting the next.

## Mode Validation

The system validates that analysis mode matches execution mode:

```bash
# This will FAIL:
/pm:issue-analyze client-hub/003              # Creates parallel analysis
/pm:issue-start client-hub/003 --sequential   # Tries to run sequential

# Error: Analysis is for parallel mode, but --sequential requested
```

**Fix**: Re-analyze with the correct mode or start without `--sequential`.

## TDD Support

Both modes support TDD workflow with the `--tdd` flag:

```bash
# Parallel + TDD
/pm:issue-analyze client-hub/003
/pm:issue-start client-hub/003 --tdd

# Sequential + TDD
/pm:issue-analyze client-hub/003 --sequential
/pm:issue-start client-hub/003 --sequential --tdd
```

## Analysis Output Differences

### Parallel Mode Analysis

```markdown
## Parallel Streams

### Stream A: Service Layer
**Scope**: Implement ClientService class
**Files**: src/services/ClientService.ts
**Agent Type**: general-purpose
**Skills**: backend-development
**Can Start**: immediately
**Estimated Hours**: 3h

### Stream B: API Endpoints
**Scope**: Create REST API endpoints
**Files**: src/api/clients/*.ts
**Agent Type**: general-purpose
**Skills**: backend-development
**Can Start**: after Stream A
**Estimated Hours**: 2h
```

### Sequential Mode Analysis

```markdown
## Implementation Steps

### Step 1: Setup ClientService

**Objective**: Create base service class with Supabase integration

**Actions**:
1. Create ClientService class
2. Add Supabase client initialization
3. Add type definitions

**Files**:
- src/services/ClientService.ts
- src/types/client.ts

**Agent Type**: general-purpose
**Skills**: backend-development
**Estimated Hours**: 2h
**Prerequisites**: none

**Completion Criteria**:
- [ ] ClientService class created
- [ ] Supabase client integrated
- [ ] Types defined

### Step 2: Implement CRUD Methods

**Objective**: Add create, read, update, delete methods

**Actions**:
1. Implement create() method
2. Implement findAll() method
3. Implement update() method
4. Implement softDelete() method

**Files**:
- src/services/ClientService.ts

**Agent Type**: general-purpose
**Skills**: backend-development
**Estimated Hours**: 3h
**Prerequisites**: Step 1 must be complete

**Completion Criteria**:
- [ ] All CRUD methods implemented
- [ ] RLS policies respected
- [ ] Error handling added
```

## Execution Differences

### Parallel Mode Execution

```
✅ Started parallel work on task 003

Mode: Parallel execution

Launching 3 parallel agents:
  Stream A: Service Layer (Agent-1) ✓ Started
  Stream B: API Endpoints (Agent-2) ✓ Started
  Stream C: Tests - Waiting (depends on A, B)

Progress tracking:
  .claude/epics/client-hub/updates/003/
  - stream-A.md
  - stream-B.md
  - stream-C.md (starts after A & B complete)
```

### Sequential Mode Execution

```
✅ Started sequential work on task 003

Mode: Sequential execution (one step at a time)

Executing 4 steps in order:
  Step 1: Setup ClientService (2h) ⏳ In Progress
  Step 2: Implement CRUD Methods (3h) ⏸ Waiting
  Step 3: Create API Endpoints (2h) ⏸ Waiting
  Step 4: Add Tests (1h) ⏸ Waiting

Progress tracking:
  .claude/epics/client-hub/updates/003/
  - step-1.md (current)
  - step-2.md (starts after step 1)
  - step-3.md (starts after step 2)
  - step-4.md (starts after step 3)

Each step completes before the next begins.
```

## Progress Tracking

### Parallel Mode
- Multiple `stream-X.md` files created simultaneously
- Agents coordinate through progress updates
- May have file conflicts requiring coordination

### Sequential Mode
- Single `step-X.md` file active at a time
- No coordination needed (only one agent working)
- Linear, predictable progress

## Example Workflow

### For a Simple API Task (Recommended: Sequential)

```bash
# 1. Analyze with sequential mode
/pm:issue-analyze client-hub/003 --sequential

# Output: Created 4-step implementation plan:
#   Step 1: Setup service (2h)
#   Step 2: Implement methods (3h)
#   Step 3: Create endpoints (2h)
#   Step 4: Add tests (1h)

# 2. Start sequential execution with TDD
/pm:issue-start client-hub/003 --sequential --tdd

# Execution:
# - Agent works on Step 1 (setup service)
# - Writes tests, implements code, refactors
# - Completes Step 1, marks as done
# - Automatically starts Step 2
# - Continues until all steps complete
```

### For a Complex Feature (Recommended: Parallel)

```bash
# 1. Analyze with parallel mode (default)
/pm:issue-analyze user-authentication/002

# Output: Identified 3 parallel work streams:
#   Stream A: Database schema (2h)
#   Stream B: Service layer (3h) - depends on A
#   Stream C: API endpoints (2h) - depends on B

# 2. Start parallel execution
/pm:issue-start user-authentication/002

# Execution:
# - Agent-1 works on Stream A (database)
# - Agent-2 waits for A, then starts Stream B (service)
# - Agent-3 waits for B, then starts Stream C (API)
# - All run as fast as dependencies allow
```

## Benefits Comparison

### Parallel Mode Benefits
✅ Faster completion time (parallel execution)
✅ Optimized resource utilization
✅ Good for complex, multi-component tasks
✅ Scales well for large features

### Sequential Mode Benefits
✅ Simpler coordination (no conflicts)
✅ Easier to understand and follow
✅ Predictable progress tracking
✅ Better for learning/education
✅ Clear step-by-step documentation
✅ Lower cognitive load

## Migration Path

If you started with one mode and want to switch:

```bash
# Started with parallel, want sequential:
/pm:issue-analyze client-hub/003 --sequential  # Re-analyze
/pm:issue-start client-hub/003 --sequential    # Re-start

# Started with sequential, want parallel:
/pm:issue-analyze client-hub/003               # Re-analyze (default is parallel)
/pm:issue-start client-hub/003                 # Re-start
```

**Note**: Re-analyzing will overwrite the previous analysis file.

## Command Reference

```bash
# Analyze Commands
/pm:issue-analyze <task>                    # Parallel mode (default)
/pm:issue-analyze <task> --sequential       # Sequential mode

# Start Commands
/pm:issue-start <task>                      # Parallel mode
/pm:issue-start <task> --sequential         # Sequential mode
/pm:issue-start <task> --tdd                # Parallel + TDD
/pm:issue-start <task> --sequential --tdd   # Sequential + TDD

# Works with both GitHub issues and local tasks
/pm:issue-analyze 123                       # GitHub issue
/pm:issue-analyze client-hub/003            # Local task
```

## Best Practices

1. **Choose mode based on task complexity**
   - Simple tasks → Sequential
   - Complex tasks → Parallel

2. **Be consistent**
   - Always use matching flags for analyze and start
   - Don't mix modes without re-analyzing

3. **Use TDD appropriately**
   - Works well with both modes
   - Sequential + TDD provides clearest workflow

4. **Monitor progress**
   - Use `/pm:epic-status <epic-name>` to track either mode
   - Sequential shows current step clearly
   - Parallel shows all active streams

5. **Complete properly**
   - Use `/pm:issue-complete` for both modes
   - Validates all steps/streams are done
   - Runs final tests
