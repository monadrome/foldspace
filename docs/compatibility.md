# Compatibility matrix

| Capability | Required | Fallback |
| --- | --- | --- |
| Skills | A host that reads `SKILL.md` | Copy/link `skills/` |
| CLI | Node 20+ | None; skills remain portable |
| Provider | Claude, Codex, or Kimi CLI | Memory and file handoff |
| Visible handoff | cmux | tmux, then Markdown file |
| Git identity | Git repository | Canonical real path |
