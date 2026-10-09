# Research findings

- `butterfly-effect-skill` and `hiding-skill` are mature MIT Claude plugins;
  their skill text and references are retained under `skills/` with notices.
- The existing `skills` repository is a useful plugin layout reference, while
  `loop-engine` and `all-local-skills` have no redistribution license and were
  treated as design input rather than copied code.
- Local CLIs are available: Claude 2.1.220, Codex CLI 0.160.0, Kimi 2.1.1;
  tmux 3.6a and cmux 0.64.22. All are optional adapters.
- Claude exposes a print-mode fallback model, but provider-neutral fallback is
  implemented in Threadloom so Codex and Kimi also participate.
- Canonical Git common roots make worktrees share project memory. `MEMORY.md`
  is an index; topic Markdown is the source of truth. Atomic writes, locks, and
  expected hashes make concurrent updates explicit.
- Threadloom was selected over occupied npm names such as `threadloom` and
  `agentloom`; the scoped package is `@huatalk/threadloom`.
