---
name: roundtable
description: Run independent multi-agent proposals, preserve evidence and dissent, and synthesize a decision with an explicit confidence. Use when a choice needs several perspectives rather than one agent's answer.
---

# Roundtable

Normalize the decision question first. Give every voter the same stable public
context pointer and a private suffix. Voters must not read each other's output.
Collect provider, requested model, served model, exit status, and response hash;
classify failures separately from abstentions. The chair compares evidence,
records minority reasons, and may return `abstain` when the evidence is not
comparable. Evidence quotes must match the public anchors exactly. The chair
runs only after blind collection and cannot change the host tally. Preserve
malformed and failed votes, provider metadata, response hashes and the optional
human gate. Do not present a majority as truth or silently discard dissent.
