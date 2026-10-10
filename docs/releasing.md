# Release Checklist

1. Update the version in `package.json`, `package-lock.json`,
   `.claude-plugin/plugin.json`, and `.claude-plugin/marketplace.json`.
2. Update both READMEs and note any contract or compatibility change.
3. Run `npm ci --ignore-scripts`, `npm run check`, `npm run pack:check`, and
   `npm run probe:terminals` on a host with tmux/cmux. The probe owns unique
   resources and compares the cmux workspace set.
4. Run `claude plugin validate . --strict` when Claude Code is installed. On a
   host without it, run `node scripts/validate.mjs` and record the capability gap.
   `npm run probe:terminals` must pass tmux when available. cmux RPC/schema
   failures are accepted only when the output includes bounded diagnostics and a
   completed file fallback probe; do not retry indefinitely.
5. Inspect `npm pack --dry-run` and `THIRD_PARTY.md`; confirm upstream license
   files and all schemas/examples are included.
6. Review `git diff`, generated changelog text, and package contents. Publish only
   from a clean tag using the repository's release credentials. This project does
   not publish from CI automatically.

The release artifact must not contain real provider output, credentials, local
paths, state directories, or test fixtures that depend on a machine-specific
home. Default CI runs fake providers and local shell fixtures only.
