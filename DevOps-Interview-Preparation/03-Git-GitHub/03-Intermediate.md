# Git & GitHub - Level 2: Intermediate

## 1. Branching, Merging & Rebasing
* **Git Merge (`git merge feature`):** Combines history, creates a 3-way merge commit. Preserves exact historical branch structure.
* **Git Rebase (`git rebase main`):** Replays feature commits on top of the latest main branch. Creates a clean, linear commit history.

## 2. Reset vs Revert vs Cherry-Pick
```bash
# Soft Reset: Move HEAD back, keep changes staged
git reset --soft HEAD~1

# Hard Reset: Discard commits AND all local uncommitted changes (Destructive!)
git reset --hard HEAD~1

# Git Revert: Creates a NEW commit that inverts the changes of a past commit (Safe for shared branches)
git revert <COMMIT_HASH>

# Cherry-Pick: Apply a single specific commit from another branch to current branch
git cherry-pick <COMMIT_HASH>
```
