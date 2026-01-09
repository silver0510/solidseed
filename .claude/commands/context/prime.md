---
allowed-tools: Bash, Read, LS
---

# Prime Context

This command loads essential context for a new agent session by reading the project context documentation and understanding the codebase structure.

## Preflight Checklist

Before proceeding, complete these validation steps.
Do not bother the user with preflight checks progress ("I'm not going to ..."). Just do them and move on.

### 1. Context Availability Check

- Run: `ls -la .claude/context/ 2>/dev/null`
- If directory doesn't exist or is empty:
  - Tell user: "❌ No context found. Please run /context:create first to establish project context."
  - Exit gracefully
- Count available context files: `ls -1 .claude/context/*.md 2>/dev/null | wc -l`
- Report: "📁 Found {count} context files to load"

### 2. File Integrity Check

- For each context file found:
  - Verify file is readable: `test -r ".claude/context/{file}" && echo "readable"`
  - Check file has content: `test -s ".claude/context/{file}" && echo "has content"`
  - Check for valid frontmatter (should start with `---`)
- Report any issues:
  - Empty files: "⚠️ {filename} is empty (skipping)"
  - Unreadable files: "⚠️ Cannot read {filename} (permission issue)"
  - Missing frontmatter: "⚠️ {filename} missing frontmatter (may be corrupted)"

### 3. Project State Check

- Run: `git status --short 2>/dev/null` to see current state
- Run: `git branch --show-current 2>/dev/null` to get current branch
- Note if not in git repository (context may be less complete)

## Instructions

### 1. Context Loading Sequence

Load context files in priority order for optimal understanding:

**Priority 1 - Essential Context (load first):**

1. `README.md` - Introduction to context system
2. `project.md` - Project overview, scope, features, decisions
3. `tech-stack.md` - Technology stack and architecture

**Priority 2 - Current State (load second):**

4. `progress.md` - Current status and recent work

**Priority 3 - Standards (load third):**

5. `style-guide.md` - Coding conventions and standards

### 2. Validation During Loading

For each file loaded:

- Check frontmatter exists and parse (except README.md):
  - `created` date should be valid
  - `last_updated` should be ≥ created date
  - `version` should be present
- If frontmatter is invalid, note but continue loading content
- Track which files loaded successfully vs failed

### 3. Supplementary Information

After loading context files:

- Run: `git ls-files --others --exclude-standard | head -20` to see untracked files
- Check for `.env.example` or similar for environment setup needs
- Check if there are PRDs or epics in `.claude/prds/` or `.claude/epics/`

### 4. Error Recovery

**If critical files are missing:**

- `project.md` missing: Try to understand from project README.md
- `tech-stack.md` missing: Analyze project configuration files directly (package.json, requirements.txt, etc.)
- `progress.md` missing: Check recent git commits for status

**If context is incomplete:**

- Inform user which files are missing
- Suggest running `/context:update` to refresh context
- Continue with partial context but note limitations

### 5. Loading Summary

Provide comprehensive summary after priming:

```
🧠 Context Primed Successfully

📖 Loaded Context Files:
  ✅ Essential: {count}/3 files
  ✅ Current State: {count}/1 files
  ✅ Standards: {count}/1 files

🔍 Project Understanding:
  - Name: {project_name}
  - Type: {project_type}
  - Language: {primary_language}
  - Status: {current_status from progress.md}
  - Branch: {git_branch}

📊 Key Metrics:
  - Last Updated: {most_recent_update}
  - Context Version: {version}
  - Files Loaded: {success_count}/{total_count}

⚠️ Warnings:
  {list any missing files or issues}

🎯 Ready State:
  ✅ Project context loaded
  ✅ Current status understood
  ✅ Ready for development work

💡 Project Summary:
  {2-3 sentence summary of what the project is and current state}
```

### 6. Partial Context Handling

If some files fail to load:

- Continue with available context
- Clearly note what's missing
- Suggest remediation:
  - "Missing project overview - run /context:create to rebuild"
  - "Progress file corrupted - run /context:update to refresh"

### 7. Performance Optimization

For large contexts:

- Load files in parallel when possible
- Show progress indicator: "Loading context files... {current}/{total}"
- Skip extremely large files (>10000 lines) with warning
- Cache parsed frontmatter for faster subsequent loads

## Important Notes

- **Always validate** files before attempting to read
- **Load in priority order** to get essential context first
- **Handle missing files gracefully** - don't fail completely
- **Provide clear summary** of what was loaded and project state
- **Note any issues** that might affect development work

$ARGUMENTS
