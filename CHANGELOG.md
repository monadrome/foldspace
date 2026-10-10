# Changelog

## 0.2.0-rc.1 - 2026-10-10

### Features

- Add validated Claude, Codex, Kimi, command and fake provider profiles with
  failure classification, bounded retries, circuits, concurrency, budgets and
  process-group supervision.
- Execute validated task DAGs with durable events, dependency results, worker
  messages, cancellation and restart recovery. Interrupted writes require an
  explicit replay decision.
- Collect blind roundtable proposals with evidence validation, majority or
  weighted decisions, minority reasons and optional human gates.
- Manage owned cmux, private tmux and file handoffs through capture, polling,
  completion, send, resume, cancel and close operations.
- Diagnose artifact drift using explicit chronological production, feedback and
  rework evidence. Return supported rewind advice without changing conversations.
- Maintain scoped Markdown memory with deterministic capped indexes, freshness
  warnings, conflict checks and concurrent-writer protection.

### Fixes

- Reject malformed configuration and incomplete provider output instead of
  treating them as success or silently falling back.
- Clean up child process groups on timeout and cancellation, recover torn event
  logs, and protect storage against path, symlink and hardlink attacks.
- Record bounded cmux protocol diagnostics and verify file fallback when the
  installed RPC version is incompatible.

### Documentation and Validation

- Add bilingual installation, lifecycle and security documentation, versioned
  schemas, executable offline examples, contribution and release instructions.
- Preserve upstream MIT license texts for butterfly-effect and hide.
- Add offline failure-injection tests, Node 20 coverage, manifest and skill
  validation, clean tarball installation checks and owned terminal probes.

### Compatibility

- Version 1 provider configuration, plans and butterfly history replace the MVP
  input contracts. See `docs/contracts.md` and `examples/`.
- Native provider supervision requires POSIX. Windows supports fake providers,
  memory and file handoffs. Kimi read-only execution requires an external sandbox;
  tool-free planning and voting remain unsupported for Kimi.
- Interactive handoffs support line-oriented programs; full-screen TUIs require
  a host-native integration. Budget reservations cannot guarantee provider bills.
