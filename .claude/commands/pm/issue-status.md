---
allowed-tools: Bash, Read, LS
---

# Issue Status

Check task status and current state.

Works with both GitHub-synced issues and local-only tasks.

## Usage

```bash
# GitHub issue (synced)
/pm:issue-status <issue_number>

# Local task (not synced)
/pm:issue-status <task_path>

# Examples
/pm:issue-status 123                                    # GitHub issue #123
/pm:issue-status user-authentication/001                # Local task
```

## Instructions

### 1. Detect Input Type and Load Task

```bash
# Check if argument is numeric (GitHub issue)
if [[ "$ARGUMENTS" =~ ^[0-9]+$ ]]; then
  MODE="github"
  ISSUE_NUMBER="$ARGUMENTS"

  # Find local task file
  TASK_FILE=$(find .claude/epics -name "$ISSUE_NUMBER.md" -o -path "*/$ISSUE_NUMBER.md" | head -1)

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

### 2. Fetch Status

**For GitHub Issues (MODE=github)**:

```bash
gh issue view #$ISSUE_NUMBER --json state,title,labels,assignees,updatedAt
```

**For Both Modes**:

Read task file frontmatter to get:
- status
- created, updated timestamps
- depends_on, parallel flags

### 3. Status Display

**For GitHub Issues**:

```
🎫 Issue #$ISSUE_NUMBER: {Title}

📊 Status: {OPEN/CLOSED}
   GitHub: {state}
   Local: {status from frontmatter}
   Last update: {timestamp}
   Assignee: {assignee or "Unassigned"}

🏷️ Labels: {label1}, {label2}, {label3}

📚 Epic: {EPIC_NAME}
   Task file: {TASK_FILE}
```

**For Local Tasks**:

```
📋 Task $TASK_NUMBER: {Name}

📊 Status: {status from frontmatter}
   Created: {created}
   Updated: {updated}

📚 Epic: {EPIC_NAME}
   Epic status: {epic_status}
   Task file: {TASK_FILE}

🔗 Dependencies: {depends_on or "None"}
   Parallel: {parallel flag}

Note: This is a local-only task (not synced to GitHub)
```

### 4. Progress Indicators

Use clear visual indicators:

- 🟢 open - Ready to start
- 🟡 in-progress - Being worked on
- ✅ completed/closed - Done
- ⏸️ blocked - Has blockers

### 5. Work Status

If updates directory exists:

```
📊 Work Streams:
   {count} streams active
   Last activity: {timestamp}
   Location: .claude/epics/$EPIC_NAME/updates/$TASK_NUMBER/
```

### 6. Quick Actions

**For GitHub Issues**:

```
🚀 Quick Actions:
   View details: /pm:issue-show $ISSUE_NUMBER
   Start work: /pm:issue-start $ISSUE_NUMBER
   Sync: /pm:issue-sync $ISSUE_NUMBER
```

**For Local Tasks**:

```
🚀 Quick Actions:
   View details: /pm:issue-show $TASK_PATH
   Start work: /pm:issue-start $TASK_PATH
   Edit: {editor} $TASK_FILE
```

Keep the output concise but informative for quick status checks.
