---
allowed-tools: Bash, Read, LS
---

# Issue Show

Display task information with detailed context.

Works with both GitHub-synced issues and local-only tasks.

## Usage

```bash
# GitHub issue (synced)
/pm:issue-show <issue_number>

# Local task (not synced)
/pm:issue-show <task_path>

# Examples
/pm:issue-show 123                                    # GitHub issue #123
/pm:issue-show .claude/epics/user-authentication/001.md  # Local task
/pm:issue-show user-authentication/001                   # Shorthand for local task
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

### 2. Fetch Data

**For GitHub Issues (MODE=github)**:
- Use `gh issue view #$ISSUE_NUMBER` to get GitHub issue details

**For Both Modes**:
- Read local task file (`$TASK_FILE`)
- Check for updates directory: `.claude/epics/$EPIC_NAME/updates/$TASK_NUMBER/`
- Read epic.md for context

### 3. Task Overview

**For GitHub Issues (MODE=github)**:

```
🎫 Issue #$ISSUE_NUMBER: {Issue Title}
   Status: {open/closed}
   Labels: {labels}
   Assignee: {assignee}
   Created: {creation_date}
   Updated: {last_update}

📝 Description:
{issue_description}

📁 Local Files:
   Task file: {TASK_FILE}
   Updates: .claude/epics/$EPIC_NAME/updates/$ISSUE_NUMBER/
   Last local update: {timestamp from frontmatter}

🔗 Related Issues:
   Dependencies: #{dep1}, #{dep2} (from task frontmatter)

💬 Recent Activity:
   {timestamp} - {author}: {comment_preview}
   View full thread: gh issue view #$ISSUE_NUMBER --comments
```

**For Local Tasks (MODE=local)**:

```
📋 Task $TASK_NUMBER: {Task Name}
   Epic: {EPIC_NAME}
   Status: {status from frontmatter}
   Created: {created from frontmatter}
   Updated: {updated from frontmatter}

📝 Description:
{description from task file}

📁 Files:
   Task file: {TASK_FILE}
   Epic: .claude/epics/$EPIC_NAME/epic.md
   Updates: .claude/epics/$EPIC_NAME/updates/$TASK_NUMBER/

🔗 Dependencies:
   {depends_on from frontmatter}
   Parallel: {parallel flag}

📚 Reference Sections:
   {list epic sections referenced in task}

Note: This is a local-only task (not synced to GitHub)
```

### 4. Progress Tracking

Show checklist from task file:

```
✅ Checklist:
   ✅ Item 1 (checked)
   □ Item 2 (unchecked)
   □ Item 3 (unchecked)

Effort: {size} ({hours} hours)
```

If updates directory exists, show stream progress:

```
📊 Work Streams:
   Stream A: {status} - {progress_notes}
   Stream B: {status} - {progress_notes}
```

### 5. Quick Actions

**For GitHub Issues**:

```
🚀 Quick Actions:
   Start work: /pm:issue-start $ISSUE_NUMBER
   Analyze: /pm:issue-analyze $ISSUE_NUMBER
   Sync updates: /pm:issue-sync $ISSUE_NUMBER
   Add comment: gh issue comment #$ISSUE_NUMBER --body "your comment"
   View in browser: gh issue view #$ISSUE_NUMBER --web
```

**For Local Tasks**:

```
🚀 Quick Actions:
   Start work: /pm:issue-start $TASK_PATH
   Analyze: /pm:issue-analyze $TASK_PATH
   View epic: cat .claude/epics/$EPIC_NAME/epic.md
   Edit task: {editor} $TASK_FILE
```

### 6. Error Handling

- Handle invalid issue numbers/paths gracefully
- Check for network/authentication issues (GitHub mode only)
- Provide helpful error messages and alternatives

Provide comprehensive task information to help developers understand context and current status.
