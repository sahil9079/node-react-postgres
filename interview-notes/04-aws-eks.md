# 04. AWS / EKS / Deployment — Detailed Notes

> Focus: **how code gets to EKS securely** + **deployment strategies** (rolling/blue-green/canary) + **monitoring & rollback**. Tie every answer to your project.

---

## SECTION A: Deploying to EKS

### Q1. How would you deploy an application to EKS?

**End-to-end flow:**

```
1. Build Docker image (CI) → push to ECR
2. Create/update K8s manifests (Deployment + Service)
3. kubectl set image OR kubectl apply -f manifests
4. Verify rollout → monitor → traffic
```

**Detailed steps:**
1. **Push image** to ECR: `docker tag app:tag 123456789012.dkr.ecr.region.amazonaws.com/app:tag && docker push`
2. **Update manifests** with new image tag
3. **Apply:** `kubectl apply -f k8s/` (or `kubectl set image deployment/apiserver apiserver=...:tag`)
4. **Wait & verify:** `kubectl rollout status deployment/apiserver`
5. **Expose:** LoadBalancer service already created → traffic flows
6. **Monitor:** CloudWatch, kubectl get pods, logs

**Alternative (GitOps):** commit manifest change → ArgoCD/Flux syncs to cluster automatically.

---

### Q2. How does a CI/CD pipeline authenticate with AWS?

**The two main options:**

**A) Long-lived IAM user keys (NOT recommended for prod):**
```yaml
env:
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
  AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

**B) OIDC federated role (RECOMMENDED):**
```yaml
- uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::123456789012:role/gha-eks-deploy
    aws-region: ap-south-1
```
- GitHub sends an OIDC token → AWS **assumes a role** scoped to exactly what the pipeline needs
- **No secrets stored** — nothing to leak/rotate

**What the role allows:** push to ECR, update EKS cluster (eks:DescribeCluster + k8s RBAC for the deploy SA), CloudWatch logging.

---

### Q3. How would GitHub Actions authenticate with AWS securely?

1. **Create an IAM OIDC identity provider** for `token.actions.githubusercontent.com` in AWS
2. **Create an IAM role** with a **trust policy** that trusts GitHub's OIDC (restrict to your repo/branch)
3. Attach **least-privilege permissions** (ECR push, EKS access, S3, etc.)
4. In the workflow, use `aws-actions/configure-aws-credentials@v4` with `role-to-assume`
5. Pipeline gets **temporary credentials** from STS (valid ~1hr, auto-renewed per job)

**Why this is secure:**
- No long-lived keys in CI (a leaked key = full access forever)
- **Scoped** — role only allows ECR/EKS actions
- **Auditable** — CloudTrail logs every assume-role call
- **Branch-restricted** — trust policy can limit which branch triggers the role

---

### Q4. Why would you use OIDC instead of long-lived AWS access keys?

| | Long-lived keys | OIDC |
|---|---|---|
| **Secret storage** | stored in CI secrets (leak risk) | none stored — tokens per-run |
| **Lifetime** | months/years | minutes/hours (STS temp) |
| **Blast radius** | leaked key = persistent access | expired after job |
| **Rotation** | manual, easy to forget | automatic per run |
| **Scoping** | key = broad permissions | role = least privilege |
| **Audit** | weak | strong (CloudTrail assume-role) |

**Answer:** "OIDC removes standing secrets from CI. Each run generates a short-lived token that assumes a least-privilege IAM role. No keys to leak, rotate, or manage."

---

### Q5. How do you push a Docker image to ECR?

```bash
# 1. Auth to ECR (get a login token)
aws ecr get-login-password --region ap-south-1 \
  | docker login --username AWS --password-stdin \
    123456789012.dkr.ecr.ap-south-1.amazonaws.com

# 2. Build & tag
docker build -t 123456789012.dkr.ecr.ap-south-1.amazonaws.com/app:v1.0.0 .

# 3. Push
docker push 123456789012.dkr.ecr.ap-south-1.amazonaws.com/app:v1.0.0
```

**In CI (GitHub Actions):**
```yaml
- uses: aws-actions/configure-aws-credentials@v4
  with: { role-to-assume: "...", aws-region: "ap-south-1" }
- uses: aws-actions/amazon-ecr-login@v2
- run: docker build -t $ECR_REPO:$TAG . && docker push $ECR_REPO:$TAG
```

**Tag strategy:** immutable tags (`v1.2.3`, git SHA) — never overwrite for prod.

---

### Q6. How does EKS pull images from ECR?

**When a pod starts, kubelet pulls from ECR. It needs auth.** Options:

1. **ECR IAM role / kubelet credentials** — EKS worker nodes have an IAM role (node instance profile) that grants ECR read → kubelet pulls automatically. **This is the standard, hands-off approach** for the same-account case.
2. **`imagePullSecrets`** — for cross-account or non-IAM cases: create a Secret with ECR auth (`kubectl create secret docker-registry`) and reference it in the pod spec:
```yaml
spec:
  imagePullSecrets:
  - name: ecr-registry-cred
