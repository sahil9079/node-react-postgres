# Git Hands-On Labs

## Lab 1: Interactive Rebase & Commit Squashing
1. Create 3 tiny commits: `echo 1 >> a.txt && git commit -am "wip 1"`, repeat for 2 and 3.
2. Run interactive rebase: `git rebase -i HEAD~3`
3. Mark commits 2 and 3 as `squash` (or `s`).
4. Save and write a clean combined commit message: `feat: implement user auth service`.
5. Verify clean history with `git log --oneline`.
