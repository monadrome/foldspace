# Architecture

Threadloom separates host instructions from side effects:

```text
skills/*/SKILL.md  -> trigger and evidence contract
bin/threadloom.mjs  -> small CLI surface
lib/core.mjs        -> identity, locks, process execution, rate classification
lib/memory.mjs      -> Markdown SSOT and deterministic pointer index
lib/runner.mjs      -> Claude/Codex/Kimi adapters and fallback routing
lib/orchestrator.mjs -> leader and blind roundtable
lib/terminal.mjs    -> cmux, tmux, and file handoff backends
```

The leader and chair are orchestration roles. They do not get implicit write
access. Provider sandbox and model selection are explicit configuration.

## Memory identity

Git worktrees resolve to the same common Git directory and therefore share a
project memory index. A non-Git workspace is isolated by its normalized real
path. The index points to topic files under a private state directory, keeping
shared memory out of a repository by default. A lock protects read-modify-write
operations and `--expected-hash` makes stale writes explicit.

## Backend degradation

cmux is selected only after capability discovery; tmux uses a private socket;
the file backend always remains available. Provider routing is sequential by
default so a rate-limit response can move to the next configured provider
without spawning an untracked child process.
