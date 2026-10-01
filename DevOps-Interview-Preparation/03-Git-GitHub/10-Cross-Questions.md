# Git Cross-Questioning Drill

### Initial Question: "How do you undo a bad commit pushed to production?"
* **Candidate Answer:** *"I run `git revert <commit-hash>` and push it."*
* **Cross-Question 1:** *"Why wouldn't you use `git reset --hard` and `git push --force`?"*
  * **Strong Answer:** *"Force pushing rewrites history on the shared repository. If other engineers have pulled that commit, force pushing causes diverging branch states and can wipe out legitimate peer commits. `git revert` is non-destructive—it records a new commit that explicitly undos the bad changes while preserving full audit history."*
