---
allowed-tools: Bash, Read, Write, LS, Task
---

# Issue Complete

Complete a task by running tests, verifying they pass, and marking as completed.

Works with both GitHub-synced issues and local-only tasks.

## Usage

```bash
# Complete with test verification
/pm:issue-complete <issue_number|task_path>

# Skip tests (not recommended)
/pm:issue-complete <issue_number|task_path> --skip-tests

# Examples
/pm:issue-complete 123                                    # GitHub issue #123
/pm:issue-complete user-authentication/001                # Local task
/pm:issue-complete .claude/epics/user-authentication/001.md  # Full path
```

## Quick Check

### 1. Detect Flags and Input Type

```bash
# Check for --skip-tests flag
SKIP_TESTS=false
if [[ "$ARGUMENTS" == *"--skip-tests"* ]]; then
  SKIP_TESTS=true
  ARGUMENTS=$(echo "$ARGUMENTS" | sed 's/--skip-tests//g' | xargs)
fi

# Check if argument is numeric (GitHub issue)
if [[ "$ARGUMENTS" =~ ^[0-9]+$ ]]; then
  MODE="github"
  ISSUE_NUMBER="$ARGUMENTS"

  # Find local task file
  TASK_FILE=$(find .claude/epics -name "$ISSUE_NUMBER.md" -o -path "*/$ISSUE_NUMBER.md" | head -1)

  if [ -z "$TASK_FILE" ]; then
    echo "❌ No local task for issue #$ISSUE_NUMBER"
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
    exit 1
  fi

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

### 2. Verify Task Status

Check current task status:

```bash
CURRENT_STATUS=$(grep "^status:" "$TASK_FILE" | sed 's/status: *//')

if [ "$CURRENT_STATUS" = "completed" ] || [ "$CURRENT_STATUS" = "closed" ]; then
  echo "⚠️  $TASK_ID is already marked as $CURRENT_STATUS"
  echo "Continue anyway? (yes/no)"
  # Only proceed with explicit 'yes'
fi
```

## Instructions

### 1. Run Tests

**Skip if `SKIP_TESTS=true`**, otherwise run tests using test-runner agent:

```bash
if [ "$SKIP_TESTS" = false ]; then
  echo "🧪 Running tests for $TASK_ID..."
  echo ""

  # Launch test-runner agent
  # Use Task tool with subagent_type: 'general-purpose'

  Agent Task:
    description: "Run tests for {TASK_ID}"
    prompt: |
      Run all tests related to {TASK_ID}.

      Task file: {TASK_FILE}
      Epic: {EPIC_NAME}

      Requirements:
      1. Read the task file to understand what was implemented
      2. Identify test files related to this task
      3. Run relevant tests using the project's test framework
      4. Capture full test output
      5. Report results clearly

      Test frameworks to detect and use:
      - JavaScript/TypeScript: npm test, jest, mocha
      - Python: pytest, python -m unittest
      - Go: go test ./...
      - Java: mvn test, gradle test
      - Ruby: rspec, rake test
      - PHP: phpunit
      - Rust: cargo test
      - .NET: dotnet test

      Output format:
      - Show pass/fail summary
      - List any failing tests with error messages
      - Suggest fixes for failures
      - Return exit code 0 if all pass, 1 if any fail
fi
```

### 2. Verify Test Results

Check test results and decide:

```bash
if [ "$SKIP_TESTS" = false ]; then
  # Check agent output for test results

  if tests_failed; then
    echo ""
    echo "❌ Tests failed for $TASK_ID"
    echo ""
    echo "Fix the failing tests before completing the task."
    echo "Or run: /pm:issue-complete $ARGUMENTS --skip-tests (not recommended)"
    exit 1
  else
    echo "✅ All tests passed"
  fi
fi
```

### 3. Check Checklist Completion

Read task checklist and verify items:

```bash
echo ""
echo "📋 Checking task checklist..."

# Extract unchecked items
UNCHECKED=$(grep "^- \[ \]" "$TASK_FILE" | sed 's/- \[ \] //')

if [ -n "$UNCHECKED" ]; then
  echo ""
  echo "⚠️  Unchecked items in task checklist:"
  echo "$UNCHECKED" | while read -r item; do
    echo "   □ $item"
  done
  echo ""
  echo "Complete these items? Mark as complete anyway? (yes/no)"
  # Wait for user confirmation
fi
```

### 4. Update Task Status

Get current datetime: `date -u +"%Y-%m-%dT%H:%M:%SZ"`

Update task file frontmatter:

```bash
# Update status to completed/closed
if [ "$MODE" = "github" ]; then
  NEW_STATUS="closed"
else
  NEW_STATUS="completed"
fi

# Update frontmatter
sed -i '' "s/^status: .*/status: $NEW_STATUS/" "$TASK_FILE"
sed -i '' "s/^updated: .*/updated: $CURRENT_DATETIME/" "$TASK_FILE"
```

### 5. Update Progress Files

Mark all work streams as completed:

```bash
UPDATES_DIR=".claude/epics/$EPIC_NAME/updates/$TASK_NUMBER"

if [ -d "$UPDATES_DIR" ]; then
  for stream_file in "$UPDATES_DIR"/stream-*.md; do
    if [ -f "$stream_file" ]; then
      sed -i '' "s/^status: .*/status: completed/" "$stream_file"
    fi
  done
fi
```

### 6. GitHub Operations (GitHub Issues Only)

**Only for GitHub issues (MODE=github)**:

```bash
if [ "$MODE" = "github" ]; then
  echo ""
  echo "📡 Updating GitHub..."

  # Close issue with completion comment
  gh issue close $ISSUE_NUMBER --comment "✅ Completed

All tests passed. Task implementation complete.

Local task file: \`$TASK_FILE\`
Completed: $CURRENT_DATETIME"

  echo "✅ GitHub issue closed"
fi
```

### 7. Output

**For GitHub Issues**:

```
✅ Task completed: issue #$ISSUE_NUMBER

Epic: {epic_name}
Status: closed
Tests: ✅ All passed
Updated: {timestamp}

GitHub: Issue #$ISSUE_NUMBER closed

Next steps:
  View status: /pm:epic-status {epic_name}
  Continue: /pm:issue-start {next_task}
```

**For Local Tasks**:

```
✅ Task completed: task $TASK_NUMBER

Epic: {epic_name}
Status: completed
Tests: ✅ All passed
Updated: {timestamp}

Task file: {TASK_FILE}

Next steps:
  View status: /pm:epic-status {epic_name}
  Continue: /pm:issue-start {next_task}

Note: This task is local-only (not synced to GitHub)
```

**If tests were skipped**:

```
⚠️  Task completed: {TASK_ID} (tests skipped)

WARNING: Tests were not run. This is not recommended.
It's strongly advised to run tests before marking tasks complete.
```

## Error Handling

- Tests fail → Block completion, show error, suggest fixes
- Checklist incomplete → Warn user, ask for confirmation
- Task already completed → Warn and ask for confirmation
- No test framework found → Suggest running manually or skipping

## Important Notes

- **Always run tests** before completing (unless --skip-tests)
- Tests must pass for completion
- Updates task status in frontmatter
- Closes GitHub issue if synced
- Marks all work streams as completed
- Follow `/rules/datetime.md` for timestamps
