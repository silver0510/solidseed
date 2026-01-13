---
allowed-tools: Bash, Read, Write, LS
---

# Issue Analyze

Analyze a task to identify parallel work streams or create a sequential step-by-step plan.

Works with both GitHub-synced issues and local-only tasks.

## Usage

```bash
# Parallel mode (default) - identify work streams for parallel execution
/pm:issue-analyze <issue_number|task_path>

# Sequential mode - create step-by-step plan for linear execution
/pm:issue-analyze <issue_number|task_path> --sequential

# Examples
/pm:issue-analyze 123                                    # GitHub issue #123 (parallel)
/pm:issue-analyze user-authentication/001 --sequential   # Local task (sequential)
/pm:issue-analyze .claude/epics/user-authentication/001.md  # Local task (parallel)
```

## Execution Modes

**Parallel Mode (default)**:
- Identifies independent work streams
- Enables simultaneous execution by multiple agents
- Optimizes for speed with parallel processing
- Best for complex tasks with separable concerns

**Sequential Mode (--sequential)**:
- Creates ordered step-by-step implementation plan
- Executes one step at a time
- Simpler coordination and tracking
- Best for tasks requiring strict ordering or simpler workflows

## Quick Check

### 1. Detect Flags and Input Type

```bash
# Check for --sequential flag
SEQUENTIAL_MODE=false
if [[ "$ARGUMENTS" == *"--sequential"* ]]; then
  SEQUENTIAL_MODE=true
  # Remove --sequential from arguments
  ARGUMENTS=$(echo "$ARGUMENTS" | sed 's/--sequential//g' | xargs)
fi

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

### 2. Scan Available Skills

Before analyzing work streams, identify what skills are available to assist agents:

```bash
# List available skills with descriptions
echo "📚 Available Skills:"
echo ""

if [ -d ".claude/skills" ]; then
  for skill_dir in .claude/skills/*/; do
    if [ -f "$skill_dir/SKILL.md" ]; then
      skill_name=$(basename "$skill_dir")
      # Extract description from frontmatter
      description=$(grep '^description:' "$skill_dir/SKILL.md" | sed 's/^description: *//')

      echo "- $skill_name"
      echo "  $description"
      echo ""
    fi
  done
else
  echo "No skills directory found"
fi
```

**Note to AI**: Use these skill descriptions to intelligently select which skills each work stream should use based on the task requirements.

### 3. Identify Work Breakdown

**For Parallel Mode (SEQUENTIAL_MODE=false)**:

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
- **Which skills would help each stream?** (from available skills list)

**For Sequential Mode (SEQUENTIAL_MODE=true)**:

Analyze the issue to create an ordered step-by-step plan:

**Common Step Types:**

1. **Setup**: Environment, dependencies, configuration
2. **Foundation**: Database schema, core models, types
3. **Implementation**: Services, APIs, business logic
4. **Integration**: Connect components, middleware
5. **Testing**: Unit tests, integration tests
6. **Documentation**: Comments, README, API docs

**Key Questions:**

- What is the logical order of implementation?
- What are the critical dependencies between steps?
- Which steps must complete before others can start?
- What files will each step create/modify?
- **Which skills would help each step?** (from available skills list)

### 4. Create Analysis File

Get current datetime: `date -u +"%Y-%m-%dT%H:%M:%SZ"`

Create `$ANALYSIS_FILE` (determined in Quick Check) with format based on mode:

**For Parallel Mode (SEQUENTIAL_MODE=false)**:

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

**Agent Type**: {general-purpose|Explore|etc}
**Skills**: {skill-name-1, skill-name-2} # Pick from available skills list
**Can Start**: immediately
**Estimated Hours**: {hours}
**Dependencies**: none

### Stream B: {Stream Name}

**Scope**: {What this stream handles}
**Files**:

- {file_pattern_1}
- {file_pattern_2}

**Agent Type**: {agent_type}
**Skills**: {skill-name} # Pick from available skills list, or "none"
**Can Start**: immediately
**Estimated Hours**: {hours}
**Dependencies**: none

### Stream C: {Stream Name}

**Scope**: {What this stream handles}
**Files**:

- {file_pattern_1}

**Agent Type**: {agent_type}
**Skills**: {skill-name-1, skill-name-2} # Pick from available skills list
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

**For Sequential Mode (SEQUENTIAL_MODE=true)**:

```markdown
---
task: $TASK_NUMBER
title: { task_title }
analyzed: { current_datetime }
execution_mode: sequential
estimated_hours: { total_hours }
total_steps: { step_count }
---

