---
name: auto-butterfly-effect
description: Detect a changed or reworked task artifact, preserve the evidence, and invoke butterfly-effect analysis with an optional terminal handoff. Use when a long-running agent task may have drifted; never claim that history was actually rewound.
---

# Auto butterfly effect

Use `foldspace auto-butterfly` (or the equivalent host shell command) as a
wrapper around the `butterfly-effect` contract. Record the artifact path,
before/after hash, transcript path, and time. A changed file alone is evidence
of change, not proof of causal drift. Ask the rewind skill to diagnose whether
the artifact was reworked because it missed its expected outcome.

If a reliable rewind point exists, return the upstream recommendation and
updated prompt. With `--handoff`, create a new cmux/tmux/file session;
it must preserve the prompt and pointer and must never delete or close an
existing user workspace.
