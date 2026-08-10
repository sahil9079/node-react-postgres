# 06. Quick-Revision Cheat Sheet

> **Drill this daily (30 min).** One-line definitions for every concept + the comparison tables interviewers love. If you only remember ONE thing per topic, remember these.

---

## 1. CI/CD — One-Liners

| Concept | One-liner |
|---|---|
| **CI** | Automatically build + test every commit to catch problems early |
| **CD** | Automatically deploy tested artifacts to environments |
| **Quality gate** | Binary pass/fail checkpoint that stops the pipeline on failure |
| **PR checks** | Fast feedback (lint, unit, build, secret scan) |
| **Merge checks** | Full suite, SonarQube, security scans, image build, deploy |
| **Nightly checks** | Expensive/deep: E2E, full scanning, drift detection |
| **Branch protection** | Rules that block merging unless required checks pass |
| **Required status checks** | CI jobs that MUST pass before a merge is allowed |
| **Rollback** | Redeploy last-known-good artifact (`kubectl rollout undo`) |
| **Break-glass** | Documented audited emergency procedure to bypass gates |
| **Compensating control** | Alternative mitigation when a primary security tool is down |
| **Promotion** | Build once, move the SAME artifact through envs |
| **Flaky test** | Fails intermittently for non-code reasons → quarantine + fix root cause |

**Coverage threshold enforcement:**
```bash
jest --coverage --coverageThreshold='{"global":{"lines":80}}'
```

**Quality gate overrides:** rare → senior approval → logged → time-boxed → re-verified.

---

## 2. Terraform — One-Liners

| Concept | One-liner |
|---|---|
| **IaC** | Manage infra as code — versioned, reviewable, repeatable |
| **Module** | Reusable block of .tf with variables + outputs |
| **State** | Terraform's record of what infra it created (JSON) |
| **Remote state** | State in S3/GCS/TFC — shared, encrypted, locked |
| **Locking** | DynamoDB prevents two concurrent applies |
| **Drift** | Reality ≠ state ≠ config |
| **Refresh** | Sync state with real infra (no changes) |
| **Plan** | Preview of changes (safe, no apply) |
| **Apply** | Execute the plan |
| **Workspace** | Multiple states from ONE config |
| **Separate state** | Isolated state per env — prod isolation |
| **`prevent_destroy`** | Blocks accidental deletion of prod resources |
| **Sensitive vars** | `sensitive = true`, never hardcode secrets |
| **Policy as code** | OPA/Sentinel blocks unsafe changes |

**Backend example:**
```hcl
terraform { backend "s3" { bucket="x" key="prod/state" region="ap-south-1" encrypt=true dynamodb_table="tf-locks" } }
```

**Rule:** `init` (configures backend) → `plan` (review) → `apply` (locked, audited). Plan in PR, apply on merge/approval.

---

## 3. Kubernetes — One-Liners

| Concept | One-liner |
|---|---|
| **Pod** | Smallest deployable unit (1+ containers) |
| **Deployment** | Manages stateless apps, rolling updates, rollbacks |
| **ReplicaSet** | Ensures N replicas; Deployment manages RS per revision |
| **StatefulSet** | Stable identity + per-pod storage + ordered ops (DBs) |
| **DaemonSet** | One pod per node (log/metrics agents) |
| **Service** | Stable network endpoint for a set of pods |
| **ClusterIP** | Internal-only virtual IP |
| **NodePort** | Exposes service on every node: 30000-32767 |
| **LoadBalancer** | Cloud LB → NodePort → Service → pods |
| **Ingress** | L7 host/path routing + TLS to multiple services |
| **Headless** | `clusterIP: None` → per-pod DNS (StatefulSet discovery) |
| **ConfigMap** | Non-sensitive config (plaintext) |
| **Secret** | Sensitive config (base64 — NOT encryption) |
| **PV/PVC** | Storage resource + storage request; PVC binds PV |
| **StorageClass** | Dynamic provisioning definition (provisioner + params) |
| **RWO/RWX** | Single-node read-write vs multi-node read-write |
| **Liveness** | Failed → container restarted |
| **Readiness** | Failed → pod removed from Service (no restart) |
| **Startup** | Grace period for slow-starting apps |
| **Requests** | Guaranteed resources (scheduler uses) |
| **Limits** | Max resources (throttle/OOMKill if exceeded) |
| **HPA** | Auto-scale replicas on CPU/mem/custom metrics |
| **RollingUpdate** | Gradual swap maxSurge/maxUnavailable |
| **Rollback** | `kubectl rollout undo deployment/x` |
| **NodePort range** | 30000–32767 |

**Probe mnemonic:** Liveness = "is it alive? restart it". Readiness = "can it take traffic? exclude it".

---

## 4. AWS / EKS — One-Liners

