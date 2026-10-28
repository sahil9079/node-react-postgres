# Easy Guide — Read This Folder In Order

This folder explains the **whole project in simple English**.

Every file here is short. Every technical word is explained. You do not need to know DevOps before you start.

## Read in this order

| # | File | Time | What you will understand |
| :- | :--- | :--- | :--- |
| 1 | [00-START-HERE.md](00-START-HERE.md) | 10 min | What the app does and the first commands to run |
| 2 | [01-BIG-PICTURE.md](01-BIG-PICTURE.md) | 20 min | How a browser request reaches the database |
| 3 | [02-GLOSSARY.md](02-GLOSSARY.md) | 30 min | Every technical word, in plain language |
| 4 | [03-FILE-MAP.md](03-FILE-MAP.md) | 30 min | What every folder and file is for |
| 5 | [04-BACKEND.md](04-BACKEND.md) | 40 min | The Node.js/Express API, step by step |
| 6 | [05-FRONTEND.md](05-FRONTEND.md) | 30 min | The React app and NGINX |
| 7 | [06-DOCKER-COMPOSE.md](06-DOCKER-COMPOSE.md) | 40 min | Images, containers and the local 5-service stack |
| 8 | [07-KUBERNETES.md](07-KUBERNETES.md) | 50 min | Pods, Deployments, Services, probes, HPA |
| 9 | [08-TERRAFORM-AWS.md](08-TERRAFORM-AWS.md) | 50 min | VPC, EKS, RDS, ECR, IAM and cost |
| 10 | [09-CICD.md](09-CICD.md) | 30 min | How code is tested and deployed by GitHub Actions |
| 11 | [10-MONITORING-SECURITY.md](10-MONITORING-SECURITY.md) | 40 min | Metrics, alerts, SLOs, scanning and hardening |
| 12 | [11-RUN-TEST-DEBUG.md](11-RUN-TEST-DEBUG.md) | 40 min | Exact commands to run, test and fix the app |
| 13 | [12-CLEANUP-AND-ORDER.md](12-CLEANUP-AND-ORDER.md) | 15 min | What was removed, what to keep, final structure |
| 14 | [13-STUDY-PLAN.md](13-STUDY-PLAN.md) | 10 min | A 30/60/90-day plan with proof of work |

## The one rule

Read **one** file, then run **one** command. Do not read five files and run nothing.

## If you only have 1 hour

Read `00-START-HERE.md` and `01-BIG-PICTURE.md`, then run:

```bash
docker compose up --build -d
curl.exe http://localhost:8010/healthz
curl.exe http://localhost:8010/readyz
```

That single experience — a real stack starting — teaches more than a week of videos.

## Where the long guides are

This folder is the **easy path**. The deep reference guides are:

- `README.md` — project summary
- `ARCHITECTURE.md` — design decisions
- `HOW_TO_READ_AND_MASTER_THIS_PROJECT.md` — reading order and drills
- `DEVOPS_IMPLEMENTATION_GUIDE.md` — very long implementation manual
- `DEVOPS_FRESHER_TO_SENIOR_BUILD_GUIDE.md` — full fresher-to-senior course
- `KUBERNETES_DEEP_DIVE.md` — Kubernetes details
- `AWS_COST_OPTIMIZATION_AND_CLEANUP.md` — cost and cleanup
- `docs/devops-interview-preparation/` — interview study
- `interview-notes/` — revision notes
- `DevOps-Interview-Preparation/` — another study set

Use the easy guide first. Use the long guides when you need depth.