```
3. **IAM Roles for Service Accounts (IRSA)** — pod-level AWS permissions.

**Common answer:** "With EKS worker nodes carrying an ECR read IAM role, kubelet authenticates automatically — no imagePullSecrets needed. For cross-account, I'd use an imagePullSecret."

---

### Q7. How do you deploy a new image version to EKS?

**Three ways:**

```bash
# 1. Declarative — update manifest + apply (GitOps friendly)
kubectl apply -f deployment.yaml     # image updated in YAML

# 2. Imperative — set image directly
kubectl set image deployment/apiserver \
  apiserver=1234.dkr.ecr....amazonaws.com/app:v1.2.0

# 3. Helm
helm upgrade --install app ./chart --set image.tag=v1.2.0
```

**Best practice:** update the manifest in Git, then `kubectl apply` or let ArgoCD sync. Rolling update kicks in automatically.

---

### Q8. How do you check whether a Kubernetes rollout was successful?

```bash
kubectl rollout status deployment/apiserver
# "deployment "apiserver" successfully rolled out"

kubectl rollout history deployment/apiserver
kubectl get rs -l app=apiserver      # check old/new ReplicaSets

# Verify pods ready
kubectl get pods -l app=apiserver -o wide
kubectl get events --sort-by=.lastTimestamp
```
**Success criteria:** new ReplicaSet fully scaled up, old scaled to 0, all pods Ready, no failed events. If `progressDeadlineSeconds` exceeded → rollout marked failed → auto-triggers rollback.

---

### Q9. How do you rollback a failed EKS deployment?

```bash
# Rollback to previous revision
kubectl rollout undo deployment/apiserver

# Or to a specific revision
kubectl rollout undo deployment/apiserver --to-revision=2

# Verify
kubectl rollout status deployment/apiserver
```

**Also, at the image level:** redeploy the previous ECR tag (git revert → pipeline redeploys). Both work; `rollout undo` is fastest for immediate recovery.

---

### Q10. How do you monitor an application after deployment?

**Layers of monitoring:**
| Layer | Tools | What you watch |
|---|---|---|
| **Cluster** | CloudWatch Container Insights, Prometheus | node CPU/mem, pod metrics, HPA |
| **Application** | Prometheus + Grafana, custom metrics | latency, error rate, request rate (RED: Rate/Errors/Duration) |
| **Logs** | CloudWatch Logs, ELK/Loki | app logs, errors, stack traces |
| **Health** | `/healthz`, probes, uptime checks | liveness/readiness |
| **Uptime** | CloudWatch alarms, PagerDuty | alerts |

**RED vs USE method:**
- **RED** (app): Rate, Errors, Duration
- **USE** (infra): Utilization, Saturation, Errors

**After deploy, check:** rollout status → pod readiness → error logs → metrics spike (5xx) → alarms. Also: synthetic/health checks from outside.

---

## SECTION B: Deployment Strategies

### Q11. How would you implement blue-green deployment?

**Concept:** run **two identical environments** (Blue = current, Green = new). Switch traffic all at once.

```
Blue  (v1) ──────┐
                 ├──► LoadBalancer / Router ──► users
