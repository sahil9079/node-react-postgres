# Complete DevOps Technical Interview Preparation Kit

> **Target Experience Levels:** 1-Year $\to$ 2-Year $\to$ 3.5-Year $\to$ 4-Year Senior DevOps / Platform Engineer  
> **Project Foundation:** 3-Tier Web Platform (React 17 + Express 4 + PostgreSQL 15) with Docker Multi-Stage builds, Kubernetes (EKS), and GitHub Actions CI/CD.

---

## 🧭 Master Roadmap & Study Sequence

* 📌 **[00-master-revision-roadmap.md](00-master-revision-roadmap.md)** — **Start here!** Complete day-by-day revision sequence from codebase inspection $\to$ level 1 fundamentals $\to$ production incidents $\to$ senior system design.

---

## 🗂 Complete Folder & File Directory

```
interview-notes/
│
├── 00-master-revision-roadmap.md                    # 📌 Start Here: Day-by-Day Study Sequence
│
├── 01-level-1-fundamentals/                         # 🟢 LEVEL 1 (1 Year Experience)
│   ├── 01-linux-fundamentals.md                     # Linux CPU, Memory, Disk, Inodes, Kill, SSH
│   ├── 02-git-github-fundamentals.md                # Git merge vs rebase, conflicts, safe revert
│   ├── 03-docker-containers-fundamentals.md         # Docker vs VM, Dockerfile line-by-line, Compose
│   ├── 04-kubernetes-fundamentals.md                # K8s 101, all 10 manifests explained, kubectl CLI
│   ├── 05-aws-cloud-fundamentals.md                 # EC2, VPC, EKS, ALB, EBS, IAM, SG vs NACL
│   ├── 06-cicd-pipeline-fundamentals.md             # CI/CD basics, GitHub Actions workflow anatomy
│   └── 07-terraform-iac-fundamentals.md             # IaC lifecycle, init/plan/apply/destroy, state
│
├── 02-level-2-intermediate/                         # 🟡 LEVEL 2 (2 Year Experience)
│   ├── 01-architecture-decisions-and-tradeoffs.md   # Defending LoadBalancer vs Ingress, baked Nginx
│   ├── 02-complete-network-and-request-flow.md      # Packet flow: Browser -> ALB -> Nginx -> API -> DB
│   ├── 03-docker-troubleshooting-and-optimization.md# Cross-arch buildx, permissions, image sizes
│   ├── 04-kubernetes-networking-and-storage.md      # CoreDNS, Service ports, EBS CSI PVC lifecycle
│   ├── 05-terraform-state-locking-and-drift.md      # S3 + DynamoDB locking, detecting state drift
│   └── 06-cicd-quality-gates-and-devsecops.md       # Jest 50% coverage, SonarQube, Trivy, Git SHA tags
│
├── 03-level-3-production-incidents/                 # 🟠 LEVEL 3 (3–3.5 Year Experience)
│   ├── 01-enterprise-p0-p1-incident-management.md   # Incident Commander protocol, war room, MTTR/MTTD
│   ├── 02-http-500-and-backend-crash-triage.md      # Unhandled exceptions, Sequelize disconnects
│   ├── 03-http-502-bad-gateway-and-nginx-triage.md  # Upstream connection refused, DNS mismatch
│   ├── 04-crashloopbackoff-and-oomkilled-triage.md  # Exit codes 1/137/143, DB initContainer fix
│   ├── 05-cpu-100-percent-and-memory-leaks.md       # Event loop lag, ReDoS, V8 heap dump triage
│   ├── 06-disk-full-and-pvc-expansion.md            # Worker node prune, dynamic EBS PVC expansion
│   ├── 07-database-connection-and-deadlock-triage.md# Connection pool exhaustion, long SQL queries
│   ├── 08-load-balancer-health-checks-and-networking.md # Unhealthy targets, 0.0.0.0 binding, SGs
│   ├── 09-zero-downtime-rollback-playbook.md        # Emergency rollout undo, backward-compatible DB
│   └── 10-blameless-post-mortem-and-rca-writing.md  # The 5 Whys, timeline, preventative actions
│
├── 04-level-4-system-design-and-architecture/       # 🔴 LEVEL 4 (4 Year Senior / Platform Architect)
│   ├── 01-scaling-to-1m-users-system-design.md      # S3+CloudFront, ALB Ingress, RDS Multi-AZ, Redis
│   ├── 02-kubernetes-autoscaling-hpa-and-karpenter.md # HPA metric scaling, Karpenter node provisioning
│   ├── 03-multi-az-high-availability-and-rds.md     # Topology spread constraints, sync replication
│   ├── 04-zero-downtime-blue-green-and-canary.md    # Rolling vs Blue/Green vs Canary (Argo Rollouts)
│   ├── 05-disaster-recovery-rto-rpo-and-backups.md  # RTO/RPO definitions, DR strategy matrix
│   ├── 06-full-stack-observability-and-sre-slos.md  # Prometheus, Loki, SLI/SLO/SLA, Error Budgets
│   └── 07-iam-least-privilege-and-irsa.md           # IRSA, Pod Identity, GitHub Actions OIDC
│
└── 05-project-deep-dive/                            # 🎯 PROJECT DEFENSE & INTERVIEWS
    ├── 01-project-overview-and-elevator-pitch.md    # 60-second pitch, tech stack breakdown
    ├── 02-dockerfiles-and-compose-defense.md        # Line-by-line defense of all Dockerfiles
    ├── 03-kubernetes-manifests-deep-dive.md         # Explaining envFrom, selectors, volume mounts
    ├── 04-cicd-workflow-and-testing-strategy.md     # Unit vs integration tests, coverage gates
    └── 05-troubleshooting-stories-and-interviews.md # Jest 25 fix story, SonarQube persistence story
```
