---
name: agent-handoff
description: Transfer an agent task to a new terminal session or a file pointer using cmux, tmux, or a portable fallback. Use when another agent or a human must continue work.
---

# Agent handoff

Write the prompt and Foldspace memory pointer before starting the backend.
Prefer cmux when available for a visible handoff, then tmux for headless work,
then a file-only handoff. Detect capabilities rather than assuming either
terminal exists. Use a unique name and retain the full cmux workspace reference
or private tmux socket. The created session is owned by this handoff; do not
close another session. Report backend, reference, prompt path/hash, and cwd.
