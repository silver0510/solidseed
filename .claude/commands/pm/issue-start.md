---
allowed-tools: Bash, Read, Write, LS, Task
---

# Issue Start

Begin work on a task with parallel agents based on work stream analysis.

Works with both GitHub-synced issues and local-only tasks.

Supports TDD (Test-Driven Development) workflow.

## Usage

```bash
# Standard mode - implement directly
/pm:issue-start <issue_number|task_path>

# TDD mode - write tests FIRST, then implement
/pm:issue-start <issue_number|task_path> --tdd

# Examples
/pm:issue-start 123                                    # GitHub issue #123
/pm:issue-start user-authentication/001 --tdd         # Local task with TDD
/pm:issue-start .claude/epics/user-authentication/001.md  # Local task
```

## TDD Workflow

When using `--tdd` flag:

1. **Red Phase**: Agent writes failing tests based on acceptance criteria
2. **Green Phase**: Implement code to make tests pass
3. **Refactor Phase**: Improve code while keeping tests green
4. **Complete**: Run `/pm:issue-complete` to verify all tests pass

## Quick Check

### 1. Detect Flags and Input Type

Check for TDD flag and determine input type:

```bash
# Check for --tdd flag
TDD_MODE=false
if [[ "$ARGUMENTS" == *"--tdd"* ]]; then
  TDD_MODE=true
  # Remove --tdd from arguments
  ARGUMENTS=$(echo "$ARGUMENTS" | sed 's/--tdd//g' | xargs)
fi

# Check if argument is numeric (GitHub issue)
if [[ "$ARGUMENTS" =~ ^[0-9]+$ ]]; then
  MODE="github"
  ISSUE_NUMBER="$ARGUMENTS"
else
  MODE="local"
  TASK_PATH="$ARGUMENTS"
fi
```

### 2. Load Task Information

**For GitHub Issue (MODE=github)**:

```bash
# Get issue details from GitHub
gh issue view $ISSUE_NUMBER --json state,title,labels,body || {
  echo "❌ Cannot access issue #$ISSUE_NUMBER"
  echo "Check number or run: gh auth login"
  exit 1
}

# Find local task file
# Try: .claude/epics/*/$ISSUE_NUMBER.md
# Or search for github:.*issues/$ISSUE_NUMBER in frontmatter
TASK_FILE=$(find .claude/epics -name "$ISSUE_NUMBER.md" -o -path "*/$ISSUE_NUMBER.md")

if [ -z "$TASK_FILE" ]; then
  echo "❌ No local task for issue #$ISSUE_NUMBER"
  echo "This issue may have been created outside the PM system"
  exit 1
fi
```

**For Local Task (MODE=local)**:

```bash
# Normalize path
if [[ "$TASK_PATH" == .claude/epics/* ]]; then
  TASK_FILE="$TASK_PATH"
elif [[ "$TASK_PATH" == */*.md ]]; then
  TASK_FILE=".claude/epics/$TASK_PATH"
elif [[ "$TASK_PATH" == */* ]]; then
  # Handle shorthand: user-authentication/001
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

# Extract task number from filename for tracking
TASK_NUMBER=$(basename "$TASK_FILE" .md)
```

### 3. Extract Epic Information

```bash
# Get epic name from task file path
# e.g., .claude/epics/user-authentication/001.md -> user-authentication
EPIC_NAME=$(echo "$TASK_FILE" | sed 's|.claude/epics/||' | sed 's|/.*||')

# Verify epic exists
if [ ! -d ".claude/epics/$EPIC_NAME" ]; then
  echo "❌ Epic directory not found: $EPIC_NAME"
  exit 1
fi
```

### 4. Check Task Dependencies

Read task file frontmatter to check `depends_on` field:

