# DEVOPS_IMPLEMENTATION_GUIDE.md
## Node.js Skills Management Platform — Complete Production DevOps Implementation Manual (Hinglish)

> **Target Role:** Senior / Mid-Level DevOps Engineer (Hands-on Implementation, Operations, Troubleshooting & Interview Defense)  
> **Application Stack:** React 17 (`client/`) + Node.js/Express 4 (`apiserver/`) + PostgreSQL 15 (`sampledb`)  
> **DevOps & Cloud Stack:** Git, Docker, Docker Compose, NGINX, Prometheus, Grafana, Terraform (`v1.15+`), AWS (`ap-south-1` Mumbai), Amazon ECR, Amazon EKS, Private Amazon RDS, AWS Load Balancer Controller (ALB Ingress), GitHub Actions (OIDC), SonarQube/SonarCloud, Trivy, Amazon CloudWatch  
> **Companion Cost & Cleanup Guide:** [AWS_COST_OPTIMIZATION_AND_CLEANUP.md](./AWS_COST_OPTIMIZATION_AND_CLEANUP.md)

---

## 📑 Table of Contents

1. [Project Stage Checklist (Live Status Tracker)](#1-project-stage-checklist-live-status-tracker)
2. [Target Architecture & Request Flow (Plain Hinglish)](#2-target-architecture--request-flow-plain-hinglish)
3. [Official DevOps Terminology Dictionary (48 Terms)](#3-official-devops-terminology-dictionary-48-terms)
4. [Phase 0 — Repository Audit, Git Workflow & Baseline Verification](#phase-0--repository-audit-git-workflow--baseline-verification)
5. [Phase 1 — Application Verification, Env Config & Health/Readiness Endpoints](#phase-1--application-verification-env-config--healthreadiness-endpoints)
6. [Phase 2 — Dockerfiles, Multi-Stage Builds, Non-Root Containers & Image Security](#phase-2--dockerfiles-multi-stage-builds-non-root-containers--image-security)
7. [Phase 3 — Docker Compose, NGINX Reverse Proxy, Container DNS & Persistence](#phase-3--docker-compose-nginx-reverse-proxy-container-dns--persistence)
8. [Phase 4 — Local Observability: Prometheus Metrics, Grafana Dashboards & Alerts](#phase-4--local-observability-prometheus-metrics-grafana-dashboards--alerts)
9. [Phase 5 — Terraform Fundamentals, Modules, Remote S3 State & Locking](#phase-5--terraform-fundamentals-modules-remote-s3-state--locking)
10. [Phase 6 — AWS VPC Networking, Subnets, NAT, Security Groups, IAM & ECR](#phase-6--aws-vpc-networking-subnets-nat-security-groups-iam--ecr)
11. [Phase 7 — Amazon EKS Cluster, Managed Nodes, Core Workloads, Probes, HPA & PDB](#phase-7--amazon-eks-cluster-managed-nodes-core-workloads-probes-hpa--pdb)
12. [Phase 8 — Private Amazon RDS PostgreSQL, Secrets Manager, TLS & Backups](#phase-8--private-amazon-rds-postgresql-secrets-manager-tls--backups)
13. [Phase 9 — AWS Load Balancer Controller, Ingress, ALB & Path-Based Routing](#phase-9--aws-load-balancer-controller-ingress-alb--path-based-routing)
14. [Phase 10 — GitHub Actions CI/CD, AWS OIDC, Immutable Tags, Rollout & Rollback](#phase-10--github-actions-cicd-aws-oidc-immutable-tags-rollout--rollback)
15. [Phase 11 — DevSecOps: SonarQube, Trivy, Secret Scanning & Least Privilege](#phase-11--devsecops-sonarqube-trivy-secret-scanning--least-privilege)
16. [Phase 12 — CloudWatch, Prometheus, Grafana & 9 Production Incident Playbooks](#phase-12--cloudwatch-prometheus-grafana--9-production-incident-playbooks)
17. [Phase 13 — Reliability Testing, Scaling, Backup Restore, RTO/RPO & DR](#phase-13--reliability-testing-scaling-backup-restore-rtorpo--dr)
18. [Phase 14 — Organisation Workflow, Sprint Tickets, PR Reviews & Interview Defense](#phase-14--organisation-workflow-sprint-tickets-pr-reviews--interview-defense)
19. [Phase 15 — AWS Cost Optimisation, Safe Shutdown, Teardown & Billing Audit](#phase-15--aws-cost-optimisation-safe-shutdown-teardown--billing-audit)

---

## 1. Project Stage Checklist (Live Status Tracker)

Har stage ka real status niche track kiya gaya hai. Interview mein sirf wahi cheez "Implemented & Tested" bolna jo aapne khud execute aur verify ki hai:

| Phase | Milestone Name | Current Status | Notes / Verification Evidence |
| :--- | :--- | :--- | :--- |
| **Phase 0** | Repository Audit, Git Hygiene & ADRs | **Tested** | Baseline CLI versions & 72 Jest tests verified (`53/53` API, `19/19` Client); `.gitignore` & `.dockerignore` hardened; ADR-001 added |
| **Phase 1** | App Verification, `/healthz`, `/readyz` & DB TLS Config | **Tested** | Added `/healthz`, `/readyz`, and `/metrics` in `apiserver/app.js`, standardized `PORT=8010`, added `DB_SSL` toggle, verified with Jest (`68.28%` stmt coverage) |
| **Phase 2** | Multi-Stage Dockerfiles & Container Hardening | **Implemented** | `apiserver/Dockerfile` upgraded to 2-stage build (`--omit=dev`, `USER node`, `/healthz` `HEALTHCHECK`); `client/Dockerfile` updated with `/nginx-health` `HEALTHCHECK` |
| **Phase 3** | Docker Compose, NGINX Routing & Persistence | **Tested** | Fixed `/api/` trailing-slash bug in `client/nginx.conf`; segmented `docker-compose.yaml` into 3 networks; validated via `docker compose config --quiet` |
| **Phase 4** | Local Prometheus & Grafana Observability | **Tested** | Created `apiserver/metrics.js`, `deploy/prometheus/{prometheus.yml,alerts.yml}`, and `deploy/grafana/` provisioning + dashboard JSON |
| **Phase 5** | Terraform S3 Bootstrap & Module Structure | **Tested** | Created `infra/bootstrap/main.tf` and `infra/envs/lab/main.tf` (`use_lockfile = true`); verified via `terraform -chdir=infra fmt -check -recursive` |
| **Phase 6** | AWS VPC, Subnets, Security Groups, IAM & ECR | **Implemented** | Created `infra/modules/{network,ecr,iam}/main.tf` for `ap-south-1` (`10.0.0.0/16`, 3-tier subnets, SG chain, OIDC + IRSA) |
| **Phase 7** | Amazon EKS Cluster, Workloads, Probes, HPA & PDB | **Tested** | Created `infra/modules/eks/main.tf` & updated `k8s/` + `k8s/overlays/{lab,production}`; validated via `kubectl kustomize` |
| **Phase 8** | Private Amazon RDS PostgreSQL & Secrets Manager | **Implemented** | Created `infra/modules/rds/main.tf` & updated `k8s/{secret.yaml,external-secret.yaml}` with all required keys |
| **Phase 9** | AWS Load Balancer Controller & ALB Ingress | **Tested** | Created `k8s/ingress.yaml` and switched `k8s/clientsrc.yaml` to `ClusterIP`; validated with Kustomize |
| **Phase 10** | GitHub Actions CI/CD with AWS OIDC | **Implemented** | Updated `.github/workflows/main.yaml` & created `.github/workflows/deploy-lab.yml` with OIDC AssumeRole & rollout verification |
| **Phase 11** | DevSecOps Gates (SonarQube, Trivy, RBAC) | **Implemented** | Fixed `vulnerability-type: 'os,library'` typo in `.github/workflows/main.yaml`; created `k8s/{serviceaccount.yaml,rbac.yaml}` |
| **Phase 12** | CloudWatch, Alerting & 9 Incident Runbooks | **Implemented** | All 9 troubleshooting playbooks (`Symptom -> Evidence -> Root Cause -> Fix`) documented in Phase 12 |
| **Phase 13** | Reliability Drills, Load Tests (`k6`), RTO/RPO | **Implemented** | Created `scripts/smoke-test.sh`; existing `apiserver/k6-tests/` scripts integrated with HPA, rollout undo & RDS restore drills |
| **Phase 14** | Sprint Workflow, PR Templates & Interview Q&A | **Implemented** | Complete Hinglish elevator pitch, 48-term dictionary, cross-questions, and workplace sentences included |
| **Phase 15** | Cost Control, Temporary Shutdown & Safe Teardown | **Implemented** | Dedicated [AWS_COST_OPTIMIZATION_AND_CLEANUP.md](./AWS_COST_OPTIMIZATION_AND_CLEANUP.md) + `scripts/{aws-preflight.sh,post-destroy-check.sh}` created |

---

## 2. Target Architecture & Request Flow (Plain Hinglish)

### End-to-End Request Flow (Browser se Database tak)

1. **DNS & TLS Termination**: Jab user browser mein `https://skills.yourdomain.com` open karta hai, **Amazon Route 53** domain ko resolve karke **AWS Application Load Balancer (ALB)** ke public IP par bhejta hai. **AWS Certificate Manager (ACM)** ALB ke listener (`Port 443`) ko SSL/TLS certificate provide karta hai (dhyaan rahe: ACM koi network hop nahi hai, traffic ACM ke andar se nahi guzarta; certificate ALB par attach hota hai).
2. **Public Subnets & Single ALB Ingress**: Internet-facing **ALB** `ap-south-1` (Mumbai) ke kam se kam 2 Availability Zones (`ap-south-1a`, `ap-south-1b`) ke **Public Subnets** mein rehta hai. Kubernetes ke andar **AWS Load Balancer Controller** humare `Ingress` resource ko watch karta hai aur **ek hi ALB** banata hai:
   * Path `/api/*` ka traffic seedha backend Kubernetes Service (`apiserver-service:8010`, `ClusterIP`) ke Pods par route hota hai (`target-type: ip`).
   * Path `/*` ka baaki saara traffic frontend Kubernetes Service (`client-service:80`, `ClusterIP`) ke NGINX Pods par route hota hai.
3. **Private Application Subnets (Amazon EKS)**: Humare EKS Worker Nodes aur Application Pods **Private Application Subnets** mein chalte hain. Inke paas koi Public IP nahi hota. Internet se koi bhi direct worker node ko hit nahi kar sakta; sirf ALB Security Group se aane wala traffic allow hota hai.
4. **Private Database Subnets (Amazon RDS for PostgreSQL)**: Backend `apiserver` Pod (`Node.js + Express + Sequelize`) TCP Port `5432` par **Amazon RDS for PostgreSQL** ke private DNS endpoint se connect karta hai. RDS **Private DB Subnets** mein deployed hai (`publicly_accessible = false`). RDS ka Security Group sirf EKS Node/Pod Security Group se port `5432` allow karta hai.
5. **Secrets & Configuration**: Non-sensitive values (`NODE_ENV`, `PORT=8010`, `API_VERSION=v1`, `DB_HOST`, `DB_PORT=5432`, `DB_NAME=sampledb`) Kubernetes `ConfigMap` se aati hain. Sensitive values (`DB_USER`, `DB_PASS`, `JWT_VERIFY_SECRET`, `JWT_SESSION_SECRET`, `SESSION_ENCRYPT_SECRET`) **AWS Secrets Manager** mein store hoti hain aur **External Secrets Operator (via IAM Roles for Service Accounts - IRSA / Pod Identity)** ke through Kubernetes `Secret` mein inject hoti hain. Git repository mein koi real password commit nahi hota.

### Production Target vs. Low-Cost Learning Lab Trade-offs

| Component | Production Architecture Target | Low-Cost Learning Lab (Practice Mode) | Interview Mein Kaise Explain Karein |
| :--- | :--- | :--- | :--- |
| **NAT Gateway** | Har AZ mein 1 NAT Gateway (Multi-AZ HA egress) | Pure VPC mein **sirf 1 NAT Gateway** (`single_nat_gateway = true`) | *"Lab cost save karne ke liye maine single NAT Gateway use kiya ($0.045/hr), par production mein hum per-AZ NAT lagate hain taaki single AZ failure par private nodes ka internet/ECR egress down na ho."* |
| **Amazon RDS** | `Multi-AZ = true` (`db.t4g.medium` ya higher), automated failover (~60–120s) | `Multi-AZ = false` (`db.t4g.micro` Single-AZ), short lab sessions | *"Lab mein `db.t4g.micro` Single-AZ use kiya cost control ke liye, lekin Terraform module mein `multi_az` variable parameterized hai jo production `tfvars` mein `true` set hota hai."* |
| **EKS Replicas & Nodes** | 2+ Nodes across AZs, 2–6 Pod replicas with Topology Spread & PDB | 1–2 `t3.small` / `t3.medium` nodes, 1–2 replicas | *"Smoke testing 1 replica se start ki, aur rolling update / HPA / PDB drills ke liye 2 replicas test kiye."* |

---

## 3. Official DevOps Terminology Dictionary (48 Terms)

Yeh dictionary aapki daily stand-up meetings aur technical interviews ke liye banayi gayi hai. Har term ka **Official English Name**, **Simple Hinglish Meaning**, **Project Usage**, **Workplace Sentence**, aur **Interview Distinction** niche diya gaya hai:

| # | Official Term | Simple Hinglish Meaning | Where Used in This Project | Realistic Workplace Sentence | Common Interview Distinction / Tip |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **CI (Continuous Integration)** | Developer ke code push karte hi automatically build, lint aur unit tests chalana taaki टूटा (broken) code `main` branch mein merge na ho. | `.github/workflows/ci.yml` (`apiserver` ke 43 Jest tests + `client` ke 19 tests) | *"The PR is blocked because the CI pipeline failed on the Jest coverage gate in `apiserver`."* | **CI vs CD**: CI code ko verify aur package karta hai; CD us verified package ko environments (Lab/Staging/Prod) mein deploy karta hai. |
| 2 | **CD (Continuous Delivery / Deployment)** | CI pass hone ke baad artifact/image ko automatically registry mein push karna aur target environment (EKS) tak deploy karna. | `.github/workflows/deploy-lab.yml` (ECR push + EKS rollout) | *"Once CI passes on `main`, our CD workflow authenticates via OIDC and deploys the new SHA image to the EKS lab environment."* | **Continuous Delivery** mein production deploy se pehle manual approval gate hota hai; **Continuous Deployment** mein bina manual click ke seedha prod tak jata hai. |
| 3 | **CI/CD Pipeline** | Code commit se lekar production deployment tak ka automated end-to-end workflow. | `.github/workflows/` | *"We added Trivy image scanning and smoke tests as mandatory gates in our CI/CD pipeline."* | Pipeline sirf script nahi hoti, usmein quality gates, security scans aur rollback mechanism hona zaroori hai. |
| 4 | **GitOps** | Git repository ko infrastructure aur application deployment ka **Single Source of Truth** manna. | `k8s/` manifests & Terraform code in Git | *"We follow GitOps principles—nobody runs manual `kubectl edit` in the cluster; all manifest changes go through a PR."* | Push-based CI/CD (`kubectl apply` from GitHub Actions) vs Pull-based GitOps (ArgoCD/Flux cluster ke andar baith kar Git repo sync karta hai). |
| 5 | **IaC (Infrastructure as Code)** | AWS console par manually click karne ke bajay code (`Terraform`) likh kar servers, VPC, EKS aur RDS banana. | `infra/modules/` & `infra/envs/lab/` | *"All our AWS networking, EKS, and RDS resources are provisioned via Terraform IaC so we can recreate the lab cleanly."* | Manual clickops mein human error aur configuration drift hota hai; IaC repeatable aur auditable hota hai. |
| 6 | **Declarative Configuration** | System ko yeh batana ki **final state kaisi dikhni chahiye** ("What"), na ki step-by-step kaise karna hai ("How"). | Kubernetes YAML (`replicas: 2`) & Terraform `.tf` files | *"Kubernetes uses declarative manifests—we declare `replicas: 2` in `apidep.yaml`, and the controller ensures 2 Pods are always running."* | **Declarative** (Terraform/K8s YAML) vs **Imperative** (Bash script ya `kubectl scale` commands). |
| 7 | **Idempotency** | Kisi command ya script ko 1 baar chalao ya 10 baar, result same aana chahiye bina duplicate resource ya error banaye. | `terraform apply`, `kubectl apply -f` | *"Our deployment scripts and `kubectl apply` steps are idempotent, so re-running a failed job won't break existing services."* | `kubectl create` idempotent nahi hai (dobara chalane par `AlreadyExists` error dega); `kubectl apply` idempotent hai. |
| 8 | **Immutable Infrastructure** | Running container ya server ke andar SSH karke patch karne ke bajay, naya Docker image/node build karke purane ko replace karna. | ECR immutable image tags + EKS rolling replacement | *"We treat our containers as immutable infrastructure—we never `docker exec` to install packages; we rebuild the image with a new Git SHA."* | Mutable servers mein "configuration drift" hota hai; immutable containers har environment mein identical chalte hain. |
| 9 | **Configuration Drift** | Jab koi engineer AWS Console ya `kubectl edit` se manual change kar de, jisse actual cloud state aur Git/Terraform code alag ho jayein. | Detected via `terraform plan` | *"Before applying the new RDS parameter changes, I ran `terraform plan` to check for any configuration drift in the lab account."* | Drift detect karne ke liye `terraform plan -detailed-exitcode` scheduled CI job mein chalaya ja sakta hai. |
| 10 | **State Locking** | Jab ek engineer ya pipeline `terraform apply` chala raha ho, tab dusre process ko state file modify karne se rokna. | `use_lockfile = true` in `infra/envs/lab/backend.tf` | *"S3 native state locking prevented two concurrent pipeline runs from corrupting our `terraform.tfstate` file."* | Terraform 1.10+ mein S3 `.tflock` (`use_lockfile = true`) natively kaam karta hai without needing a separate DynamoDB table. |
| 11 | **Least Privilege** | Kisi user, Pod, ya CI/CD pipeline ko **sirf utni hi permissions dena** jitni uske kaam ke liye strictly zaroori hain (no `AdministratorAccess`). | IAM Roles, Security Groups (`5432` only from EKS), K8s RBAC | *"Following the principle of least privilege, our RDS security group only accepts TCP 5432 from the EKS node security group."* | Security interviews mein sabse pehle poochha jata hai: "Did you give `AmazonEC2FullAccess` or scoped IAM policies?" |
| 12 | **RBAC (Role-Based Access Control)** | Kubernetes cluster ke andar kaun sa user ya `ServiceAccount` kis namespace mein kaun se resources (`pods`, `secrets`) read/write kar sakta hai. | `k8s/base/rbac.yaml` & `serviceaccount.yaml` | *"We configured Kubernetes RBAC in the `skills-app` namespace so the application ServiceAccount cannot list cluster-wide secrets."* | **IAM** AWS cloud resources control karta hai; **RBAC** Kubernetes API resources control karta hai. |
| 13 | **IAM (Identity and Access Management)** | AWS ka central security system jo control karta hai ki kaun (Users, Roles) kis AWS service (ECR, EKS, RDS, S3) par kya action le sakta hai. | `infra/modules/iam/` | *"We attached a scoped IAM policy to the External Secrets role so it can only read `prod/node-react-app/*` secrets."* | Hamesha long-lived IAM Users ke bajay temporary **IAM Roles** (`sts:AssumeRole`) prefer karein. |
| 14 | **OIDC (OpenID Connect)** | Bina permanent AWS Access Key / Secret Key store kiye, GitHub Actions ya EKS Pods ko short-lived token ke through AWS IAM Role dilana. | GitHub Actions $\to$ AWS IAM OIDC & EKS IRSA | *"We eliminated static AWS keys in GitHub Secrets by configuring an OIDC trust relationship between GitHub Actions and AWS IAM."* | Static keys leak ho sakti hain aur rotate karni padti hain; OIDC tokens ~1 hour mein automatically expire ho jate hain. |
| 15 | **Image Digest** | Docker image ke content ka cryptographic `sha256:...` hash jo kabhi badal nahi sakta (100% unique fingerprint). | ECR image deployment verification | *"Even though we tag images with the Git commit SHA, we also record the immutable `sha256` image digest in our deployment logs."* | Image **Tag** (`:latest` ya `:v1`) overwrite ho sakta hai (agar registry mutable ho), par **Digest** (`@sha256:...`) content badalne par badal jata hai. |
| 16 | **Artifact** | Build ya CI process ke dauran generate hone wali file—jaise compiled React `build/` folder, Docker image, ya `trivy-report.json`. | `.github/workflows/main.yaml` (`upload-artifact@v4`) | *"The CI pipeline uploads the `npm-audit` and Trivy JSON scan reports as build artifacts for security review."* | Source code input hota hai; Artifact build/scan ka output hota hai. |
| 17 | **Runner** | Woh server (virtual machine ya container) jahan GitHub Actions ya Jenkins ke pipeline steps actually execute hote hain. | `runs-on: ubuntu-latest` in GitHub Actions | *"Each job in our GitHub Actions workflow runs on a fresh ephemeral `ubuntu-latest` runner."* | Ephemeral runners har job ke baad destroy ho jate hain, isliye jobs ke beech files share karne ke liye `artifacts` ya `cache` lagta hai. |
| 18 | **Pipeline / Workflow** | Automated CI/CD process ki top-level YAML definition jismein triggers (`on: push`) aur multiple jobs hote hain. | `.github/workflows/ci.yml` | *"Our CI workflow triggers automatically on every pull request targeting the `main` branch."* | GitHub Actions mein isse **Workflow** kehte hain; Jenkins/GitLab mein **Pipeline**. |
| 19 | **Stage / Job** | Pipeline ka ek logical phase (e.g., `testing`, `sonarqube`, `security`, `deploy`). By default jobs parallel chalti hain jab tak `needs:` na lagaya jaye. | `jobs: testing, sonarqube, security` | *"The `deploy` job has `needs: [testing, security]`, so it won't start until all unit tests and vulnerability scans pass."* | **Job** alag VM/Runner par chalti hai; **Step** ek hi Job ke andar sequential shell command ya action hota hai. |
| 20 | **Release** |Ek tested, versioned application build (`v1.2.0` ya commit SHA) jo users ke liye deploy hone ko ready hai. | Git tags & ECR versioned images | *"We cut release `v1.2.0` after verifying all 62 unit and integration tests passed in staging."* | Har commit ek build ho sakta hai, par har commit ek production **Release** nahi hota. |
| 21 | **Deployment** | (1) Application ko environment mein lagane ka process; (2) Kubernetes object (`kind: Deployment`) jo ReplicaSets aur Pods manage karta hai. | `k8s/apidep.yaml` & `k8s/clientdep.yaml` | *"Our `apiserver` Kubernetes Deployment manages the ReplicaSet and handles zero-downtime rolling updates."* | Stateful databases ke liye `StatefulSet` (ya managed RDS) use hota hai; stateless APIs/frontends ke liye `Deployment`. |
| 22 | **Rollout** | Kubernetes mein naye version ke Pods ko gradually start karne aur purane Pods ko replace karne ka live progression. | `kubectl rollout status deployment/apiserver` | *"Our CD pipeline runs `kubectl rollout status` and waits up to 180 seconds for the new Pods to pass readiness probes."* | Agar naye Pod ka `readinessProbe` pass nahi hota, toh rollout wahin ruk (stall) jata hai aur purane Pods traffic serve karte रहते hain. |
| 23 | **Rollback** | Agar naya deployment fail ho jaye ya bug aaye, toh turant pichhle working version (ReplicaSet/Image) par wapas jana. | `kubectl rollout undo deployment/apiserver` | *"When the new release triggered HTTP 500 errors, we executed `kubectl rollout undo` to restore service within 30 seconds."* | Rollback tabhi fast hota hai jab DB schema change backward-compatible ho! |
| 24 | **Canary Deployment** | Naye version ko pehle sirf thode se traffic (jaise 5% ya 10% users) par bhejna; sab sahi chalne par 100% rollout karna. | Advanced K8s / ALB weighted target groups | *"For high-risk API changes, we prefer a canary deployment sending 10% of traffic to the new ReplicaSet while monitoring 5xx rates."* | **Rolling Update** (default K8s) Pods ko ek-ek karke replace karta hai; **Canary** traffic percentage split control karta hai. |
| 25 | **Blue-Green Deployment** | Do identical environments rakhna: **Blue** (current live) aur **Green** (new version). Green test karke Load Balancer ka traffic ek saath Blue se Green par switch karna. | Production release strategy | *"Blue-Green gives instant rollback by flipping the ALB target group back to Blue, though it requires double the compute capacity during release."* | **Canary** gradual traffic shift hai; **Blue-Green** full parallel environment switch hai. |
| 26 | **Health Check** | Koi bhi endpoint (`/healthz`) ya command (`pg_isready`) jisse पता chale ki service zinda aur healthy hai ya nahi. | Docker `HEALTHCHECK`, ALB Health Check, K8s Probes | *"The ALB marks targets unhealthy if `/healthz` fails two consecutive checks."* | Bina health check ke orchestrator sirf yeh dekhta hai ki PID 1 process chal raha hai ya nahi, chahe app अंदर se hang ho chuka ho. |
| 27 | **Liveness Probe** | Kubernetes check jo poochhta hai: *"Kya container process hang/deadlock toh nahi ho gaya? Kya isse **restart** karne ki zaroorat hai?"* | `GET /healthz` in `apiserver/app.js` | *"We keep `/healthz` lightweight without a database query so a temporary DB blip doesn't cause the liveness probe to restart all API Pods."* | **Critical Interview Point**: `livenessProbe` mein kabhi external DB check mat daalo, warna DB slow hone par saare API Pods restart loop (`CrashLoopBackOff`) mein chale jayenge! |
| 28 | **Readiness Probe** | Kubernetes check jo poochhta hai: *"Kya yeh Pod abhi live user traffic lene ke liye **ready** hai (DB connected hai)?"* | `GET /readyz` in `apiserver/app.js` (`sampledb.authenticate()`) | *"When RDS is unreachable, `/readyz` returns HTTP 503, causing Kubernetes to remove the Pod from the Service endpoints without killing the container."* | **Liveness fail** $\to$ Container **Restart** hota hai. **Readiness fail** $\to$ Container restart **nahi** hota, bas `Service` us par traffic bhejna band kar deti hai. |
| 29 | **Service Discovery** | Containers ya Pods ka IP address yaad rakhe bina unhe unke **service naam** (`db`, `apiserver-service`) se dhoondhna (via Docker DNS / CoreDNS). | `DB_HOST=db` in Compose, `apiserver-service` in K8s | *"Because Pod IPs change on every restart, our frontend and Ingress rely on Kubernetes DNS service discovery via `apiserver-service`."* | Container ke andar `localhost` usi container ko point karta hai; dusre container tak jane ke liye Service Discovery DNS naam use hota hai. |
| 30 | **Reverse Proxy** | Server (jaise NGINX) jo client ke saamne baith kar request leta hai aur pichhe (backend server) ko forward karta hai. | `client/nginx.conf` (`proxy_pass http://apiserver:8010`) | *"In local Docker Compose, NGINX acts as both a static file web server for React and a reverse proxy forwarding `/api/` requests to Express."* | **Forward Proxy** client ke behalf par internet par jata hai (VPN/Corporate proxy); **Reverse Proxy** server ke saamne baith kar backend ko protect/route karta hai. |
| 31 | **Load Balancing** | Incoming network traffic ko multiple healthy backend Pods ya servers mein barabar distribute karna. | AWS ALB & Kubernetes `Service` (`kube-proxy`) | *"The AWS Application Load Balancer performs Layer 7 path-based load balancing across our healthy EKS Pods in multiple AZs."* | Layer 4 (TCP/UDP - NLB) vs Layer 7 (HTTP/HTTPS host & path routing - ALB). |
| 32 | **Autoscaling (HPA / Node)** | Traffic ya CPU/Memory load badhne par automatically Pods (`HPA`) ya EC2 Worker Nodes (`Cluster Autoscaler` / `Karpenter`) badhana aur load kam hone par ghatana. | `k8s/base/hpa.yaml` | *"Our HPA scales the `apiserver` Deployment from 2 to 6 Pods whenever average CPU utilization exceeds 70%."* | **HPA** Pods scale karta hai (Metrics Server chahiye); **Node Autoscaler / Karpenter** EC2 worker nodes scale karta hai jab Pods `Pending` ho jayein. |
| 33 | **Observability** | System ke outputs (**Metrics, Logs, Traces**) ko dekh kar yeh samajhna ki system ke andar kya chal raha hai aur wo kyun slow/fail ho रहा hai. | Prometheus + Grafana + CloudWatch + Morgan/JSON logs | *"Good observability allowed us to correlate the spike in HTTP 500 metrics on Grafana directly with an expired DB password in the API logs."* | **Monitoring** batata hai *"System टूटा hai"* (Alert); **Observability** batata hai *"System KYUN टूटा hai"* (Root cause exploration). |
| 34 | **Telemetry** | Application aur infrastructure se automatically collect kiya gaya data—Metrics, Logs, aur Traces. | `prom-client` `/metrics` & stdout logs | *"We instrumented the Express API with `prom-client` to emit HTTP request telemetry to Prometheus."* | Telemetry = raw data signals collected from workloads. |
| 35 | **SLI (Service Level Indicator)** | Service ki health naapne ka **exact metric** (jaise: *% of successful HTTP requests*, ya *p95 API latency in ms*). | PromQL `http_request_duration_seconds` & status codes | *"Our primary latency SLI is the 95th percentile response time of `/api/v1/skills` measured over a 5-minute window."* | SLI = **Kya** naap rahe ho (Metric). |
| 36 | **SLO (Service Level Objective)** | SLI ke liye humara **internal target** (jaise: *99.9% requests should succeed*, ya *p95 latency < 300ms*). | Alerting thresholds in `deploy/prometheus/alerts.yml` | *"We set an internal SLO that 99.5% of API requests must return a non-5xx status over a rolling 30-day window."* | SLO = Internal engineering target (SLI <= Target). |
| 37 | **SLA (Service Level Agreement)** | Client/Customer ke saath **legal/business contract** jismein likha hota hai ki agar SLO break hua toh kya penalty/refund milega. | Enterprise architecture discussions | *"Our internal SLO (99.9%) is stricter than our external customer SLA (99.5%) so our on-call team gets alerted before the SLA is breached."* | Trick to remember: **SLI** (Indicator/Number) $\to$ **SLO** (Objective/Internal Goal) $\to$ **SLA** (Agreement/Legal Contract). |
| 38 | **MTTD (Mean Time to Detect)** | Problem shuru hone se lekar team ko **pata chalne (alert aane)** mein kitna average time laga. | Reduced via Prometheus/CloudWatch alarms | *"By adding a 2-minute Prometheus alert on HTTP 5xx rates, we reduced our MTTD from 20 minutes of customer reports to under 3 minutes."* | Fast alerting = Low MTTD. |
| 39 | **MTTR (Mean Time to Recover / Resolve)** | Outage detect hone se lekar service ko **wapas normal/healthy karne** mein kitna average time laga. | Reduced via Runbooks & `kubectl rollout undo` | *"Detailed incident runbooks and automated rollbacks helped us bring our MTTR down to under 10 minutes."* | Fast rollback & clear runbooks = Low MTTR. |
| 40 | **RTO (Recovery Time Objective)** | Disaster hone ke baad system **kitni der mein wapas chalu hona zaroori hai** (Maximum acceptable downtime). | Phase 13 Disaster Recovery planning | *"With RDS Multi-AZ failover, our database RTO is ~1–2 minutes, whereas restoring from a cold snapshot has an RTO of ~20–30 minutes."* | **RTO** = **Time** (Kitni der system band reh sakta hai?). |
| 41 | **RPO (Recovery Point Objective)** | Disaster hone par **kitne time tak ka data loss acceptable hai** (e.g., last 5 minutes ka data). | RDS Automated Backups & Point-in-Time Recovery (PITR) | *"Enabling RDS Point-in-Time Recovery (transaction logs) gives us an RPO of ~5 minutes instead of losing a full 24 hours since the last daily snapshot."* | **RPO** = **Data Volume/Age** (Kitna purana backup chalega?). |
| 42 | **Incident** | Koi bhi unplanned interruption ya performance degradation jo live service ko impact kare (e.g., API returning 502/503). | `docs/runbooks/` & Phase 12 drills | *"We declared a Sev-2 incident when the `/readyz` endpoint started failing across all API Pods."* | Incident aane par pehla kaam **Customer Impact rokna (Mitigation)** hota hai, deep debugging baad mein. |
| 43 | **Root Cause / Mitigation / Remediation** | **Root Cause**: Asli wajah; **Mitigation**: Turant bleeding rokna (jaise rollback/scale); **Remediation**: Code/Config mein permanent fix taaki dobara na ho. | Incident reports & Postmortems | *"Immediate mitigation was rolling back `apiserver` to the previous SHA; permanent remediation was adding `SESSION_ENCRYPT_SECRET` validation in CI."* | Interviewer hamesha poochhta hai: "What was your immediate mitigation vs long-term remediation?" |
| 44 | **Blameless Postmortem (RCA)** | Incident solve hone ke baad likha jane wala document jismein **insaan ko blame karne ke bajay** system/process ke gap ko dhoondha jata hai. | Phase 12 & 14 RCA template | *"In our blameless postmortem, we focused on why the CI pipeline allowed a missing ConfigMap key rather than blaming the engineer who merged the PR."* | Culture of safety: agar engineer ko dar lagega toh wo galti chhupayega; blameless RCA se system strong banta hai. |
| 45 | **Change Management & Runbook** | **Change Management**: Production change ka approval/window process; **Runbook**: Step-by-step commands ki cheatsheet jo on-call engineer রাত ko 2 baje follow kar sake. | `docs/runbooks/incident-playbooks.md` | *"Every Prometheus alert links directly to a troubleshooting runbook in our repository."* | Runbook mein vague baatein nahi, exact copy-pasteable `kubectl` aur `aws` commands honi chahiye. |
| 46 | **Toil & Capacity Planning** | **Toil**: Repetitive, manual kaam jisko automate kiya ja sakta hai; **Capacity Planning**: Future traffic ke hisaab se CPU/RAM/DB size plan karna. | Automated via CI/CD, Terraform & k6 load testing | *"We eliminated manual deployment toil by automating ECR pushes and EKS rollouts in GitHub Actions."* | DevOps engineer ka main goal manual **Toil** ko script/IaC se khatam karna hai. |
| 47 | **Vulnerability, CVE & SBOM** | **Vulnerability**: Security weakness; **CVE**: Publicly tracked vulnerability ID (e.g., `CVE-2024-xxxx`); **SBOM**: Software Bill of Materials (app ke andar saare packages ki list). | Trivy & `npm audit` in `.github/workflows/` | *"Trivy flagged three HIGH CVEs in the base OS packages, which we remediated by upgrading the base image and rebuilding."* | Zero vulnerabilities har waqt possible nahi hota; real-world mein `CRITICAL/HIGH` block karte hain aur unfixable upstream issues ke liye time-bound `.trivyignore` exception document karte hain. |
| 48 | **Secrets Management** | Passwords, API keys, aur JWT secrets ko Git code se bahar rakhna, encrypt karke store karna (AWS Secrets Manager), aur runtime par safely inject karna. | `.config.env` (local ignored), `ExternalSecret` + AWS Secrets Manager | *"We use AWS Secrets Manager with External Secrets Operator so database credentials are never stored in plaintext inside our Git repository."* | Warning: Kubernetes `kind: Secret` sirf **Base64 encoded** hota hai (`echo ... | base64 -d` se koi bhi padh sakta hai), encrypted nahi! Isliye plain `secret.yaml` Git mein commit nahi karte. |

### Commonly Confused Terms — Quick Interview Comparison Table

1. **Docker Image vs. Container vs. Volume vs. Network vs. Registry**:
   * **Image**: Read-only template/blueprint (`sahil9079/js-apiserver:v1.1.0`) jo Dockerfile se banta hai.
   * **Container**: Image ka running process instance (`docker run`).
   * **Volume**: Container ke filesystem ke bahar persistent disk storage (`dbdata:/var/lib/postgresql/data`) taaki container delete hone par PostgreSQL data safe rahe.
   * **Network**: Virtual switch/bridge jiske upar containers ek-dusre se naam (`http://db:5432`) se baat karte hain.
   * **Registry**: Cloud godown jahan Docker images store aur pull hoti hain (Amazon ECR, Docker Hub).
2. **`localhost` Inside a Container vs. `localhost` on Host Machine**:
   * Jab aap apne Windows laptop ke browser mein `localhost:8010` kholte ho, woh aapka **Host Machine** hai.
   * Lekin jab `apiserver` container ke andar code `DB_HOST=localhost:5432` call karta hai, toh container apne khud ke network namespace (`apiserver` container ke andar) mein port 5432 dhoondhta hai—aur `ECONNREFUSED 127.0.0.1:5432` dekar fail ho jata hai! Container ke andar se DB container tak jane ke liye Docker Compose service name (`DB_HOST=db`) ya K8s Service name (`DB_HOST=postgres-service` / RDS endpoint) use karna padta hai.
3. **Metrics vs. Logs vs. Traces**:
   * **Metrics** (Prometheus/CloudWatch): Numbers over time (CPU 75%, HTTP 500 rate = 4/sec, p95 latency = 420ms). Cheap to store, best for **Alerting & Dashboards**.
   * **Logs** (Morgan/CloudWatch Logs): Detailed text/JSON event records (`Error: password authentication failed for user "postgres"`). Best for **Root Cause Debugging**.
   * **Traces** (OpenTelemetry/X-Ray): Ek single user request ka microservices aur DB ke across poora execution path aur timing breakdown.

---

## Phase 0 — Repository Audit, Git Workflow & Baseline Verification

### 1. Objective & Real-World Organisational Use Case
Jab aap kisi company mein बतौर DevOps Engineer ek existing project par onboard hote ho, toh aap pehle din bina dekhe files delete ya rewrite nahi karte. Sabse pehle aap **Repository Discovery & Baseline Audit** karte ho:
* Kaun se folders (`apiserver/`, `client/`, `k8s/`, `.github/`) pehle se maujood hain?
* Existing tests (`npm test`) pass ho rahe hain ya pehle se टूटे hue hain?
* Kya `.gitignore` aur `.dockerignore` mein koi security leak (jaise `.config.env` ya `.tfstate`) toh nahi chhoot gaya?
* Kya Architecture Decision Records (`ADR`) documented hain?

### 2. Prerequisites & Required Tools
Verify karein ki aapke system par niche diye gaye tools installed hain (humne aapke workstation par yeh run karke verify kiya hai):
* `git` (`2.43.0.windows.1`)
* `node` (`v24.17.0` local / `v18` LTS in Docker & CI) & `npm` (`11.13.0`)
* `docker` (`28.4.0`) & `docker compose` (`v2.39.4`)
* `aws` CLI (`2.31.3`), `terraform` (`v1.15.4`), `kubectl` (`v1.34.0`)

### 3. Exact Working Directory & Files to Create/Modify
* **Working Directory**: `d:\javascript_project\node-react-postgres`
* **Files Modified/Created in Phase 0**:
  * `.gitignore` (Updated to block `.tfstate`, `.terraform/`, `*.tfvars`, scan reports, `.DS_Store`)
  * `.dockerignore` & `apiserver/.dockerignore` (Updated to block `.config.env` secret leak into Docker image!)
  * `docs/adr/ADR-001-architecture-and-devops-evolution.md` (Created Architecture Decision Record)

### 4. Actual Repository Audit Findings (Discovered in Your Project)
Humne aapke project ko pura scan kiya aur yeh **7 Real Findings** discover kiye:
1. **Working Baseline**: `apiserver/` (Express 4 + Sequelize + Postgres) mein **43 Jest tests (7 suites)** aur `client/` (React 17 + Ant Design) mein **19 Jest tests (9 suites)** — total **62 tests 100% PASS** ho rahe hain!
2. **Critical Security Defect #1 (`apiserver/.dockerignore`)**: `apiserver/.dockerignore` mein `.env` likha tha, par aapka project `.config.env` naam ki file use karta hai (`dotenv.config({ path: './.config.env' })`). Iska matlab jab `apiserver/Dockerfile` mein `COPY . .` chalta tha, toh aapki local `.config.env` (database passwords aur JWT secrets ke saath) Docker image ke andar copy ho rahi thi!
3. **Critical Routing Defect #2 (`client/nginx.conf`)**: Line 9 par `location /api/ { proxy_pass http://apiserver:8010/; }` mein trailing slash (`/`) laga hai. NGINX mein jab `proxy_pass` ke URL ke aage `/` lagate hain, toh NGINX `/api/` prefix ko strip (hatakar) `/v1/auth/login` bhejta hai, jabki `apiserver/app.js` `/api/v1/auth/login` expect karta hai!
4. **Critical Kubernetes Crash Defect #3 (`k8s/secret.yaml` & `k8s/configmap.yaml`)**: `k8s/secret.yaml` mein `username`, `password`, aur `JWT_SECRET` keys hain, jabki `apiserver` ka code `DB_USER`, `DB_PASS`, `JWT_VERIFY_SECRET`, `JWT_SESSION_SECRET`, aur `SESSION_ENCRYPT_SECRET` maangta hai. `SESSION_ENCRYPT_SECRET` na milne par `apiserver/utils/session.js` line 3 par `scryptSync(undefined)` call karke Pod ko turant `CrashLoopBackOff` mein daal deta hai!
5. **Missing Probes & Metrics Defect #4 (`apiserver/app.js`)**: Code mein `/healthz`, `/readyz`, aur `/metrics` endpoints nahi the, aur `app.get("*")` har unknown GET route par `../client/build/index.html` dhoondhne ki koshish karta tha.
6. **Port Inconsistency Defect #5 (`apiserver/config/index.js`)**: `NODE_ENV=production` hone par `PORT_PROD=8000` use hota tha jabki Dockerfile aur Kubernetes `8010` expose karte hain.
7. **CI Typo Defect #6 (`.github/workflows/main.yaml`)**: Line 80 par `vulnerabitlity-type: os,library` ki spelling galat hai.

### 5. Complete Code & Configuration Changes for Phase 0

#### File 1: `apiserver/.dockerignore`
```dockerignore
node_modules
npm-debug.log
.git
.gitignore
.DS_Store
build
.env
.config.env
*.env
!example.env
.env.local
.env.*.local
coverage
npm-audit*.json
trivy-report*.json
.vscode
.idea
dist
__tests__
k6-tests
images
*.swp
*.swo
*~
.cache
.nuxt
.turbo
```

#### Line-by-Line Explanation:
* `.config.env` & `*.env` + `!example.env`: Yeh sabse important security rule hai. Yeh ensure karta hai ki koi bhi `.config.env` ya `.env` file Docker image layer mein bake na ho, sirf `example.env` (agar zaroorat ho) ja sake.
* `coverage`, `__tests__`, `k6-tests`: Production container image ko chhota aur clean rakhne ke liye test files aur coverage reports ko build context se exclude kiya gaya hai.

### 6. Commands to Execute (In Exact Order)
```powershell
# 1. Verify your workstation CLI versions
git --version
node --version
npm --version
docker --version
docker compose version
aws --version
terraform version
kubectl version --client

# 2. Check Git repository status and current branch
git status --short
git branch -a

# 3. Verify that .config.env is ignored by Git
git check-ignore -v apiserver/.config.env
```

### 7. Expected Output & How to Verify
* `git check-ignore -v apiserver/.config.env` ka output aana chahiye:
  `.gitignore:4:/apiserver/.config.env    apiserver/.config.env`
  Iska matlab Git aapki local secret file ko track nahi karega.

### 8. Common Errors & Troubleshooting
* **Problem**: `apiserver/.config.env` galti se pehle hi `git add` ho gayi thi aur `git status` mein दिख rahi hai.
  * **Diagnostic Command**: `git ls-files --error-unmatch apiserver/.config.env`
  * **Fix**: File ko hard disk se delete kiye bina Git tracking se hatayein:
    ```powershell
    git rm --cached apiserver/.config.env
    ```

### 9. Security & Cost Considerations
* **Security**: Never commit `.config.env`, `terraform.tfstate`, `.terraform/`, or `*.tfvars` to GitHub. Public repo mein secret push hone ke 30 seconds ke andar automated bots usse scrape kar lete hain.
* **Cost**: Phase 0 100% local hai (**AWS Cost: \$0.00**).

### 10. Git Branch, Commit & PR Workflow
```powershell
git checkout -b chore/phase-0-repo-audit-hygiene
git add .gitignore .dockerignore apiserver/.dockerignore docs/adr/ADR-001-architecture-and-devops-evolution.md
git commit -m "chore(security): harden gitignore/dockerignore to prevent secret and tfstate leaks"
```

### 11. Acceptance Criteria for Phase 0
- [x] Workstation CLI tools verified.
- [x] Baseline 62 unit/integration tests executed and recorded.
- [x] `.gitignore` and `apiserver/.dockerignore` block `.config.env`, `*.tfstate`, and scan artifacts.
- [x] ADR-001 documented in `docs/adr/`.

### 12. Interview Q&A & Workplace Communication
* **Stand-up Update Example**: *"Yesterday I completed the initial repository and security audit for the Skills Management Platform. I identified a `.dockerignore` gap where `.config.env` could be copied into the API image, and a Secret key mismatch in our Kubernetes manifests. Today I am fixing the `.dockerignore` and adding `/healthz` and `/readyz` endpoints for Phase 1."*
* **Interview Question**: *"Suppose a developer accidentally commits a `.env` file with database credentials to a Git branch and pushes it. Is adding `.env` to `.gitignore` in the next commit enough?"*
  * **Model Answer**: *"No. Adding `.env` to `.gitignore` only prevents future tracking if the file is untracked, and even `git rm --cached .env` leaves the secret exposed in the Git commit history (`git log -p`). In a real incident, my first step is **immediate credential rotation** (changing the DB password and invalidating the JWT secrets), because we must assume any pushed secret is compromised. Second, I remove the file from Git history using `git filter-repo` or BFG Repo-Cleaner and force-push if appropriate, and third, I add a pre-commit secret scanning gate (like Trivy secret scan or Gitleaks) in CI."*

### 13. Independent Hands-On Exercise (Your Turn!)
Run `git check-ignore -v apiserver/.config.env` and `git check-ignore -v terraform.tfstate` in your terminal to prove that neither your local API secrets nor any Terraform state file can ever be staged by `git add .`.

---

## Phase 1 — Application Verification, Env Config & Health/Readiness Endpoints

### 1. Objective & Real-World Organisational Use Case
Ek DevOps Engineer application features nahi banata, lekin application ko **Cloud-Ready (12-Factor App compliant)** banana DevOps aur Backend Engineer ki joint responsibility hoti hai.
Kisi bhi container ko Docker Compose, AWS ALB, ya Kubernetes (EKS) mein chalane ke liye 3 cheezein mandatory hain:
1. **Consistent Port & Externalized Environment Config**: App ko hardcoded ports ya files par depend nahi hona chahiye; `PORT`, `DB_HOST`, aur `DB_SSL` environment variables se control hone chahiye.
2. **Liveness Endpoint (`GET /healthz`)**: Orchestrator ko batane ke liye ki Node.js process zinda hai (bina DB check ke).
3. **Readiness Endpoint (`GET /readyz`)**: Load Balancer aur Kubernetes Service ko batane ke liye ki Express API PostgreSQL database se baat karne ke liye ready hai (`sampledb.authenticate()`).

### 2. Prerequisites
* Phase 0 complete hona chahiye.
* `apiserver/node_modules` aur `client/node_modules` installed hone chahiye (`npm ci`).

### 3. Exact Working Directory & Files Modified/Created
* **Working Directory**: `d:\javascript_project\node-react-postgres\apiserver`
* **Files Modified/Created**:
  1. `apiserver/config/index.js` — Standardize `PORT` (`process.env.PORT || ... || 8010`) across all environments.
  2. `apiserver/models/index.js` — Add `DB_SSL=true` toggle for future Amazon RDS TLS connections while keeping local Postgres default `false`.
  3. `apiserver/app.js` — Add `GET /healthz`, `GET /readyz`, and safe SPA fallback / JSON 404 handling.
  4. `apiserver/example.env` — Document `PORT=8010` and `DB_SSL=false`.
  5. `apiserver/__tests__/unit/health.test.js` — Automated Jest + Supertest verification for `/healthz` and `/readyz`.

### 4. Complete Code & Line-by-Line Explanation

#### File 1: `apiserver/config/index.js`
```javascript
var PORT,
    API_URL,
    CLIENT_URL

if (process.env.NODE_ENV === 'production') {
    PORT = process.env.PORT || process.env.PORT_PROD || 8010
    API_URL = process.env.API_URL_PROD
    CLIENT_URL = process.env.CLIENT_URL_PROD
} else if (process.env.NODE_ENV === 'test') {
    PORT = process.env.PORT || process.env.PORT_TEST || 8011
    API_URL = process.env.API_URL_TEST
    CLIENT_URL = process.env.CLIENT_URL_TEST
} else {
    PORT = process.env.PORT || process.env.PORT_DEV || 8010
    API_URL = "http://localhost:" + PORT
    CLIENT_URL = process.env.CLIENT_URL_DEV
}

module.exports = { API_URL, CLIENT_URL, PORT }
```
* **Why this change is critical**: Pehle jab Kubernetes ya Docker mein `NODE_ENV=production` set hota tha aur `PORT_PROD` missing hota tha (ya `8000` hota tha), toh server port `8000` par start hota tha jabki Kubernetes Service aur Dockerfile port `8010` par traffic bhejte the! Ab `process.env.PORT` aur default `8010` har environment mein safely kaam karenge.

#### File 2: `apiserver/models/index.js`
```javascript
const Sequelize = require("sequelize");

const useSSL = process.env.DB_SSL === "true";

// creating the db instance
const sampledb = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    logging: false,
    dialectOptions: useSSL
        ? {
              ssl: {
                  require: true,
                  rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === "true"
              }
          }
        : {},
    define: {
        underscored: true, // use snake_case for all fields in the database
        // freezeTableName: true, //stop the auto-pluralization performed by Sequelize
        timestamps: false // don't add timestamps to tables by default (createdAt, updatedAt)
    },
});

// import the models and append them to the db instance
var db = {}
const models = require("./sampledb")(sampledb, Sequelize)
db = { ...models }
db.sampledb = sampledb;

module.exports = db;
```
* **Why this change is critical**: Local Docker Compose mein PostgreSQL container bina SSL ke chalta hai (`DB_SSL=false`), lekin AWS RDS PostgreSQL 15+ mein `rds.force_ssl=1` by default enabled hota hai. Is 10-line ke `dialectOptions` toggle se humein cloud deployment ke waqt code dubara nahi badalna padega!

#### File 3: Health & Readiness Endpoints in `apiserver/app.js`
```javascript
// Liveness probe: verifies the Node.js event loop and HTTP server are responsive
app.get("/healthz", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "apiserver",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    })
})

// Readiness probe: verifies downstream PostgreSQL connectivity before accepting traffic
app.get("/readyz", async (req, res) => {
    try {
        const { sampledb } = require("./models")
        await sampledb.authenticate()
        res.status(200).json({
            status: "ready",
            database: "connected",
            timestamp: new Date().toISOString()
        })
    } catch (err) {
        res.status(503).json({
            status: "not_ready",
            database: "disconnected",
            message: err.message
        })
    }
})
```
* **Why `/healthz` returns `200` without checking DB**: Agar RDS mein 5 second ka network blip aaye aur `/healthz` DB check kare, toh Kubernetes `livenessProbe` fail maan kar container ko kill/restart kar dega.
* **Why `/readyz` checks `sampledb.authenticate()` and returns `503` on failure**: Jab tak DB ready nahi hai, `/readyz` `503` dega aur Kubernetes Service (`apisrc.yaml`) us Pod ko traffic bhejna rok degi bina Pod ko kill kiye. Jaise hi DB wapas aayega, `/readyz` `200` dega aur traffic resume ho jayega!

### 5. Commands to Execute (In Exact Order)
```powershell
# 1. Run backend unit & integration tests (including new health/readiness tests)
cd d:\javascript_project\node-react-postgres\apiserver
npm test -- --coverage

# 2. Run frontend component tests
cd d:\javascript_project\node-react-postgres\client
npm test -- --watchAll=false
```

### 6. Expected Output & Verification
* `apiserver` mein **8 test suites (46+ tests)** pass hone chahiye aur coverage > 50% threshold pass hona chahiye.
* `client` mein **9 test suites (19 tests)** pass hone chahiye.

### 7. Common Errors & Troubleshooting
* **Error**: `GET /readyz` returns `503 Service Unavailable` locally when running `node index.js`.
  * **Cause**: Local PostgreSQL server running nahi hai ya `.config.env` mein `DB_HOST` / `DB_PASS` galat hai.
  * **Diagnostic Command**: Check response JSON (`{"status":"not_ready","database":"disconnected","message":"connect ECONNREFUSED 127.0.0.1:5432"}`).

### 8. Security & Cost Considerations
* **Security**: `/healthz` aur `/readyz` ke response mein kabhi bhi `DB_HOST`, `DB_USER`, ya stack trace leak nahi hona chahiye. Sirf generic status (`connected` / `disconnected`) bhejna chahiye.
* **Cost**: \$0.00 (100% local execution).

### 9. Acceptance Criteria for Phase 1
- [x] `GET /healthz` returns HTTP 200.
- [x] `GET /readyz` returns HTTP 200 when DB is connected and HTTP 503 when DB fails.
- [x] `PORT` defaults cleanly to `8010` and `DB_SSL` is configurable via env var.
- [x] All unit and integration tests in `apiserver` and `client` pass.

### 10. Interview Q&A & Hands-On Task
* **Interview Question**: *"Why did you separate `/healthz` and `/readyz` in your Express API instead of using a single `/health` endpoint?"*
  * **Model Answer**: *"In Kubernetes, Liveness and Readiness probes have completely different remediation actions. If a Liveness probe fails, `kubelet` kills and restarts the container. If a Readiness probe fails, the Pod stays running, but the EndpointSlice controller removes its IP from the Service so the ALB/ClusterIP stops sending traffic to it. By keeping `/healthz` dependency-free (checking only the Node.js event loop) and putting `sampledb.authenticate()` in `/readyz`, we prevent cascading Pod restarts (`CrashLoopBackOff`) during brief database maintenance or network blips."*
* **Hands-On Exercise**: Run `cd apiserver && npx jest __tests__/unit/health.test.js --verbose` and inspect how Supertest tests both `200 OK` and `503 Service Unavailable` states!

---

## Phase 2 — Dockerfiles, Multi-Stage Builds, Non-Root Containers & Image Security

### 1. Objective & Real-World Organisational Use Case
Developer ke laptop par Node v24 ho sakta hai, CI runner par Ubuntu 24.04 ho sakta hai, aur AWS EKS node par Amazon Linux 2023. **"Works on my machine"** problem ko khatam karne aur attack surface kam karne ke liye hum har tier (`apiserver` aur `client`) ke liye **hardened, minimal, multi-stage Docker images** banate hain.

### 2. Prerequisites
* Docker Desktop running (`docker info`).
* Phase 1 `/healthz` endpoint implemented.

### 3. Exact Working Directory & Files
* `d:\javascript_project\node-react-postgres\apiserver\Dockerfile`
* `d:\javascript_project\node-react-postgres\client\Dockerfile`

### 4. Complete Code & Configuration

#### File 1: `apiserver/Dockerfile` (Production-Hardened)
```dockerfile
FROM node:18-bullseye-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:18-bullseye-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8010
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .
RUN mkdir -p /app/images && chown -R node:node /app/images
USER node
EXPOSE 8010
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:8010/healthz', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["node", "index.js"]
```

#### File 2: `client/Dockerfile` (Multi-Stage React Builder $\to$ NGINX 1.29 Alpine)
```dockerfile
FROM node:18-bullseye-slim AS Builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.29-alpine
COPY --from=Builder /app/build /usr/share/nginx/html
RUN rm -rf /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

### 5. Explanation of Important Lines
* `COPY package*.json ./` before `COPY . .`: Docker **Layer Caching** use karta hai. Jab tak `package.json` nahi badalta, `npm ci` wali layer cache se uthti hai aur image build 90 seconds ke bajay 5 seconds mein ho jata hai.
* `npm ci --omit=dev`: `npm install` ke bajay `npm ci` exact `package-lock.json` versions install karta hai, aur `--omit=dev` Jest/Babel/Supertest ko production image mein jane se rokta hai.
* `USER node`: Container root (`UID 0`) ke bajay non-root user (`UID 1000`) se chalta hai. Agar attacker app mein RCE exploit kar bhi le, toh use container/host root privileges nahi milengi.
* `HEALTHCHECK`: `curl` slim image mein installed nahi hota (attack surface kam rakhne ke liye), isliye hum `node -e "require('http')..."` se ही `/healthz` check karte hain!

### 6. Commands to Execute (In Exact Order)
```powershell
# 1. Build backend and frontend images with explicit version tags
docker build -t sahil9079/js-apiserver:v1.2.0 ./apiserver
docker build -t sahil9079/js-client:v1.2.0 ./client

# 2. Compare image sizes
docker images | Select-String "js-apiserver|js-client"

# 3. Verify non-root user inside apiserver image
docker run --rm --entrypoint id sahil9079/js-apiserver:v1.2.0

# 4. Verify .config.env is NOT inside the image
docker run --rm --entrypoint ls sahil9079/js-apiserver:v1.2.0 -la /app
```

### 7. Expected Output & Verification
* `docker run --rm --entrypoint id ...` ka output: `uid=1000(node) gid=1000(node) groups=1000(node)`.
* `ls -la /app` mein `.config.env` bilkul nahi dikhna chahiye.

### 8. Common Errors & Troubleshooting
* **Problem**: Container starts and immediately exits with code `0` or `1`.
  * **Commands**: `docker ps -a`, `docker logs <container_id>`, `docker inspect <container_id> --format='{{.State.ExitCode}}'`
  * **Fix**: Make sure NGINX runs in foreground (`daemon off;`) and `apiserver` has required env vars.
* **Problem**: Image upload fails (`EACCES: permission denied, open '/app/images/...'`).
  * **Cause**: `USER node` ke paas `/app/images` directory par write permission nahi thi. Humne `chown -R node:node /app/images` se isse pehle hi solve kar diya hai.

### 9. Interview Q&A & Hands-On Task
* **Interview Question**: *"How did multi-stage builds help your React frontend image?"*
  * **Model Answer**: *"React requires Node.js, Webpack, Babel, and hundreds of npm packages to compile JSX into static HTML/CSS/JS, making the builder stage ~900MB+. However, at runtime, browsers only download static files. Using a 2-stage Dockerfile (`node:18-bullseye-slim AS Builder` $\to$ `nginx:1.29-alpine`), we copy only `/app/build` into NGINX. This shrinks the final image to ~23MB and removes Node.js and npm from the runtime container, drastically reducing CVEs."*
* **Hands-On Task**: Run `docker history sahil9079/js-client:v1.2.0` and observe how none of the `npm ci` layers from Stage 1 exist in the final image!

---

## Phase 3 — Docker Compose, NGINX Reverse Proxy, Container DNS & Persistence

### 1. Objective & Real-World Organisational Use Case
Cloud par deploy karne se pehle poora 3-tier stack (`client` NGINX + `apiserver` Express + `db` PostgreSQL) developer ke laptop par **ek command (`docker compose up -d`)** se chalna chahiye, jismein:
* Database data container restart par delete na ho (Named Volume `dbdata`).
* API container tabhi start ho jab PostgreSQL `pg_isready` health check pass kar le (`condition: service_healthy`).
* NGINX `/api/` requests ko sahi path (`/api/v1/...`) ke saath `apiserver:8010` par reverse proxy kare.

### 2. Exact Working Directory & Files
* `d:\javascript_project\node-react-postgres\client\nginx.conf`
* `d:\javascript_project\node-react-postgres\docker-compose.yaml`

### 3. Complete Configuration & Line-by-Line Explanation

#### File 1: `client/nginx.conf` (Fixing the `/api/` Trailing Slash Bug + Health Endpoint)
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location = /nginx-health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://apiserver:8010;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
* **Crucial Fix Explained (`proxy_pass http://apiserver:8010;` WITHOUT trailing slash)**:
  * Pehle aapke `client/nginx.conf` mein `proxy_pass http://apiserver:8010/;` likha tha. NGINX ka rule hai: agar `proxy_pass` mein port ke baad `/` (URI path) laga ho, toh NGINX `location /api/` ko strip kar deta hai (`/api/v1/skills` बन jata hai `/v1/skills`). Jabki bina trailing slash ke (`proxy_pass http://apiserver:8010;`), NGINX poora original path (`/api/v1/skills`) `apiserver` ko bhejta hai!
* **`try_files $uri $uri/ /index.html;`**: React ek Single Page Application (SPA) hai. Agar user `/signin` page refresh kare, toh NGINX `/usr/share/nginx/html/signin` file dhoondhega jo exist nahi karti. `try_files` 404 dene ke bajay `/index.html` return karta hai taaki React Router browser mein `/signin` render kar sake.

#### File 2: `docker-compose.yaml`
```yaml
services:
  db:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD: mypassword
      POSTGRES_USER: postgres
      POSTGRES_DB: sampledb
    volumes:
      - dbdata:/var/lib/postgresql/data
    networks:
      - backend-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d sampledb"]
      interval: 10s
      timeout: 5s
      retries: 5

  apiserver:
    build: ./apiserver
    env_file: ./apiserver/.config.env
    environment:
      DB_HOST: db
      DB_PORT: 5432
      DB_USER: postgres
      DB_PASS: mypassword
      DB_NAME: sampledb
      PORT: 8010
    image: sahil9079/js-apiserver:v1.1.0
    restart: unless-stopped
    ports:
      - "8010:8010"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - backend-net
      - frontend-net
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://127.0.0.1:8010/healthz', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 15s

  client:
    build: ./client
    image: sahil9079/js-client:v1.1.0
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      apiserver:
        condition: service_healthy
    networks:
      - frontend-net

volumes:
  dbdata: {}

networks:
  frontend-net:
    driver: bridge
  backend-net:
    driver: bridge
```

### 4. Commands to Execute (In Exact Order)
```powershell
# 1. Ensure local .config.env exists (copy from example.env if needed)
if (!(Test-Path apiserver/.config.env)) { Copy-Item apiserver/example.env apiserver/.config.env }

# 2. Validate Docker Compose syntax
docker compose config

# 3. Start the full 3-tier stack in detached mode
docker compose up --build -d

# 4. Check container status and healthchecks
docker compose ps

# 5. Run local smoke tests against API and NGINX reverse proxy
curl.exe -i http://localhost:8010/healthz
curl.exe -i http://localhost:8010/readyz
curl.exe -i http://localhost:80/

# 6. Stop containers safely WITHOUT deleting PostgreSQL volume data
docker compose stop
```

### 5. Troubleshooting Exercises
* **Scenario 1: NGINX returns `502 Bad Gateway` on `/api/v1/auth/login`**:
  * **Cause**: `apiserver` container down hai ya wrong port (`8000` instead of `8010`) par listen kar raha hai.
  * **Commands**: `docker compose ps`, `docker compose logs apiserver`, `docker compose exec client wget -qO- http://apiserver:8010/healthz`.
* **Scenario 2: `apiserver` fails with `SequelizeConnectionRefusedError: connect ECONNREFUSED 127.0.0.1:5432`**:
  * **Cause**: `apiserver/.config.env` mein `DB_HOST=localhost` likha tha aur Compose override nahi tha. Container ke andar `localhost` khud `apiserver` container hai! `DB_HOST=db` hona zaroori hai.

---

## Phase 4 — Local Observability: Prometheus Metrics, Grafana Dashboards & Alerts

### 1. Objective & Real-World Organisational Use Case
Production mein bina metrics ke aap andhe (blind) hote ho. AWS CloudWatch par paise kharch karne se pehle hum locally **Prometheus** (metrics scraper & time-series DB) aur **Grafana** (visualization dashboards) lagate hain aur `apiserver` mein `prom-client` se `/metrics` expose karte hain.

### 2. Key Golden Signals We Collect
1. **Traffic (Request Rate)**: `http_requests_total` (requests per second by method, route, status).
2. **Errors (Error Rate)**: HTTP `5xx` responses per second.
3. **Latency (Duration)**: `http_request_duration_seconds_bucket` (p95 response time).
4. **Saturation (Resources)**: Node.js process CPU, Resident Memory (`process_resident_memory_bytes`), aur Event Loop lag.

### 3. Complete Configuration Files (`deploy/prometheus/prometheus.yml` & `alerts.yml`)

#### `deploy/prometheus/prometheus.yml`
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alerts.yml"

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: "skills-apiserver"
    metrics_path: "/metrics"
    static_configs:
      - targets: ["apiserver:8010"]
        labels:
          service: "apiserver"
          environment: "local-lab"
```

#### `deploy/prometheus/alerts.yml`
```yaml
groups:
  - name: skills-platform-alerts
    rules:
      - alert: ApiTargetDown
        expr: up{job="skills-apiserver"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Skills API Server is DOWN"
          description: "Prometheus cannot scrape apiserver:8010/metrics for more than 1 minute."

      - alert: HighHttp5xxErrorRate
        expr: sum(rate(http_requests_total{status_code=~"5.."}[5m])) / clamp_min(sum(rate(http_requests_total[5m])), 1) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High HTTP 5xx Error Rate (>5%)"
          description: "More than 5% of API requests are failing with 5xx over the last 5 minutes."

      - alert: HighApiLatencyP95
        expr: histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m]))) > 0.5
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "High API p95 Latency (>500ms)"
          description: "95th percentile API response time has exceeded 500ms for 3 minutes."
```

### 4. Important PromQL Queries for Interviews
* **Requests Per Second (RPS)**: `sum(rate(http_requests_total[5m]))`
* **5xx Error Percentage**: `100 * (sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m])))`
* **p95 Latency**: `histogram_quantile(0.95, sum by (le, route) (rate(http_request_duration_seconds_bucket[5m])))`

### 5. Security Warning on High-Cardinality Labels
* Kabhi bhi Prometheus metric labels mein `user_id`, `email`, ya raw URL (`/api/v1/skills/98423`) mat daalna! Har unique combination ek nayi time-series banata hai (Cardinality Explosion), jisse Prometheus out-of-memory (`OOMKilled`) ho jata hai. Hamesha normalized route (`/api/v1/skills/:skillId`) use karein.

---

## Phase 5 — Terraform Fundamentals, Modules, Remote S3 State & Locking

### 1. Objective & Real-World Organisational Use Case
Team environment mein `terraform.tfstate` laptop par nahi rakha jata, kyunki:
1. Laptop kharab hone par state gayab ho jayega.
2. Do engineers ek saath `terraform apply` chalayenge toh state corrupt ho jayega.
Isliye hum **2-stage Terraform setup** banate hain:
* `infra/bootstrap/`: Sirf **S3 State Bucket** (versioned, KMS/AES256 encrypted, public access blocked) banata hai.
* `infra/envs/lab/`: Main infrastructure stack jo S3 bucket ko बतौर remote backend use karta hai with **native S3 state locking (`use_lockfile = true`)** (supported in your installed Terraform `v1.15.4`).

### 2. Complete Backend Configuration (`infra/envs/lab/backend.tf`)
```hcl
terraform {
  required_version = ">= 1.10.0"

  backend "s3" {
    bucket       = "REPLACE_WITH_YOUR_UNIQUE_TF_STATE_BUCKET"
    key          = "skills-platform/lab/terraform.tfstate"
    region       = "ap-south-1"
    encrypt      = true
    use_lockfile = true
  }
}
```
* **Why `infra/bootstrap` is separate from `infra/envs/lab`**: Chicken-and-egg problem! Terraform init chalane ke liye S3 bucket pehle se exist karna chahiye. Isliye pehle `infra/bootstrap` local state ke saath S3 bucket banata hai, aur phir `infra/envs/lab` us S3 bucket mein apna remote state rakhta hai.

### 3. Safe Terraform Lifecycle Commands
```powershell
# 1. Format and validate without touching AWS (Safe, $0 cost)
terraform -chdir=infra/envs/lab fmt -recursive
terraform -chdir=infra/envs/lab init -backend=false
terraform -chdir=infra/envs/lab validate

# 2. Before ANY cloud operation: verify AWS Account ID and Region!
aws sts get-caller-identity
aws configure get region

# 3. Generate and inspect deterministic execution plan
terraform -chdir=infra/envs/lab plan -out=tfplan
terraform -chdir=infra/envs/lab show tfplan
```

---

## Phase 6 — AWS VPC Networking, Subnets, NAT, Security Groups, IAM & ECR

### 1. Objective & Real-World Organisational Use Case
Production security ki buniyad (foundation) **Network Isolation** hai. Hum Mumbai (`ap-south-1`) mein `10.0.0.0/16` VPC design karte hain jismein **3-Tier Subnet Architecture** across 2 Availability Zones (`ap-south-1a` & `ap-south-1b`) hota hai:

| Subnet Tier | CIDRs (`ap-south-1a` / `1b`) | Route Table Egress | Required Kubernetes / AWS Tags | What Lives Here |
| :--- | :--- | :--- | :--- | :--- |
| **Public Subnets** | `10.0.1.0/24`, `10.0.2.0/24` | `0.0.0.0/0` $\to$ Internet Gateway (`igw`) | `kubernetes.io/role/elb = "1"` | Internet-facing **ALB** & **NAT Gateway** |
| **Private App Subnets** | `10.0.11.0/24`, `10.0.12.0/24` | `0.0.0.0/0` $\to$ NAT Gateway (`nat`) | `kubernetes.io/role/internal-elb = "1"` | **EKS Worker Nodes** & Application Pods (`client`, `apiserver`) |
| **Private DB Subnets** | `10.0.21.0/24`, `10.0.22.0/24` | Local VPC only (`10.0.0.0/16`) | RDS Subnet Group tags | **Private Amazon RDS PostgreSQL** (`5432`) |

### 2. Least-Privilege Security Group Chain (Packet Flow)
1. **`alb-sg`**:
   * **Inbound**: TCP `80` (HTTP redirect) & TCP `443` (HTTPS) from `0.0.0.0/0`.
   * **Outbound**: TCP `80` & TCP `8010` to `eks-nodes-sg`.
2. **`eks-nodes-sg`**:
   * **Inbound**: TCP `80` (client NGINX Pods) & TCP `8010` (`apiserver` Pods) **ONLY from `alb-sg`** (plus internal node-to-node cluster traffic). **No `0.0.0.0/0` inbound!** **No SSH Port 22 open to internet!**
   * **Outbound**: TCP `5432` to `rds-sg`, and HTTPS `443` via NAT Gateway (to pull images from ECR and talk to EKS Control Plane).
3. **`rds-sg`**:
   * **Inbound**: TCP `5432` **ONLY from `eks-nodes-sg`**.
   * **Outbound**: None required.

### 3. Amazon ECR Repositories
* Two repositories: `skills-apiserver` and `skills-client`.
* Configured with:
  * `image_tag_mutability = "IMMUTABLE"` (prevents overwriting an existing version tag).
  * `scan_on_push = true` (automatic vulnerability scan on every `docker push`).
  * Lifecycle Policy: expire untagged images after 1 day and keep only the last 10–15 tagged images to keep ECR storage under the Free Tier / near \$0.


---

## Phase 7 — Amazon EKS Cluster, Managed Nodes, Core Workloads, Probes, HPA & PDB

### 1. Objective & Real-World Organisational Use Case
Docker Compose single machine ke liye accha hai, par production mein humein **Self-Healing, Zero-Downtime Rolling Updates, Horizontal Pod Autoscaling (HPA), aur Multi-AZ High Availability** chahiye. Is phase mein hum Amazon EKS (Control Plane + Private Managed Node Group) aur production-grade Kubernetes manifests (`k8s/`) configure karte hain.

### 2. Crucial Fix to Existing `k8s/` Manifests (Why Your Old Manifests Crashed)
Aapke existing `k8s/secret.yaml` aur `k8s/configmap.yaml` mein ek major mismatch tha:
* `k8s/secret.yaml` mein keys `username`, `password`, aur `JWT_SECRET` the.
* Jabki `apiserver` ke code (`apiserver/models/index.js`, `apiserver/services/authService.js`, `apiserver/utils/session.js`) ko yeh exact environment variables chahiye:
  * From `ConfigMap`: `NODE_ENV`, `PORT` (`8010`), `API_VERSION` (`v1`), `DB_HOST`, `DB_PORT` (`5432`), `DB_NAME` (`sampledb`), `DB_SSL` (`true` for RDS / `false` for local), `JWT_VERIFY_EXPIRY` (`1d`), `JWT_SESSION_EXPIRY` (`1d`), `SESSION_ALGORITHM` (`aes-192-cbc`), `SESSION_COOKIE_NAME` (`__sample_session`), `PASSWORD_HASH_CYCLE` (`10`).
  * From `Secret` (`ExternalSecret` $\to$ `my-secret`): `DB_USER`, `DB_PASS`, `JWT_VERIFY_SECRET`, `JWT_SESSION_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_ENCRYPT_SECRET`.

### 3. Complete Production-Ready Manifests (`k8s/`)

#### `k8s/configmap.yaml` (Aligned with `apiserver` Code)
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: configmap
  namespace: node-react-app
data:
  NODE_ENV: "production"
  PORT: "8010"
  PORT_DEV: "8010"
  PORT_PROD: "8010"
  API_VERSION: "v1"
  DB_HOST: "postgres-service" # Overridden with Private RDS Endpoint in AWS Overlay
  DB_PORT: "5432"
  DB_NAME: "sampledb"
  DB_SSL: "false"             # Set to "true" in AWS RDS Overlay
  JWT_VERIFY_EXPIRY: "1d"
  JWT_SESSION_EXPIRY: "1d"
  JWT_REFRESH_EXPIRY: "30d"
  SESSION_ALGORITHM: "aes-192-cbc"
  SESSION_COOKIE_NAME: "__sample_session"
  PASSWORD_HASH_CYCLE: "10"
```

#### `k8s/apidep.yaml` (With Non-Root SecurityContext, Resource Limits & Probes)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: apiserver
  namespace: node-react-app
  labels:
    app: apiserver
spec:
  replicas: 2
  revisionHistoryLimit: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: apiserver
  template:
    metadata:
      labels:
        app: apiserver
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        runAsGroup: 1000
        fsGroup: 1000
      containers:
        - name: apiserver
          image: sahil9079/js-apiserver:v1.1.0
          imagePullPolicy: IfNotPresent
          ports:
            - name: apiserver-port
              containerPort: 8010
          envFrom:
            - configMapRef:
                name: configmap
            - secretRef:
                name: my-secret
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          startupProbe:
            httpGet:
              path: /healthz
              port: apiserver-port
            failureThreshold: 12
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /healthz
              port: apiserver-port
            initialDelaySeconds: 10
            periodSeconds: 15
            timeoutSeconds: 3
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /readyz
              port: apiserver-port
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 3
```

### 4. Operational Commands & Verification
```powershell
# 1. Always verify AWS Identity and Kubernetes Context FIRST!
aws sts get-caller-identity
aws eks update-kubeconfig --region ap-south-1 --name skills-lab-eks
kubectl config current-context

# 2. Check nodes and apply manifests
kubectl get nodes -o wide
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/ -n node-react-app

# 3. Verify rollout, Pods, Services, and EndpointSlices
kubectl rollout status deployment/apiserver -n node-react-app
kubectl get deploy,po,svc,endpointslices -n node-react-app
```

---

## Phase 8 — Private Amazon RDS PostgreSQL, Secrets Manager, TLS & Backups

### 1. Objective & Real-World Organisational Use Case
Kubernetes ke andar stateful database (`dbdep.yaml` + `dbpvc.yaml`) chalane par automated point-in-time backups, Multi-AZ synchronous standby failover, OS patching, aur storage encryption khud संभालना padta hai. Production mein hum **Amazon RDS for PostgreSQL 15** (Private DB Subnets, `publicly_accessible = false`) use karte hain.

### 2. Why Multi-AZ Failover != Database Backups (Classic Interview Question)
* **Multi-AZ Deployment**: Primary DB ka data synchronously dusre Availability Zone ke Standby instance par replicate hota hai. Agar `ap-south-1a` ka hardware fail ho jaye, toh RDS 60–120 seconds mein DNS automatically Standby par flip kar deta hai (**High Availability**). Lekin agar kisi bug ya इंसान ne `DROP TABLE skills;` chala diya, toh woh `DROP TABLE` turant Standby par bhi replicate ho jayega!
* **Automated Backups & Snapshots**: Accidental data deletion (`DROP TABLE`), data corruption, ya ransomware se bachne ke liye **Automated Backups (Point-in-Time Recovery)** zaroori hain (**Disaster Recovery / RPO**).

### 3. External Secrets Operator (`k8s/external-secret.yaml`)
Aapke repo mein `k8s/external-secret.yaml` pehle se hai, par usmein `secretKey` names (`username`, `password`) ko update karke `DB_USER`, `DB_PASS`, `JWT_VERIFY_SECRET`, `JWT_SESSION_SECRET`, aur `SESSION_ENCRYPT_SECRET` rakhna zaroori hai taaki AWS Secrets Manager (`ap-south-1`) se aane wale credentials seedha `apiserver` ke env vars se match karein.

### 4. Testing RDS Connectivity Safely from EKS (Without Printing Passwords)
```powershell
# Test DNS and TCP port 5432 connectivity from inside the apiserver Pod
kubectl exec -it deploy/apiserver -n node-react-app -- node -e "const { sampledb } = require('./models'); sampledb.authenticate().then(() => console.log('RDS TLS Connected OK')).catch(e => { console.error(e.message); process.exit(1); })"
```

---

## Phase 9 — AWS Load Balancer Controller, Ingress, ALB & Path-Based Routing

### 1. Objective & Real-World Organisational Use Case
Agar aap har Kubernetes Service ko `type: LoadBalancer` banate ho, toh AWS har Service ke liye alag Classic/Network/Application Load Balancer khada kar deta hai (har ALB ka ~$16–$20/month fixed charge!).
Iske bajay, hum `client-service` aur `apiserver-service` dono ko **`type: ClusterIP`** rakhte hain aur **ek single Kubernetes `Ingress`** banate hain jise **AWS Load Balancer Controller** watch karke **ek single Internet-facing ALB** banata hai:
* `/api/*` $\to$ `apiserver-service:8010`
* `/*` $\to$ `client-service:80`

### 2. Complete ALB Ingress Manifest (`k8s/ingress.yaml`)
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: skills-platform-ingress
  namespace: node-react-app
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/healthcheck-path: /healthz
    alb.ingress.kubernetes.io/healthcheck-port: "8010"
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}]'
    # For HTTPS with ACM in production, add:
    # alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
    # alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:ap-south-1:ACCOUNT_ID:certificate/CERT_ID
    # alb.ingress.kubernetes.io/ssl-redirect: "443"
spec:
  ingressClassName: alb
  rules:
    - http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: apiserver-service
                port:
                  number: 8010
          - path: /
            pathType: Prefix
            backend:
              service:
                name: client-service
                port:
                  number: 80
```

### 3. Interview Distinction: `target-type: ip` vs `target-type: instance`
* **`target-type: instance`**: ALB traffic ko kisi bhi EKS Worker Node ke `NodePort` (30000–32767) par bhejta hai, aur phir `kube-proxy` (iptables/IPVS) us packet ko doosre node par baithe Pod tak forward karta hai (extra network hop!).
* **`target-type: ip` (Recommended with AWS VPC CNI)**: Har Pod ko VPC subnet se real private IP milta hai. ALB seedha **Pod ke IP address** par traffic bhejta hai—bina `NodePort` aur bina extra network hop ke!

---

## Phase 10 — GitHub Actions CI/CD, AWS OIDC, Immutable Tags, Rollout & Rollback

### 1. Objective & Real-World Organisational Use Case
Code push hone se lekar EKS deployment tak ka poora safar automated, secure, aur reversible hona chahiye:
* **CI Pipeline (`ci.yml`)**: Pull Request aur `main` push par parallel unit/integration tests (`apiserver` + `client`), 50% coverage gate, `npm audit`, SonarQube scan, Docker image build, aur Trivy image/filesystem scan chalata hai.
* **CD Pipeline (`deploy-lab.yml`)**: **GitHub OIDC (`aws-actions/configure-aws-credentials`)** se bina static AWS keys ke IAM Role assume karta hai, `GITHUB_SHA` se immutable image ECR mein push karta hai, EKS mein rollout karta hai, smoke test chalata hai, aur fail hone par automatic **`kubectl rollout undo`** karta hai!

### 2. Why OIDC Instead of `AWS_ACCESS_KEY_ID` in GitHub Secrets?
1. Long-lived IAM user keys kabhi expire nahi hoti jab tak manually rotate na karo.
2. OIDC mein GitHub Actions runner ek signed JWT token AWS STS (`AssumeRoleWithWebIdentity`) ko deta hai.
3. AWS IAM Trust Policy check karti hai ki request sirf aapke GitHub repo (`repo:sahil9079/node-react-postgres:ref:refs/heads/main`) se aayi hai, aur sirf **1 hour ka temporary credential** deti hai.

### 3. Fixing the Existing `.github/workflows/main.yaml` Bug
Aapke `.github/workflows/main.yaml` ke line 80 par `vulnerabitlity-type: os,library` likha hai (spelling mistake: `vulnerabitlity`). Trivy action mein sahi parameter `vuln-type: 'os,library'` hota hai.

---

## Phase 11 — DevSecOps: SonarQube, Trivy, Secret Scanning & Least Privilege

### 1. SAST vs. SCA vs. Container Scanning vs. DAST
* **SAST (Static Application Security Testing — SonarQube)**: Apne likhe hue JavaScript/React source code (`apiserver/`, `client/src/`) mein bugs, code smells, aur security hotspots dhoondhna.
* **SCA (Software Composition Analysis — `npm audit` & Trivy `fs`)**: Third-party open-source dependencies (`package-lock.json`) mein known CVEs dhoondhna.
* **Container Image Scanning (Trivy `image`)**: Final built Docker image (`node:18-bullseye-slim` + Debian OS packages + npm packages) ko scan karna before pushing to ECR.
* **DAST (Dynamic Application Security Testing — OWASP ZAP)**: Running application ke HTTP endpoints par bahar se simulated attacks chala kar test karna (sirf apne authorized lab par!).

### 2. Realistic Vulnerability Management Policy (For Interviews)
Kabhi bhi interview mein yeh mat bolna ki *"Humne zero vulnerabilities achieve kar li aur har CVE par build block kar dete hain."*
**Realistic Senior Answer**:
*"We block the pipeline on **CRITICAL and HIGH** vulnerabilities that have an upstream fix available (`--ignore-unfixed`). If a newly disclosed CVE in a transitive dependency or Debian base layer does not have a patch yet or is a verified false positive (not reachable in runtime), we document a time-bound exception in `.trivyignore` with a ticket link and a 14-day review expiry."*

---

## Phase 12 — CloudWatch, Prometheus, Grafana & 9 Production Incident Playbooks

Har incident ko solve karne ke liye hum **7-Step SRE Triage Formula** follow karte hain:
> **Symptom $\to$ Evidence $\to$ Narrow the Failure Domain $\to$ Root Cause $\to$ Fix (Mitigate & Remediate) $\to$ Verify $\to$ Prevent**

Niche aapke project ke **9 Mandatory Production Incident Playbooks** diye gaye hain:

### Incident 1: API Returning HTTP 500 (Internal Server Error)
1. **Symptom**: Frontend login/register fail ho raha hai; Prometheus `HighHttp5xxErrorRate` alert fire hua.
2. **Evidence Commands**:
   ```powershell
   kubectl logs deploy/apiserver -n node-react-app --tail=100
   ```
3. **Narrow Failure Domain**: HTTP 500 ka matlab request ALB $\to$ Service $\to$ `apiserver` Pod tak pahunch gayi hai (network/routing theek hai), par Express code ya DB query fail hui hai.
4. **Root Cause (Real Project Example)**: `apiserver/utils/session.js` mein `SESSION_ENCRYPT_SECRET` missing tha ya DB table (`roles`/`users`) sync/seed nahi hua tha.
5. **Fix**: Update `Secret`/`ConfigMap` aur restart deployment (`kubectl rollout restart deploy/apiserver -n node-react-app`), ya bad code release ho toh `kubectl rollout undo deploy/apiserver -n node-react-app`.
6. **Verify**: `curl -i https://<alb-dns>/api/v1/auth/check-auth` & Grafana 5xx panel drops to 0.
7. **Prevent**: Startup config validation + integration test in CI.

### Incident 2: ALB Returning HTTP 503 (Service Temporarily Unavailable)
1. **Symptom**: Browser par `503 Service Temporarily Unavailable` (from `awselb/2.0`) aa raha hai.
2. **Evidence Commands**:
   ```powershell
   kubectl get ingress,svc,endpointslices -n node-react-app
   kubectl get pods -n node-react-app -o wide
   aws elbv2 describe-target-health --target-group-arn <TG_ARN> --region ap-south-1
   ```
3. **Narrow Failure Domain**: AWS ALB tab 503 deta hai jab Target Group mein **zero healthy targets** hon.
4. **Root Cause**: Ya toh Service `selector` (`app: apiserver`) Pod labels se match nahi kar raha (`EndpointSlices` empty), ya `readinessProbe` (`/readyz`) fail ho raha hai, ya `eks-nodes-sg` ALB Security Group se port `8010` block kar raha hai.
5. **Fix**: Match Service selector / fix Security Group / fix `/readyz` dependency.
6. **Verify**: Target Group health becomes `healthy`; `curl -i http://<alb-dns>/healthz` returns `200 OK`.
7. **Prevent**: Smoke test in CD pipeline + `CloudWatch UnHealthyHostCount > 0` alarm.

### Incident 3: Pod Stuck in `CrashLoopBackOff`
1. **Symptom**: `kubectl get pods -n node-react-app` shows `STATUS: CrashLoopBackOff`, `RESTARTS: 5`.
2. **Evidence Commands**:
   ```powershell
   kubectl describe pod <pod-name> -n node-react-app
   kubectl logs <pod-name> -n node-react-app --previous
   ```
3. **Narrow Failure Domain**: Container start hota hai aur PID 1 (`node index.js`) non-zero exit code (`Exit Code 1` ya `137`) ke saath crash ho jata hai.
4. **Root Cause (Discovered in Audit)**: `k8s/secret.yaml` mein `SESSION_ENCRYPT_SECRET` missing tha, jisse `apiserver/utils/session.js` line 3 par `TypeError: The "password" argument must be of type string` fek kar crash ho gaya! (Agar `Exit Code 137` / `OOMKilled` ho, toh memory limit kam hai).
5. **Fix**: Add missing keys to `my-secret` / increase memory limit in `apidep.yaml`.
6. **Verify**: `kubectl get pods -n node-react-app` shows `1/1 Running` with `0` new restarts.
7. **Prevent**: Kustomize schema/manifest validation & staging smoke test.

### Incident 4: Pod `Running` (`0/1 Ready`) — Traffic Not Reaching Pod
1. **Symptom**: Pod `STATUS` is `Running`, restarts = `0`, par `READY` column `0/1` hai.
2. **Evidence Commands**:
   ```powershell
   kubectl describe pod <pod-name> -n node-react-app | Select-String -Context 0,10 "Events"
   ```
3. **Narrow Failure Domain**: Process zinda hai (`livenessProbe` `/healthz` pass hai), par **`readinessProbe` (`/readyz`) fail ho raha hai**!
4. **Root Cause**: `/readyz` PostgreSQL se connect nahi kar pa raha (`DB_HOST` गलत hai ya RDS down hai), ya `readinessProbe` ka port गलत (`8000` vs `8010`) configured hai.
5. **Fix**: Correct `DB_HOST` in `configmap.yaml` or fix RDS connectivity.
6. **Verify**: Pod transitions to `1/1 Ready` and appears in `kubectl get endpointslices -n node-react-app`.

### Incident 5: PostgreSQL / RDS Connection Failure
1. **Symptom**: `/readyz` returns `503` (`unable to connect sampledb!`); API logs show `ConnectionTimedOutError` or `password authentication failed`.
2. **Evidence Commands**:
   * **Timeout (`ETIMEDOUT`)**: Network/Security Group/NACL block! Check `rds-sg` inbound rules (`5432` from `eks-nodes-sg`).
   * **Connection Refused (`ECONNREFUSED`)**: Wrong `DB_HOST` or `DB_PORT`.
   * **Auth / SSL Error (`no pg_hba.conf entry... SSL off`)**: RDS requires SSL (`rds.force_ssl=1`) while `DB_SSL` was `false`, or `DB_PASS` in Secrets Manager is out of sync with RDS master password.
3. **Fix**: Enable `DB_SSL="true"` in ConfigMap, allow `eks-nodes-sg` on TCP `5432` in `rds-sg`, and sync ExternalSecret.

### Incident 6: High API Latency (`p95 > 1.5s`)
1. **Symptom**: `HighApiLatencyP95` alert triggers; site feels sluggish.
2. **Evidence**: Check Grafana (`CPU throttling`, `Event Loop Lag`, `RDS CPU & Active Connections`) and run `kubectl top pods -n node-react-app`.
3. **Root Cause**: Unindexed SQL query on `skills`, Sharp image processing CPU spike (`resizeSingleImage.js`) under load causing CPU throttling, or insufficient Pod replicas.
4. **Fix**: Scale via HPA, adjust CPU limits, and optimize DB query/connection pool.

### Incident 7: Disk or Memory Pressure (`OOMKilled` / `Evicted`)
1. **Symptom**: Pods evicted with `DiskPressure` or killed with `OOMKilled` (`Exit Code 137`).
2. **Evidence**: `kubectl describe node`, `kubectl top nodes`, `kubectl top pods -n node-react-app`.
3. **Root Cause**: Multer/Sharp buffering large uploads in memory (`storage: "memory"` in `userRoutes.js`!) without request size limits, or uncleaned Docker images/logs filling node EBS root volume.
4. **Fix**: Enforce Multer `limits: { fileSize: 2 * 1024 * 1024 }`, set Pod memory `requests`/`limits`, and configure CloudWatch/node disk cleanup.

### Incident 8: Prometheus Target Down (`up == 0`)
1. **Symptom**: `ApiTargetDown` alert fires; Grafana panels show `No Data`.
2. **Evidence**: Open Prometheus UI $\to$ `Status -> Targets` and check the exact scrape error (`context deadline exceeded`, `connection refused`, `404 page not found`).
3. **Root Cause**: `prometheus.yml` target hostname/port mismatch (`apiserver:8010` vs `apiserver-service:8010`), NetworkPolicy blocking Prometheus namespace, or `/metrics` route missing.
4. **Fix**: Verify `curl http://apiserver:8010/metrics` from the Prometheus container network.

### Incident 9: CI/CD Deployment Failure & Automated Rollback
1. **Symptom**: `deploy-lab.yml` fails during `kubectl rollout status` or `smoke-test.sh`.
2. **Evidence**: Check GitHub Actions step logs + `kubectl rollout history deploy/apiserver -n node-react-app` + `kubectl describe rs -n node-react-app`.
3. **Root Cause**: OIDC trust policy rejected the branch, `ImagePullBackOff` (wrong ECR tag/permissions), or new Pod failed readiness probe.
4. **Fix**: Pipeline automatically executes `kubectl rollout undo deployment/apiserver -n node-react-app` to restore the previous revision while engineers inspect logs.

---

## Phase 13 — Reliability Testing, Scaling, Backup Restore, RTO/RPO & DR

### 1. Four Mandatory Reliability Drills (Perform After Basic Stack Works)
1. **Drill 1 — Pod Self-Healing**:
   * Run `kubectl delete pod -l app=apiserver -n node-react-app` while watching `kubectl get pods -n node-react-app -w`.
   * Observe the `ReplicaSet` controller immediately spin up a replacement Pod within seconds.
2. **Drill 2 — Bad Image Rollout & Zero-Downtime Rollback**:
   * Deploy a non-existent tag (`kubectl set image deployment/apiserver apiserver=sahil9079/js-apiserver:broken-tag -n node-react-app`).
   * Because `maxUnavailable: 0` is configured, the old Pods keep serving 100% of traffic while the new Pod sits in `ImagePullBackOff`!
   * Roll back cleanly: `kubectl rollout undo deployment/apiserver -n node-react-app`.
3. **Drill 3 — Controlled Load Test with Existing `k6` Scripts (`apiserver/k6-tests/skills.js`)**:
   * Run `k6 run apiserver/k6-tests/skills.js` against your local/lab environment while watching Grafana RPS/p95 latency and `kubectl get hpa -n node-react-app -w`.
4. **Drill 4 — Database Backup & Point-in-Time Restore (RTO / RPO)**:
   * Take an RDS manual snapshot (`aws rds create-db-snapshot`), restore it to a temporary instance (`aws rds restore-db-instance-from-db-snapshot`), verify the `skills` records exist, measure the time taken (**Measured RTO**), and delete the temporary instance immediately after verification.

---

## Phase 14 — Organisation Workflow, Sprint Tickets, PR Reviews & Interview Defense

### 1. How DevOps Engineers Communicate Across Teams (Real Workplace Sentences)
* **With Backend Developers**: *"Hey team, I noticed `apiserver/utils/session.js` crashes at import time if `SESSION_ENCRYPT_SECRET` is unset, and `app.js` didn't have a DB readiness check. I added `/healthz` and `/readyz` and documented the required Secret keys in `example.env` so Kubernetes probes can manage traffic safely."*
* **With Security Engineers (AppSec)**: *"We fixed the `.dockerignore` leak where `.config.env` could be copied into the image, switched `apiserver` to a multi-stage `--omit=dev` build running as UID 1000 (`USER node`), and replaced static AWS keys in GitHub Actions with an OIDC IAM role scoped to the `main` branch."*
* **With Cloud Architects / FinOps (Managers)**: *"To keep our learning/staging lab costs low, I parameterized the Terraform network and RDS modules so the lab runs a single NAT Gateway and Single-AZ `db.t4g.micro` RDS, while production `tfvars` enables per-AZ NAT Gateways and Multi-AZ RDS failover."*

### 2. Top Technical Interview Questions & Model Answers for This Project

1. **Q: Why did you choose Amazon RDS for PostgreSQL instead of running PostgreSQL inside Kubernetes (`dbdep.yaml` + `dbpvc.yaml`)?**
   * **A**: *"In my initial repository (`k8s/dbdep.yaml`), PostgreSQL ran as a Deployment backed by a 3Gi `ReadWriteOnce` EBS PVC. That has severe production limitations: an EBS volume is locked to a single Availability Zone, a `Deployment` with `RWO` volume can fail during rolling updates due to multi-attach errors, and we would have to manually manage `pg_dump` backups, WAL archiving, and failover. Moving PostgreSQL to private Amazon RDS offloads automated backups, Point-in-Time Recovery, KMS encryption, and Multi-AZ standby failover to AWS, while keeping stateless `client` and `apiserver` workloads on EKS."*
2. **Q: How does a request travel from the user's browser to the database in your AWS architecture?**
   * **A**: *"Browser resolves the domain via Route 53 and connects over HTTPS (443) to our internet-facing Application Load Balancer in the public subnets, where the ACM TLS certificate terminates SSL. The AWS Load Balancer Controller configures ALB listener rules from our Kubernetes `Ingress`: requests matching `/api/*` are forwarded directly to the private Pod IPs (`target-type: ip`) of `apiserver` on port `8010` in the private application subnets, while `/*` goes to the `client` NGINX Pods on port `80`. The `apiserver` Pod then queries Amazon RDS PostgreSQL in the private DB subnets on TCP port `5432` over TLS, allowed strictly by Security Group chaining (`alb-sg` $\to$ `eks-nodes-sg` $\to$ `rds-sg`)."*

---

## Phase 15 — AWS Cost Optimisation, Safe Shutdown, Teardown & Billing Audit

Cloud bill shock se bachne ke liye humne ek dedicated, step-by-step manual banaya hai:
👉 **[Open AWS_COST_OPTIMIZATION_AND_CLEANUP.md](./AWS_COST_OPTIMIZATION_AND_CLEANUP.md)**

Har cloud session se pehle aur baad mein us guide ke **Operation A (Local Stop)**, **Operation B (Temporary AWS Workload Shutdown)**, aur **Operation C (Complete Dependency-Ordered Teardown + Post-Destroy Verification)** ko strictly follow karein.
