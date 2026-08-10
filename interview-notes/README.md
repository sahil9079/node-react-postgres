# Micro1 DevOps Interview — Complete Revision Kit

> **Target:** 1-year DevOps engineer · Full revision from basics to advanced
> **Time:** 25 days gap — this kit is built for rapid, structured revision

---

## How to Use This Kit

| # | Step | Time |
|---|---|---|
| 1 | Read **01-cicd.md** (CI/CD) | Day 1 |
| 2 | Read **02-terraform.md** (Terraform/IaC) | Day 2 |
| 3 | Read **03-kubernetes.md** (K8s) | Days 3-4 |
| 4 | Read **04-aws-eks.md** (AWS/EKS/Deployment) | Day 5 |
| 5 | Read **05-devsecops.md** (DevSecOps) | Day 6 |
| 6 | Drill **06-cheatsheet.md** daily | 30 min/day |
| 7 | Re-read this index + attempt mock answers out loud | Day 7+ |

**Memory rules for interviews:**
- Always answer in **3 parts**: Definition → Why it matters → Example/when-to-use
- If you don't know: say "I haven't done X, but here's how I'd approach it" — never bluff
- Link concepts: e.g., Ingress → LoadBalancer → NodePort → ClusterIP is a *story*, not facts

---

## Topic Index

### [01-cicd.md](01-cicd.md) — CI/CD & Continuous Integration
- PR vs merge vs nightly checks
- Quality gates (tests, coverage, SonarQube)
- Flaky tests, override governance, break-glass
- Branch protection, rollbacks, promotion

### [02-terraform.md](02-terraform.md) — Terraform / IaC
- Modules, workspaces, environments
- Remote state (S3 + DynamoDB locking)
- Drift detection & resolution
- Secrets, review workflow, CI/CD runs

### [03-kubernetes.md](03-kubernetes.md) — Kubernetes
- Deployment vs StatefulSet vs DaemonSet
- Services (ClusterIP/NodePort/LoadBalancer/Ingress)
- Volumes, StorageClass, probes, resources, HPA
- Rollouts, rollbacks, troubleshooting

### [04-aws-eks.md](04-aws-eks.md) — AWS / EKS / Deployment
- EKS deploy flow, ECR integration
- OIDC vs long-lived keys
- Blue-green, canary, rollback strategies
- Monitoring after deploy

### [05-devsecops.md](05-devsecops.md) — DevSecOps
- SAST / DAST / SCA / container scanning
- Trivy, CVEs, secrets management
- Quality gates that block deploys
- Security exceptions

### [06-cheatsheet.md](06-cheatsheet.md) — Quick Revision Cheat Sheet
- One-line definitions for every concept
- Comparison tables (interview favorites)
- Command quick-reference
- "Say this in interviews" phrases

### [07-project-explanation.md](07-project-explanation.md) — Project Explanation
- 30-second elevator pitch (memorize)
- Your 10 K8s manifests explained
- Docker/Dockerfile details + troubleshooting stories
- How to answer "walk me through your project"

---

## The 5 Core Mental Models (know these cold)

```
1. CI/CD Pipeline:  Commit → Test → Build → Scan → Push → Deploy → Monitor
2. K8s Scheduling:   Pod specs → ReplicaSet → Deployment → Service → Ingress
3. IaC Lifecycle:    Plan → Review → Apply → State → Drift → Remediate
4. Security:         Shift-left (scan early) → Gate → Verify → Monitor
5. Deploy Strategies: Rolling → Blue/Green → Canary (risk increases quality)
```

---

## Project Tie-In (answer questions with YOUR project)

Your project `FullStack-DevOps-Pipeline` gives you real evidence:

| Interview Topic | Your Real Example |
|---|---|
| Docker | Multi-stage client Dockerfile (~1GB → ~23MB), `USER node`, `npm ci`, `.dockerignore` |
| Compose → K8s mapping | `env_file` → ConfigMap + Secret; volumes → PVC; services → Services |
| LoadBalancer vs Ingress | Chose LoadBalancer — client nginx already routes `/` and `/api/` |
| K8s manifests | 10 manifests: namespace, configmap, secret, dbpvc, dbdep, dbsrc, apidep, apisrc, clientdep, clientsrc |
| CI/CD design | GitHub Actions: test → SonarQube → build → push → deploy |
| Code quality | 62 Jest tests, 50% coverage thresholds, SonarQube quality gate |
| Security | Non-root containers, secrets in K8s Secret, config in ConfigMap |
| Troubleshooting | Jest v25 `node:` protocol fix → upgraded Jest 29; SonarQube auth (missing volume mount) |

> **TIP:** Whenever an interviewer asks "how would you…", anchor the answer in your project. "In my project, I did X, and here's how I'd extend it to Y."

---

*Start with 01-cicd.md → then 06-cheatsheet.md daily. Good luck!*
