# Scope and reuse decisions

Foldspace was designed after auditing the independent projects in the parent
workspace. `butterfly-effect-skill` supplies artifact-first drift diagnosis and
`hiding-skill` supplies security-sensitive output cleanup. The workspace
`skills` plugin supplies the root-level discovery layout. `agent-cord` supplies
useful evidence about structured provider drivers, cancellation, and blind
voting, but Foldspace keeps a smaller local CLI instead of copying its server.

`loop-engine` demonstrates task loops and durable logs but has machine-specific
paths and no redistribution license, so its behavior is reimplemented behind a
provider-neutral adapter. `all-local-skills` similarly has no license for
republication; only general ideas were used. Existing memory experiments use
vector and graph stores, while this plugin intentionally starts with auditable
Markdown pointers and lexical search.

The name Foldspace describes the shared thread/context problem without
overclaiming a specific provider. The scoped npm name avoids the occupied bare
package name. Before public release, verify the GitHub namespace and trademark
availability independently.
