# Level 1: Git & GitHub Version Control Fundamentals

> **Experience Target:** 1-Year Junior/Associate DevOps Engineer  
> **Topic Scope:** Git vs GitHub, branch strategies, commit history, merge vs rebase, resolving conflicts, production reverts, and stash workflows.

---

## 1. Core Git Concepts

### Q1. What is the fundamental difference between Git and GitHub?
* **Git:** A distributed **version control command-line tool** installed locally on your operating system. It tracks changes in source code files, manages branches, and records commit histories locally.
* **GitHub:** A **cloud-hosted platform** built on top of Git that provides remote repository hosting, access control, pull requests, automated CI/CD pipelines (GitHub Actions), issue tracking, and code review tools.

---

### Q2. What is the difference between `git merge` and `git rebase`?
* **`git merge`:**
  * Merges changes from a feature branch into `main` by creating a new **merge commit**.
  * **Pros:** Preserves the exact chronological history and context of when branches were created and merged.
  * **Cons:** Can create cluttered, tangled commit graphs in repositories with large teams.
* **`git rebase`:**
  * Takes all commits from your branch and applies them one-by-one on top of the latest `main` commit.
  * **Pros:** Creates a clean, linear commit history without merge bubble commits.
  * **Cons:** Rewrites commit hashes. **Never rebase public/shared branches** that other developers have pulled.

---

## 2. Resolving Merge Conflicts Step-by-Step

### Q1. How do you resolve a Git merge conflict in your project?
```bash
# 1. Check which files have conflict markers
git status
# Output shows: both modified: apiserver/controllers/authController.js

# 2. Open the file in an editor. Identify conflict markers:
<<<<<<< HEAD (Current branch code)
const { generateToken } = require('../utils/jwt')
=======
const { generateToken, verifyRefreshToken } = require('../utils/jwt')
>>>>>>> feature/refresh-token (Incoming branch code)

# 3. Edit the code to combine the desired logic and delete the marker lines:
const { generateToken, verifyRefreshToken } = require('../utils/jwt')

# 4. Stage the resolved file
git add apiserver/controllers/authController.js

# 5. Finalize the merge or continue rebase
git commit -m "fix: resolve merge conflict in authController"
# If rebasing:
git rebase --continue
```

---

## 3. Production Commit Undos & Reverts

### Q1. How do you safely undo a bad commit already pushed to `main` vs unpushed local changes?

| Scenario | Recommended Command | Why |
| :--- | :--- | :--- |
| **Pushed to `main` in Production** | `git revert <COMMIT_HASH>` | Creates a **new commit** that inverts the bad code. Safe for team collaboration because it preserves Git history. |
| **Unpushed Local Commit** | `git reset --soft HEAD~1` | Undoes the commit but keeps all code changes staged in your working directory. |
| **Discard Local Uncommitted Changes** | `git restore <file>` or `git reset --hard` | Overwrites working directory with the last committed state. Destructive! |

```bash
# Production safe revert:
git revert 4a2b1c8 -m "revert: rollback broken auth middleware"
git push origin main
```

---

## 4. Useful Git Workflows for DevOps

### Q1. How does `git stash` work and when do you use it?
* **Use Case:** You are editing `docker-compose.yaml`, but need to quickly pull and test a critical hotfix from `main` without committing unfinished work.
```bash
git stash save "WIP: postgres healthcheck changes"   # Stashes uncommitted changes
git checkout main
git pull origin main
# (Do your hotfix work)
git checkout feature-branch
git stash pop                                         # Restores stashed work
```

### Q2. How do you inspect commit history and search for changes?
```bash
git log --oneline -n 10                # Compact 1-line view of the last 10 commits
git log -p -n 2 apiserver/app.js       # View full diff history for a specific file
git blame apiserver/routes/auth.js     # Shows author and commit hash for each line of code
git diff HEAD~1 HEAD                   # Compare last commit with previous commit
```