Green (v2) ─────┘   (switch at once)
```

**Steps:**
1. Deploy Green with same config (new version) — no traffic to it
2. **Smoke test** Green directly (via service or port-forward)
3. **Switch the router/LB/service selector** from Blue to Green (all at once)
4. Keep Blue running for instant rollback (flip back)
5. After stable → tear down Blue

**K8s implementation:**
- Two Services (blue-svc, green-svc) pointing at different label sets, OR one service whose selector flips
- **Service selector flip:** update `selector.app=green` → traffic instantly to Green

**Pros:** instant rollback, zero downtime if LB handles cutover, easy validation
**Cons:** **double infrastructure cost**, traffic cutover is abrupt (brief risk if issue)

---

### Q12. How would you implement canary deployment?

**Concept:** roll out the new version to a **small % of traffic** first, monitor, then ramp up.

```
v1 (stable) ────── 90% ──► LoadBalancer
v2 (canary) ────── 10% ──► (gradually increase to 100%)
```

**K8s implementation (multiple ways):**
1. **Two Deployments** (stable + canary) sharing a Service selector → control replica ratio (e.g., 9 stable pods + 1 canary pod = 10%)
2. **Service mesh** (Istio/Linkerd) traffic shifting: `trafficPercentage: 10 → 50 → 100`
3. **Argo Rollouts** — progressive delivery with analysis steps
4. **NGINX ingress canary annotation** — `nginx.ingress.kubernetes.io/canary: "true"` + weight

**Process:**
1. Deploy canary (10%) → monitor error rate/latency (compare vs baseline)
2. If healthy → 50% → monitor → 100%
3. If anomaly → **immediately shift traffic back to 100% stable** (rollback)

**Pros:** real production traffic validation, low risk, fine-grained control
**Cons:** complex, requires metrics to compare, two versions running

---

### Q13. What is the difference between blue-green and canary?

| | **Blue-Green** | **Canary** |
|---|---|---|
| Switch | **all at once** | **gradual %** (10 → 100) |
| Risk | lower rollback risk, higher cutover risk | lowest risk — traffic-based |
| Infra | **double** (full parallel env) | one extra small env |
| Validation | pre-switch smoke test | real production traffic, measured |
| Rollback | flip LB back (instant) | shift % back (instant) |
| Use | reliable big changes | riskier changes, new features |

> **Interview line:** "Blue-green is great when you can afford parallel environments and want instant, all-at-once switching. Canary is for when you want to validate a change against real traffic before committing fully."

---

### Q14. How do you minimize production deployment risk?

**Before:**
- **Feature flags** — ship code dark, enable when ready
- **Automated tests + quality gates** (unit/integration/E2E, SonarQube, coverage)
- **Staging parity** — prod-like environment tested first
- **Immutable artifacts** — build once, same image through stages
- **Change management** — small, reviewable changes

**During:**
- **Canary / blue-green / rolling** — staged rollout
- **Automated health checks** after deploy (readiness probes, smoke tests)
- **Automated rollback triggers** on health failure
- **Monitoring alerts** in real time (RED metrics)

**After:**
- Post-deploy smoke tests + monitor error rates
- Retrospective if anything fails
- **Rollback plan always ready** (known-good image + command)

---

### Q15. How do you promote an image from staging to production?

**"Build once, promote the same artifact" principle:**

```
CI builds image once → tag: app:1.2.3 (git SHA)
   ├── deployed to staging → tested (smoke/E2E)
   └── SAME image promoted to prod (no rebuild!)
```

**Practices:**
- **Same image** — identical binary, only config/env differs
- **Config per env** — staging uses staging ConfigMap/Secret, prod uses prod's
- **Promotion gate** — manual approval or automated gate (tests pass + SonarQube green)
- **Tag promotion** — move the image tag reference: `app:staging-approved` → deploy to prod
- **Registry permissions** — prod role can only pull approved tags

**In practice:** `kubectl set image deployment/app app=ecr/.../app:1.2.3` in prod after staging validated.

---

### Q16. How would you handle a failed production deployment?

1. **Detect** — rollout status shows failure / alerts (5xx spike)
2. **Stop the bleeding** — **rollback immediately** (`kubectl rollout undo` or flip LB back to blue, or shift canary to 0%)
3. **Confirm rollback worked** — verify traffic healthy, users served from old version
4. **Triage root cause** — logs, metrics, release diff (config? code? DB migration?)
5. **Communicate** — incident status to team
6. **Fix properly** — fix the issue, re-run pipeline, deploy again (after staging validation)
7. **Post-incident review** — why wasn't it caught in staging? add a gate/probe

**Golden rules:** rollback first, investigate later. Never leave production broken while debugging.

---

### Q17. How does a CI/CD pipeline authenticate with EKS (kubectl)?

**Kubernetes RBAC + AWS IAM mapping:**
1. Pipeline assumes an IAM role (OIDC)
2. Role is mapped to a **Kubernetes RBAC group/user** in EKS via **aws-auth ConfigMap** (or EKS access entries)
3. The RBAC role has permissions to update Deployments in the namespace

```yaml
# aws-auth ConfigMap maps IAM role → K8s user/group
mapUsers:
- userarn: arn:aws:iam::123456789012:role/gha-eks-deploy
  username: gha-eks-deploy
  groups: ["eks-deploy-group"]
```

**In CI:**
```bash
aws eks update-kubeconfig --region ap-south-1 --name my-cluster
kubectl set image deployment/apiserver ... 
```
- `aws eks update-kubeconfig` generates a short-lived kubeconfig using the assumed role's creds

**Best practice:** **IRSA (IAM Roles for Service Accounts)** — pods in the cluster use IRSA; CI/CD uses OIDC role → RBAC mapping.

---

## SECTION C: AWS Quick Reference

| Service | What it is | Used for |
|---|---|---|
| **EKS** | managed Kubernetes control plane | running K8s workloads |
| **ECR** | Docker registry | storing container images |
| **EC2** | virtual machines | EKS worker nodes |
| **ALB/NLB** | load balancers | LoadBalancer Service backend |
| **IAM** | identity/access management | roles, policies, OIDC |
| **S3** | object storage | Terraform state, logs |
| **DynamoDB** | NoSQL DB | Terraform state locking |
| **CloudWatch** | monitoring/logs | cluster + app observability |
| **ACM** | certificates | TLS for HTTPS |
| **VPC** | network isolation | cluster networking, subnets |

---

*Next: [05-devsecops.md](05-devsecops.md) — DevSecOps.*
