---
allowed-tools: Bash, Read, Write, LS
---

# Issue Close

Mark a task as complete and optionally close it on GitHub.

Works with both GitHub-synced issues and local-only tasks.

## Usage

```bash
# GitHub issue
/pm:issue-close <issue_number> [completion_notes]

# Local task
/pm:issue-close <task_path> [completion_notes]

# Examples
/pm:issue-close 123                           # GitHub issue #123
/pm:issue-close user-authentication/001       # Local task
/pm:issue-close .claude/epics/client-hub/001.md  # Local task (full path)
```

## Quick Check

### 1. Detect Input Type and Load Task

Check if argument is numeric (GitHub issue) or path-based (local task):

```bash
# Check if argument is numeric (GitHub issue)
if [[ "$ARGUMENTS" =~ ^[0-9]+$ ]]; then
  MODE="github"
  ISSUE_NUMBER="$ARGUMENTS"

  # Find local task file for GitHub issue
  TASK_FILE=$(find .claude/epics -name "$ISSUE_NUMBER.md" 2>/dev/null | head -1)

  if [ -z "$TASK_FILE" ]; then
    # Try searching by github frontmatter
    TASK_FILE=$(grep -l "github:.*issues/$ISSUE_NUMBER" .claude/epics/*/*.md 2>/dev/null | head -1)
  fi

  if [ -z "$TASK_FILE" ]; then
    echo "❌ No local task for issue #$ISSUE_NUMBER"
    exit 1
  fi

  TASK_ID="issue #$ISSUE_NUMBER"
  TRACKING_ID="$ISSUE_NUMBER"
else
  MODE="local"
  TASK_PATH="$ARGUMENTS"

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
  TASK_ID="task $TASK_NUMBER"
  TRACKING_ID="$TASK_NUMBER"
fi

# Extract epic name from task file path
EPIC_NAME=$(echo "$TASK_FILE" | sed 's|.claude/epics/||' | sed 's|/.*||')
```

## Instructions

### 2. Update Local Status

Get current datetime: `date -u +"%Y-%m-%dT%H:%M:%SZ"`

Update task file frontmatter:

```yaml
status: closed
updated: { current_datetime }
```

### 3. Update Progress File

If progress file exists at `.claude/epics/$EPIC_NAME/updates/$TRACKING_ID/progress.md`:

- Set completion: 100%
- Add completion note with timestamp
- Update last_sync with current datetime

### 4. Cleanup Progress Tracking

Remove ephemeral progress tracking files:

```bash
# Remove updates folder for this task
if [ -d ".claude/epics/$EPIC_NAME/updates/$TRACKING_ID" ]; then
  rm -rf ".claude/epics/$EPIC_NAME/updates/$TRACKING_ID"
  echo "✓ Cleaned up progress tracking files"
fi
```

Note: Keep the `*-analysis.md` file as historical documentation.

### 5. Close on GitHub (GitHub Issues Only)

**Only for GitHub issues (MODE=github)**:

Add completion comment and close:

```bash
if [ "$MODE" = "github" ]; then
  # Add final comment
  echo "✅ Task completed

  $COMPLETION_NOTES

  ---
  Closed at: {timestamp}" | gh issue comment $ISSUE_NUMBER --body-file -

  # Close the issue
  gh issue close $ISSUE_NUMBER
fi
```

**For local tasks (MODE=local)**: Skip GitHub operations entirely.

### 6. Update Epic Task List on GitHub (GitHub Issues Only)

**Only for GitHub issues (MODE=github)**:

Check the task checkbox in the epic issue:

```bash
if [ "$MODE" = "github" ]; then
  # Get epic issue number from epic.md
  epic_issue=$(grep 'github:' .claude/epics/$EPIC_NAME/epic.md | grep -oE '[0-9]+$')

  if [ ! -z "$epic_issue" ]; then
    # Get current epic body
    gh issue view $epic_issue --json body -q .body > /tmp/epic-body.md

    # Check off this task
    sed -i "s/- \[ \] #$ISSUE_NUMBER/- [x] #$ISSUE_NUMBER/" /tmp/epic-body.md

    # Update epic issue
    gh issue edit $epic_issue --body-file /tmp/epic-body.md

    echo "✓ Updated epic progress on GitHub"
  fi
fi
```

**For local tasks (MODE=local)**: Skip GitHub operations entirely.

### 7. Update Epic Progress

- Count total tasks in epic
- Count closed tasks
- Calculate new progress percentage
- Update epic.md frontmatter progress field

### 8. Output

**For GitHub Issues**:

```
✅ Closed issue #$ISSUE_NUMBER
  Local: Task marked complete
  GitHub: Issue closed & epic updated
  Epic progress: {new_progress}% ({closed}/{total} tasks complete)

Next: Run /pm:next for next priority task
```

**For Local Tasks**:

```
✅ Closed task $TASK_NUMBER
  Local: Task marked complete
  Epic: {epic_name}
  Epic progress: {new_progress}% ({closed}/{total} tasks complete)

Note: This task is local-only (not synced to GitHub)
Next: Run /pm:next for next priority task
```

## Important Notes

Follow `/rules/frontmatter-operations.md` for updates.
Follow `/rules/github-operations.md` for GitHub commands.
Always sync local state before GitHub.
