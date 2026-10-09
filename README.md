# Threadloom

Threadloom is a portable collaboration plugin for Claude Code and Agent Skills hosts. It combines artifact rewind (`butterfly-effect`), release hygiene (`hide`), terminal handoff, independent roundtable decisions, a small leader router, and project-scoped Markdown memory.

The design has two layers. `skills/` contains host-readable contracts; `bin/threadloom.mjs` provides deterministic execution where a host can run commands. The router uses Claude, Codex, and Kimi adapters, tries a preferred provider first, recognizes overload/rate-limit failures, and falls back to the next provider. It never treats a fallback as proof that the task succeeded: every attempt is returned with provider, model, exit code, and output.

## Install

From a checkout:

```bash
./install.sh
threadloom doctor --json
```

For Claude Code, add the checkout as a local marketplace or use `--plugin-dir`. For other Agent Skills hosts, copy or link the `skills/` directory. The package is intended for npm as `@huatalk/threadloom`.

## CLI

```bash
threadloom memory init
threadloom memory write --name api-contract --description 'stable API decisions' --content '...'
threadloom memory pointer
threadloom leader --task 'inspect the failing test' --providers claude,codex,kimi
threadloom roundtable --task 'choose a migration strategy' --voters claude,codex,kimi
threadloom handoff --prompt 'Continue from the memory pointer' --backend auto
threadloom auto-butterfly --artifact docs/decision.md --transcript session.md --analyze --handoff
```

Memory is isolated by canonical Git root (worktrees share the repository memory) or by a real path for non-Git workspaces. `MEMORY.md` is an index of pointers; topic documents hold the durable content. Use `--expected-hash` for optimistic concurrency and keep credentials out of shared project memory.

`handoff --backend auto` prefers cmux, then tmux, then a file-only handoff. It does not close or reuse an existing workspace. A created cmux workspace is identified by the full reference returned by cmux; tmux uses a private socket.

## Compatibility

Claude Code, Codex CLI, Kimi Code, tmux, and cmux are optional. The CLI remains usable with no provider or terminal installed: memory, pointer generation, skill contracts, and file handoff still work. Provider execution is opt-in and should be run with an appropriate budget and sandbox.

## License

Threadloom is MIT licensed. See `NOTICE` and `THIRD_PARTY.md` for the retained MIT skill sources.
