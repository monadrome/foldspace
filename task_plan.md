# Threadloom implementation plan

## Goal

Deliver one installable plugin that combines the existing rewind and hiding
skills with terminal handoff, auto-rewind detection, roundtable decisions,
leader routing/fallback, and project-scoped shared memory.

## Phases

- [complete] Audit existing repositories, host CLIs, licenses, and naming.
- [complete] Create plugin manifests and preserve mature butterfly/hide skills.
- [complete] Implement Node CLI, provider adapters, terminal backends, memory,
  leader, roundtable, and auto-butterfly wrapper.
- [complete] Add portable skill contracts, documentation, and offline tests.
- [complete] Install and validate package plus real local terminal probes.

## Evidence gates

- `npm test` passes all behavior tests.
- `claude plugin validate . --strict` passes.
- npm dry-run and temporary tarball install contain the CLI and all skills.
- tmux/cmux probes use unique resources and close only resources created by the
  probe.

## Errors

- `realpathSync` was initially imported from `node:path`; fixed to import from
  `node:fs`.
- A handoff unit test initially omitted `json: true`; fixed the test contract.