```bash
# Extract depends_on from task frontmatter
DEPENDS_ON=$(grep "depends_on:" "$TASK_FILE" | sed 's/depends_on: *\[\(.*\)\]/\1/' | tr -d ' ')

if [ -n "$DEPENDS_ON" ] && [ "$DEPENDS_ON" != "[]" ]; then
  echo "🔍 Checking dependencies for $TASK_ID..."

  # Split comma-separated list
  IFS=',' read -ra DEPS <<< "$DEPENDS_ON"

  BLOCKED=false
  INCOMPLETE_TASKS=""

  for dep in "${DEPS[@]}"; do
    DEP_FILE=".claude/epics/$EPIC_NAME/$dep.md"

    if [ ! -f "$DEP_FILE" ]; then
      echo "⚠️  Dependency task $dep not found"
      continue
    fi

    # Check if dependency is completed
    DEP_STATUS=$(grep "^status:" "$DEP_FILE" | sed 's/status: *//')

    if [ "$DEP_STATUS" != "completed" ] && [ "$DEP_STATUS" != "closed" ]; then
      BLOCKED=true
      INCOMPLETE_TASKS="$INCOMPLETE_TASKS $dep($DEP_STATUS)"
    fi
  done

  if [ "$BLOCKED" = true ]; then
    echo ""
    echo "❌ Cannot start $TASK_ID - dependencies not completed:"
    for dep in $INCOMPLETE_TASKS; do
      echo "   - Task $dep"
    done
    echo ""
    echo "Complete these tasks first or remove them from depends_on."
    exit 1
  else
    echo "✅ All dependencies completed"
  fi
fi
```

### 5. Check for Analysis

```bash
# Determine analysis file name
if [ "$MODE" = "github" ]; then
  ANALYSIS_FILE=".claude/epics/$EPIC_NAME/$ISSUE_NUMBER-analysis.md"
  TASK_ID="issue #$ISSUE_NUMBER"
else
  ANALYSIS_FILE=".claude/epics/$EPIC_NAME/$TASK_NUMBER-analysis.md"
  TASK_ID="task $TASK_NUMBER"
fi

# Check if analysis exists
if [ ! -f "$ANALYSIS_FILE" ]; then
  echo "❌ No analysis found for $TASK_ID"
  echo ""
  if [ "$MODE" = "github" ]; then
    echo "Run: /pm:issue-analyze $ISSUE_NUMBER first"
    echo "Or: /pm:issue-start $ISSUE_NUMBER --analyze"
  else
    echo "Run: /pm:issue-analyze $TASK_PATH first"
    echo "Or: /pm:issue-start $TASK_PATH --analyze"
  fi
  exit 1
fi
```

## Instructions

### 6. Ensure Worktree Exists

Check if epic worktree exists:

```bash
# Find epic name from task file
epic_name={extracted_from_path}

# Check worktree
if ! git worktree list | grep -q "epic-$epic_name"; then
  echo "❌ No worktree for epic. Run: /pm:epic-start $epic_name"
  exit 1
fi
```

### 7. Read Analysis

Read analysis file (determined in Quick Check):

- Parse parallel streams
- Identify which can start immediately
- Note dependencies between streams
- **Extract skills for each stream** (from "Skills:" field in analysis)

### 8. Setup Progress Tracking

Get current datetime: `date -u +"%Y-%m-%dT%H:%M:%SZ"`

Create workspace structure:

```bash
# Use TASK_NUMBER for tracking (from Quick Check)
if [ "$MODE" = "github" ]; then
  TRACKING_ID="$ISSUE_NUMBER"
else
  TRACKING_ID="$TASK_NUMBER"
fi

mkdir -p .claude/epics/$EPIC_NAME/updates/$TRACKING_ID
```

Update task file frontmatter `updated` field with current datetime.

### 9. Launch Parallel Agents

For each stream that can start immediately:

**First, load skills for this stream:**

