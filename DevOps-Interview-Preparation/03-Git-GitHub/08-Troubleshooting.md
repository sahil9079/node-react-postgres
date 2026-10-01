# Git Troubleshooting Matrix

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| **Merge Conflict** | Concurrent edits to identical lines | Open file, resolve `<<<<<<<` markers, `git add .`, `git commit` |
| **Accidental commit to wrong branch** | Forgot to checkout feature branch | `git reset --soft HEAD~1`, `git checkout -b new-branch`, `git commit` |
| **Accidental hard reset lost work** | Executed `git reset --hard` | Run `git reflog`, locate hash, run `git reset --hard HEAD@{n}` |
