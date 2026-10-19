# 00 — Beginner-to-3+ Years DevOps Learning Roadmap (`00-LEARNING-ROADMAP.md`)

> **Target Competency:** Fresher / Beginner $\to$ Junior DevOps $\to$ Intermediate DevOps $\to$ ~3+ Years Production DevOps Engineer  
> **Project Grounding:** Node.js Skills Management Platform (`client/` React + NGINX, `apiserver/` Node.js/Express, `postgres` / Private Amazon RDS, Docker Compose, Terraform, AWS `ap-south-1`, EKS, GitHub Actions OIDC, Prometheus/Grafana)

---

## 1. How to Use This 16-Module Program (Hinglish Guide)

3+ years DevOps competency ka matlab sirf tools ke naam ratna nahi hai—iska matlab hai **Request Flow, Failure Domains, Security Boundaries, Cost Trade-offs, aur Systematic Troubleshooting** ko samajhna aur apne हाथ se implement karke verify karna.

### Four Competency Levels Covered in Every Module

| Level | Target Profile | Core Focus Areas in This Repository |
| :--- | :--- | :--- |
| **Level 1 — Beginner / Fresher** | 0–6 Months | Linux files/permissions/processes, Ports (`80`, `8010`, `5432`), HTTP status codes (`200`, `401`, `403`, `502`, `503`), DNS, Git basics, reading logs & errors. |
| **Level 2 — Junior DevOps** | 6–18 Months | Multi-stage Dockerfiles (`apiserver/Dockerfile`, `client/Dockerfile`), `docker-compose.yaml` networks/volumes, NGINX reverse proxy (`client/nginx.conf`), basic GitHub Actions CI, AWS VPC/IAM basics, Terraform `init/plan/apply`. |
| **Level 3 — Intermediate DevOps** | 18–30 Months | Kubernetes Deployments/Services/Ingress (`k8s/`), Kustomize overlays (`lab`/`production`), Startup/Liveness/Readiness probes (`/healthz`, `/readyz`), OIDC passwordless CI/CD, SonarQube & Trivy gates, Prometheus `/metrics` & Grafana dashboards. |
| **Level 4 — ~3+ Years Production Level** | 3+ Years Competency | Architecture trade-offs (1 NAT vs 2 NAT, Single-AZ vs Multi-AZ RDS, ALB IP-mode routing), IRSA & Least Privilege, HPA + PDB high availability, RDS connection pool sizing, P1 incident RCA, FinOps & dependency-ordered teardown. |

---

## 2. Complete Module Index (`docs/devops-interview-preparation/`)

1. **[00-LEARNING-ROADMAP.md](./00-LEARNING-ROADMAP.md)** — 4-Level progression plan & study order.
2. **[01-LINUX-AND-NETWORKING.md](./01-LINUX-AND-NETWORKING.md)** — Processes, permissions (`UID 1000`), sockets, DNS, HTTP, TLS, and NGINX reverse proxy mechanics.
3. **[02-GIT-AND-GITHUB.md](./02-GIT-AND-GITHUB.md)** — `.gitignore`/`.dockerignore` hygiene, branching, PR reviews, commit conventions, and change management.
4. **[03-DOCKER-AND-COMPOSE.md](./03-DOCKER-AND-COMPOSE.md)** — Multi-stage builds, layer caching, non-root `USER node`, bridge network segmentation, and `stop` vs `down -v`.
5. **[04-CI-CD-AND-GITHUB-ACTIONS.md](./04-CI-CD-AND-GITHUB-ACTIONS.md)** — CI matrix testing, coverage artifacts, AWS OIDC `AssumeRoleWithWebIdentity`, immutable Git SHA tags, and auto-rollback.
6. **[05-AWS-AND-CLOUD-INFRASTRUCTURE.md](./05-AWS-AND-CLOUD-INFRASTRUCTURE.md)** — `ap-south-1` 3-tier VPC (`10.0.0.0/16`), Public/Private/Isolated DB subnets, IGW vs NAT Gateway, Security Group chaining, ECR, and RDS.
7. **[06-TERRAFORM-AND-IAC.md](./06-TERRAFORM-AND-IAC.md)** — Bootstrap S3 state, native lockfile (`use_lockfile = true`), modular design (`infra/modules/*`), drift detection, and state recovery.
8. **[07-KUBERNETES-AND-EKS.md](./07-KUBERNETES-AND-EKS.md)** — Namespace, ConfigMap, ExternalSecret, Deployment, ClusterIP Service, ALB Ingress, Probes, HPA, PDB, and Kustomize overlays.
9. **[08-DEVSECOPS-AND-SECURITY.md](./08-DEVSECOPS-AND-SECURITY.md)** — Shift-left security: SonarQube SAST, `npm audit` SCA, Trivy filesystem/image scanning, IRSA, RBAC, and secret hygiene.
10. **[09-MONITORING-AND-OBSERVABILITY.md](./09-MONITORING-AND-OBSERVABILITY.md)** — Four Golden Signals, `/metrics` Prometheus instrumentation, Histograms vs Gauges, Grafana provisioning, CloudWatch, SLIs/SLOs.
11. **[10-PRODUCTION-TROUBLESHOOTING.md](./10-PRODUCTION-TROUBLESHOOTING.md)** — Structured runbooks (`Symptom -> Impact -> Triage Commands -> Root Cause -> Fix -> Prevention`) for 502/503, `CrashLoopBackOff`, `OOMKilled`, DB pool exhaustion, and CI/CD failures.
12. **[11-REAL-WORLD-SCENARIO-QUESTIONS.md](./11-REAL-WORLD-SCENARIO-QUESTIONS.md)** — **60 Scenario-Based Questions** (15 per level × 4 levels) grounded in this repository, with hints separated from diagnostic solutions.
13. **[12-ADVANCED-3-YEARS-EXPERIENCE.md](./12-ADVANCED-3-YEARS-EXPERIENCE.md)** — Deep architectural trade-offs, failure domain analysis, zero-downtime database migrations, capacity planning, and honest project defense.
14. **[13-DEVOPS-TERMINOLOGY-AND-COMMUNICATION.md](./13-DEVOPS-TERMINOLOGY-AND-COMMUNICATION.md)** — Official English DevOps glossary with simple Hinglish meanings and real team/stakeholder communication templates.
15. **[14-MOCK-INTERVIEW-AND-SCORECARD.md](./14-MOCK-INTERVIEW-AND-SCORECARD.md)** — Interactive 1-question-at-a-time mock interview framework and topic-wise evaluation scorecard.
16. **[15-AWS-COST-OPTIMIZATION-AND-CLEANUP.md](./15-AWS-COST-OPTIMIZATION-AND-CLEANUP.md)** — FinOps mastery, idle cost traps, temporary pause vs complete teardown, and 11 post-destroy verification checks.