```bash
# Extract skills from analysis (comma-separated in "Skills:" field)
# Example: "Skills: backend-development, better-auth"
STREAM_SKILLS="{extracted_from_analysis}"

# Build skill context by reading each skill
SKILL_CONTEXT=""
if [ "$STREAM_SKILLS" != "none" ] && [ -n "$STREAM_SKILLS" ]; then
  IFS=',' read -ra SKILLS <<< "$STREAM_SKILLS"
  for skill in "${SKILLS[@]}"; do
    # Trim whitespace
    skill=$(echo "$skill" | xargs)
    SKILL_FILE=".claude/skills/$skill/SKILL.md"

    if [ -f "$SKILL_FILE" ]; then
      SKILL_CONTEXT="$SKILL_CONTEXT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 SKILL: $skill
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$(cat $SKILL_FILE)
"
    fi
  done
fi
```

**Then, create progress tracking:**

Create `.claude/epics/$EPIC_NAME/updates/$TRACKING_ID/stream-{X}.md`:

```markdown
---
task: $TRACKING_ID
stream: { stream_name }
agent: { agent_type }
skills: { stream_skills }
started: { current_datetime }
status: in_progress
---

# Stream {X}: {stream_name}

## Scope

{stream_description}

## Files

{file_patterns}

## Skills Available

{stream_skills or "none"}

## Progress

- Starting implementation
```

**Finally, launch agent using Task tool:**

**Standard Mode (`TDD_MODE=false`)**:

```yaml
Task:
  description: '{TASK_ID} Stream {X}'
  subagent_type: '{agent_type}'
  prompt: |
    {if SKILL_CONTEXT is not empty:}
    ═══════════════════════════════════════════════════════════════════════
    📚 SKILLS AVAILABLE FOR THIS TASK
    ═══════════════════════════════════════════════════════════════════════

    You have access to specialized skills that provide domain expertise.
    Consult these skills for best practices, patterns, and guidance.

    {SKILL_CONTEXT}

    ═══════════════════════════════════════════════════════════════════════
    END OF SKILLS
    ═══════════════════════════════════════════════════════════════════════

    {endif}

    You are working on {TASK_ID} in the epic worktree.

    Worktree location: ../epic-{epic_name}/
    Your stream: {stream_name}

    Your scope:
    - Files to modify: {file_patterns}
    - Work to complete: {stream_description}

    Requirements:
    1. Read full task from: {TASK_FILE}
    2. Work ONLY in your assigned files
    3. {if skills available} Consult the skills above for best practices and patterns
    4. Commit frequently with format: "{TASK_ID}: {specific change}"
       Example: "task 001: Add database schema" or "issue #123: Add API endpoint"
    5. Update progress in: .claude/epics/{epic_name}/updates/{TRACKING_ID}/stream-{X}.md
    6. Follow coordination rules in /rules/agent-coordination.md

    If you need to modify files outside your scope:
    - Check if another stream owns them
    - Wait if necessary
    - Update your progress file with coordination notes

    Complete your stream's work and mark as completed when done.
```

**TDD Mode (`TDD_MODE=true`)**:

```yaml
Task:
  description: '{TASK_ID} Stream {X} (TDD)'
  subagent_type: '{agent_type}'
  prompt: |
    {if SKILL_CONTEXT is not empty:}
    ═══════════════════════════════════════════════════════════════════════
    📚 SKILLS AVAILABLE FOR THIS TASK
    ═══════════════════════════════════════════════════════════════════════

    You have access to specialized skills that provide domain expertise.
    Consult these skills for best practices, patterns, and guidance.

    {SKILL_CONTEXT}

    ═══════════════════════════════════════════════════════════════════════
    END OF SKILLS
    ═══════════════════════════════════════════════════════════════════════

    {endif}

    You are working on {TASK_ID} in the epic worktree using TDD (Test-Driven Development).

    Worktree location: ../epic-{epic_name}/
    Your stream: {stream_name}

    Your scope:
    - Files to modify: {file_patterns}
    - Work to complete: {stream_description}

    TDD WORKFLOW - Follow this order strictly:

    PHASE 1 - RED (Write Failing Tests):
    1. Read full task from: {TASK_FILE}
    2. Read acceptance criteria from task checklist
    3. {if skills available} Consult skills for testing best practices
    4. Write comprehensive tests FIRST based on acceptance criteria
    5. Tests should cover:
       - Happy path scenarios
       - Edge cases
       - Error handling
       - Validation rules
    6. Run tests - they MUST fail (no implementation yet)
    7. Commit: "{TASK_ID}: Add tests for [feature]"

    PHASE 2 - GREEN (Make Tests Pass):
    8. {if skills available} Consult skills for implementation patterns
    9. Implement MINIMAL code to make tests pass
    10. Run tests after each small change
    11. Commit frequently: "{TASK_ID}: Implement [specific functionality]"
    12. DO NOT add features not covered by tests

    PHASE 3 - REFACTOR (Improve Code):
    13. {if skills available} Apply best practices from skills
    14. Improve code structure while keeping tests green
    15. Run tests after each refactor
    16. Commit: "{TASK_ID}: Refactor [what was improved]"

    Requirements:
    - Work ONLY in your assigned files
    - Run tests frequently (after each change)
    - Update progress in: .claude/epics/{epic_name}/updates/{TRACKING_ID}/stream-{X}.md
    - Follow coordination rules in /rules/agent-coordination.md
    - Include test status in progress updates

    Progress updates should include:
    - ✅ Tests written: X scenarios
    - 🔴 Tests failing: X (expected in red phase)
    - 🟢 Tests passing: X (after implementation)

    Complete your stream when all tests are green and code is refactored.
```