| Concept | One-liner |
|---|---|
| **EKS** | Managed K8s control plane on AWS |
| **ECR** | AWS Docker registry |
| **OIDC** | GitHub assumes scoped IAM role — no stored keys |
| **IRSA** | Pods assume AWS roles via ServiceAccount |
| **EKS pull ECR** | Worker node IAM role grants ECR read (automatic) |
| **Deploy new version** | `kubectl set image` / update manifest + apply / Helm |
| **Verify rollout** | `kubectl rollout status deployment/x` |
| **Rollback** | `kubectl rollout undo deployment/x` |
| **Blue-green** | Two parallel envs, switch LB all at once |
| **Canary** | Ramp traffic % (10→100) with metrics comparison |
| **Rolling** | Gradual pod replacement (default) |
| **RED** | Rate, Errors, Duration (app metrics) |
| **USE** | Utilization, Saturation, Errors (infra metrics) |

**Promotion rule:** build once → staging test → SAME image to prod → canary → full.

---

## 5. DevSecOps — One-Liners

| Concept | One-liner |
|---|---|
| **SAST** | Static code scan (no run) — early, fast, in CI |
| **DAST** | Attack the running app — after deploy |
| **SCA** | Scan third-party deps for CVEs (npm audit, Snyk) |
| **Container scan** | Scan image: base OS + language packages + misconfig |
| **Trivy** | Open-source scanner: images, fs, IaC, K8s, SBOM |
| **CVE** | Public vulnerability ID + CVSS severity |
| **CVSS** | 0-10 severity score (7-8.9 high, 9-10 critical) |
| **SonarQube** | SAST + code quality gate |
| **gitleaks** | Scans for secrets in git |
| **Shift-left** | Run security early in the pipeline |
| **Critical CVE playbook** | Assess exposure → prioritize → patch/mitigate → verify → rescan |
| **Secrets in K8s** | K8s Secret + KMS + External Secrets + RBAC |
| **Block deploy on** | Critical/high CVE, secrets in code, critical SAST, misconfig, test/gate fail |

**SonarQube vs Trivy:** SonarQube = YOUR code quality. Trivy = dependencies/base image. Complementary.

---

## 6. Golden "Say This" Phrases (Memorize)

**When asked "how would you approach X" → use this structure:**
> "I'd start by understanding the risk/size of X, then... [concrete steps]. In my project I did [Y], so I'd extend it by [Z]. And I'd make sure to [monitoring/gate/rollback]."

**Deployment strategy:**
> "I'd deploy to staging first, validate, then promote the same artifact. In prod I'd use a canary — 10% traffic, compare error rate and latency, ramp to 100%. Rollback is one command."

**Security:**
> "Security is shift-left — secret scanning and SAST on PRs, dependency and image scanning as merge/nightly gates. Critical and high findings block the deploy. Exceptions are time-boxed, approved by security, and audited."

**K8s Service story:**
> "I used ClusterIP internally and LoadBalancer for the public client. I chose LoadBalancer over Ingress because my client nginx already handles path routing — Ingress would add cost with no benefit."

**Terraform:**
> "Remote state in S3 with DynamoDB locking. Plan in the PR for review, apply on merge with an IAM role scoped to that environment. Prod has its own state and manual approval."

---

## 7. Sample Answer — "Walk me through your project" (full)

> "I built the DevOps pipeline for a 3-tier app — Express API, React client, PostgreSQL.
>
> **Containerization:** I wrote a multi-stage Dockerfile for the client so the build runs in Node but the runtime image is just nginx (~23MB), and the API uses `node:18-slim` running as a non-root user with `npm ci` and a `.dockerignore`. Docker Compose orchestrates all three with a healthcheck so the API waits for Postgres to be truly ready.
>
> **Kubernetes:** I created 10 manifests — namespace, ConfigMap and Secret for env injection, a 3Gi PVC plus a Deployment and ClusterIP Service for Postgres, Deployment + ClusterIP for the API, and a Deployment + LoadBalancer Service for the client. The nginx config inside the client serves the React SPA and reverse-proxies `/api/` to the apiserver service.
>
> **CI/CD design:** a GitHub Actions pipeline that runs 62 Jest tests with a 50% coverage gate, SonarQube quality analysis, builds and pushes the images to Docker Hub, and deploys to EKS. 
>
> **Quality & security:** SonarQube with an enforced quality gate, coverage thresholds, non-root containers, and secrets stored in a K8s Secret rather than config.
>
> **Hardest problem:** debugging why Jest 25 couldn't parse modern `node:` protocol imports — upgrading to Jest 29 resolved it. And figuring out the Docker-to-K8s DNS naming differences for `DB_HOST`.
>
> **Next steps I'd take:** Helm, ArgoCD GitOps, Terraform for the cluster, Prometheus/Grafana, and Trivy in the pipeline."

---

*All topics covered. Go to [README.md](README.md) for the study plan. Good luck — you've got this!*
