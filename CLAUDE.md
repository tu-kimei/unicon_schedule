# Workspace: Unknown
# Project: unicon_schedule


# Claude Code Instructions
## ContextStream (Minimal)

- First user message: `mcp__contextstream__session_init(folder_path="<cwd>", context_hint="<user_message>")`, then answer.
- Every user message: `mcp__contextstream__context_smart(user_message="<user_message>", format="minified", max_tokens=400)` BEFORE answering.
  - Use `max_tokens=200` for trivial/local edits, `max_tokens=800` for deep debugging/architecture.
- If prior context is missing or user asks past decisions: `mcp__contextstream__session_recall(query="<question>")`, then answer.
- After meaningful work/decisions/preferences: `mcp__contextstream__session_capture(event_type=decision|preference|task|insight, title="…", content="…")`.
- On frustration/corrections/tool mistakes: `mcp__contextstream__session_capture_lesson(...)`.
