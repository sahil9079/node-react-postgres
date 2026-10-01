# Git & GitHub - Level 4: Production

## 1. Enterprise Branching Strategies
* **GitFlow:** `main` (production), `develop` (integration), `feature/*`, `release/*`, `hotfix/*`.
* **Trunk-Based Development (DevOps Standard):** Developers merge small, frequent commits directly into `main` (trunk) using short-lived branches and Feature Flags. Enables true Continuous Integration.

## 2. GitHub Branch Protection Rules
1. Require a Pull Request before merging.
2. Require minimum 1-2 peer code reviews.
3. Require status checks to pass (SonarQube Quality Gate, Trivy Security Scan, Unit Tests).
4. Require linear history (Disallow merge commits / Enforce Squash and Merge).
