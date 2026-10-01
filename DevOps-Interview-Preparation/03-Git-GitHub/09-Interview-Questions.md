# Git Interview Question Bank

### Q1: What is the difference between `git fetch` and `git pull`?
**Answer:** `git fetch` downloads new commits, branches, and tags from the remote repository into your local `.git` metadata store without modifying your working directory files. `git pull` is a combination of `git fetch` followed immediately by `git merge` (or `git rebase` if configured), merging remote changes directly into your active branch.
