# Git & GitHub - Level 1: Foundation

## 1. Git Architecture: 4 Data Zones
```
+-------------------+      git add      +-------------------+
| Working Directory | ----------------> |   Staging Area    |
|   (Unstaged)      | <---------------- |      (Index)      |
+-------------------+     git restore   +-------------------+
                                                  |
                                                  | git commit
                                                  v
+-------------------+      git push     +-------------------+
| Remote Repository | <---------------- | Local Repository  |
| (GitHub / GitLab) | ----------------> |     (.git/dir)    |
+-------------------+      git fetch    +-------------------+
```

## 2. Essential Commands
```bash
git init                            # Initialize local repo
git clone https://github.com/repo   # Clone remote repository
git status                          # Check modified/staged files
git add .                           # Stage all modifications
git commit -m "feat: add Dockerfile"# Commit staged changes
git push origin main                # Push local commits to remote
git pull origin main                # Fetch and merge remote changes
```