### 10. GitHub Assignment (GitHub Issues Only)

**Only for GitHub issues (MODE=github)**:

```bash
# Assign to self and mark in-progress
gh issue edit $ISSUE_NUMBER --add-assignee @me --add-label "in-progress"
```

**For local tasks (MODE=local)**: Skip GitHub operations entirely.

### 11. Output

**For GitHub Issues**:

```
✅ Started parallel work on issue #$ISSUE_NUMBER {TDD_MODE ? "(TDD Mode)" : ""}

Epic: {epic_name}
Worktree: ../epic-{epic_name}/
{TDD_MODE ? "Mode: Test-Driven Development" : ""}

Launching {count} parallel agents:
  Stream A: {name} (Agent-1) ✓ Started
  Stream B: {name} (Agent-2) ✓ Started
  Stream C: {name} - Waiting (depends on A)

{if TDD_MODE:}
TDD Workflow:
  1. RED: Agents writing failing tests first
  2. GREEN: Implement code to pass tests
  3. REFACTOR: Improve code structure
  4. Complete: Run /pm:issue-complete to verify

Progress tracking:
  .claude/epics/{epic_name}/updates/$ISSUE_NUMBER/

Monitor with: /pm:epic-status {epic_name}
{TDD_MODE ? "Complete with: /pm:issue-complete " + ISSUE_NUMBER : "Sync updates: /pm:issue-sync " + ISSUE_NUMBER}
```

**For Local Tasks**:

```
✅ Started parallel work on task $TASK_NUMBER {TDD_MODE ? "(TDD Mode)" : ""}

Epic: {epic_name}
Task: {task_file}
Worktree: ../epic-{epic_name}/
{TDD_MODE ? "Mode: Test-Driven Development" : ""}

Launching {count} parallel agents:
  Stream A: {name} (Agent-1) ✓ Started
  Stream B: {name} (Agent-2) ✓ Started
  Stream C: {name} - Waiting (depends on A)

{if TDD_MODE:}
TDD Workflow:
  1. RED: Agents writing failing tests first
  2. GREEN: Implement code to pass tests
  3. REFACTOR: Improve code structure
  4. Complete: Run /pm:issue-complete to verify

Progress tracking:
  .claude/epics/{epic_name}/updates/$TASK_NUMBER/

Monitor with: /pm:epic-status {epic_name}
{TDD_MODE ? "Complete with: /pm:issue-complete " + TASK_PATH : ""}
Note: This task is local-only (not synced to GitHub)
```

## Error Handling

If any step fails, report clearly:

- "❌ {What failed}: {How to fix}"
- Continue with what's possible
- Never leave partial state

## Important Notes

Follow `/rules/datetime.md` for timestamps.
Keep it simple - trust that GitHub and file system work.
