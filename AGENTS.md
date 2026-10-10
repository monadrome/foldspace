# Foldspace Agent Instructions

## Git Delivery

- This project must automatically commit and push completed changes.
- Run the checks appropriate to the changes, commit the task's files, and push
  the current working branch to its upstream. If no upstream exists, use
  `git push --set-upstream origin <current-branch>`.
- This is standing user authorization for commit and push; do not ask for
  confirmation again. Explicit instructions in the current task take precedence.
- Preserve unrelated changes and use ordinary pushes without force.
- Version bumps, release tags, package publishing and merges require their own
  task authorization. Read `docs/releasing.md` when performing a release.