# Sequential Implementation Plan: {TASK_ID}

## Overview

{Brief description of what needs to be done}

## Implementation Steps

### Step 1: {Step Name}

**Objective**: {What this step accomplishes}

**Actions**:
1. {Action item 1}
2. {Action item 2}
3. {Action item 3}

**Files**:
- {file_to_create_or_modify_1}
- {file_to_create_or_modify_2}

**Agent Type**: {general-purpose|Explore|etc}
**Skills**: {skill-name-1, skill-name-2} # Pick from available skills list
**Estimated Hours**: {hours}
**Prerequisites**: none

**Completion Criteria**:
- [ ] {Verifiable outcome 1}
- [ ] {Verifiable outcome 2}

### Step 2: {Step Name}

**Objective**: {What this step accomplishes}

**Actions**:
1. {Action item 1}
2. {Action item 2}

**Files**:
- {file_to_create_or_modify_1}
- {file_to_create_or_modify_2}

**Agent Type**: {agent_type}
**Skills**: {skill-name} # Pick from available skills list, or "none"
**Estimated Hours**: {hours}
**Prerequisites**: Step 1 must be complete

**Completion Criteria**:
- [ ] {Verifiable outcome 1}
- [ ] {Verifiable outcome 2}

### Step 3: {Step Name}

**Objective**: {What this step accomplishes}

**Actions**:
1. {Action item 1}
2. {Action item 2}

**Files**:
- {file_to_create_or_modify_1}

**Agent Type**: {agent_type}
**Skills**: {skill-name-1, skill-name-2} # Pick from available skills list
**Estimated Hours**: {hours}
**Prerequisites**: Steps 1 and 2 must be complete

**Completion Criteria**:
- [ ] {Verifiable outcome 1}
- [ ] {Verifiable outcome 2}

## Execution Strategy

**Approach**: Linear, step-by-step implementation

Each step must complete fully before the next step begins. This ensures:
- Clear dependencies are respected
- No file conflicts between steps
- Easier debugging and progress tracking
- Simpler coordination

## Expected Timeline

Total implementation time: {total_hours} hours

Step breakdown:
- Step 1: {hours}h
- Step 2: {hours}h
- Step 3: {hours}h
- ...

## Notes

{Any special considerations, warnings, or recommendations}
```

### 4. Validate Analysis

**For Parallel Mode**:

Ensure:
- All major work is covered by streams
- File patterns don't unnecessarily overlap
- Dependencies are logical
- Agent types match the work type
- Time estimates are reasonable

**For Sequential Mode**:

Ensure:
- All major work is covered by steps
- Steps are in logical order
- Prerequisites are clearly stated
- Completion criteria are verifiable
- Time estimates are reasonable
- Each step has clear actions and files

### 5. Output

**For GitHub Issues (Parallel Mode)**:

```
✅ Analysis complete for issue #$ISSUE_NUMBER (Parallel Mode)

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

**For GitHub Issues (Sequential Mode)**:

```
✅ Analysis complete for issue #$ISSUE_NUMBER (Sequential Mode)

Created {count}-step implementation plan:
  Step 1: {name} ({hours}h)
  Step 2: {name} ({hours}h)
  Step 3: {name} ({hours}h)

Total estimated time: {total}h
Execution: One step at a time, in order

Next: Start work with /pm:issue-start $ISSUE_NUMBER --sequential
```

**For Local Tasks (Parallel Mode)**:

```
✅ Analysis complete for task $TASK_NUMBER (Parallel Mode)

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

**For Local Tasks (Sequential Mode)**:

```
✅ Analysis complete for task $TASK_NUMBER (Sequential Mode)

Created {count}-step implementation plan:
  Step 1: {name} ({hours}h)
  Step 2: {name} ({hours}h)
  Step 3: {name} ({hours}h)

Total estimated time: {total}h
Execution: One step at a time, in order

Next: Start work with /pm:issue-start $TASK_PATH --sequential
Note: This is a local-only task (not synced to GitHub)
```

## Important Notes

- Analysis is local only - not synced to GitHub
- Focus on practical parallelization, not theoretical maximum
- Consider agent expertise when assigning streams
- Account for coordination overhead in estimates
- Prefer clear separation over maximum parallelization
