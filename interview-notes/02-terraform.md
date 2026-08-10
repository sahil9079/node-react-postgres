# 02. Terraform / Infrastructure as Code — Detailed Notes

> Answer framework: **What → Why → How**. Terraform interviews test *understanding of state* more than syntax — master the state story.

---

## SECTION A: Fundamentals

### Q1. What is a Terraform module and why do you use it?

**Definition:** A module is a **reusable, self-contained collection of Terraform config** (.tf files) that provisions a logical unit of infrastructure (e.g., VPC module, EKS module, RDS module) with **input variables** and **outputs**.

**Why use modules:**
- **DRY** — write once, use everywhere (don't copy-paste 50 lines of VPC config)
- **Standardization** — teams use the same approved module → consistent, compliant infra
- **Versioning** — modules versioned (`aws-vpc v2.1.0`); upgrade = controlled
- **Encapsulation** — hide complexity behind a simple interface (callers pass 5 vars, not 500 lines)
- **Testing** — test the module once, trust it everywhere

**Structure:**
```
modules/
  vpc/
    main.tf
    variables.tf
    outputs.tf
  ec2/
    main.tf ...
main.tf
```
**Root module** = your top-level config. **Child modules** = `module "vpc" { source = "./modules/vpc" }`.

**Sources:** local path, registry (Terraform Registry, GitHub, S3/GCS bucket).

---

### Q2. How do you structure Terraform modules at scale?

**Layered / composition pattern:**
```
env/                        # environments (thin layers)
  dev/main.tf  backend.tf   #  → module "vpc" (dev vars)
  staging/...
  prod/...
modules/                    # building blocks (reusable)
  vpc/
  ec2/ or eks/
  rds/
  networking/
  iam/
  security-groups/
  ...
```

**Rules for scale:**
- **One module = one responsibility** (VPC module doesn't also create RDS)
- **Limit blast radius** — separate state per component/env (see Q3)
- **Explicit inputs/outputs** — modules communicate via outputs
- **Version pins** — lock module versions
- **Naming convention** — `aws-<service>-<role>` tags for all resources
- **Don't make mega-modules** — hard to review, slow applies, tangled dependencies

---

### Q3. How do you organize Terraform for dev, staging, and production?

**Two standard approaches:**

**A) Workspaces** (single config, multiple state):
```
terraform workspace new dev
terraform workspace new prod
terraform apply          # uses active workspace's state
```
- Pros: simple, one config. Cons: **shared config**, risk of accidentally applying to wrong env.

**B) Separate state per environment** (recommended at scale):
```
terraform/
  envs/
    dev/      backend.tf (s3: key=dev.tfstate)
    staging/  backend.tf (s3: key=staging.tfstate)
    prod/     backend.tf (s3: key=prod.tfstate)
```
- Pros: **isolation**, prod can't be touched from dev dir, separate permissions, separate CI
- Cons: duplication of env config (use shared modules to reduce)

**Best practice:** **separate state per env + shared modules**. Each env has its own `backend.tf` (different S3 key) and `tfvars` file, all referencing the same `modules/`.

> **Interview line:** "I use one set of reusable modules, and each environment has its own state file in S3 with its own lock and its own IAM permissions. That isolates prod from dev mistakes."

---

### Q4. How do you manage Terraform remote state?

**Remote state = state stored on a shared backend, not your laptop.**

| Backend | Best for |
|---|---|
| **S3** (AWS) | standard choice — S3 + DynamoDB locking |
| **GCS** (GCP) | Google Cloud |
| **AzureRM** (Azure) | Azure Blob + lock |
| **Terraform Cloud/Enterprise** | managed, RBAC, policy-as-code (Sentinel) |
| Consul/HashiCorp Vault | advanced/legacy |

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "my-tfstate-bucket"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}
```

**Important:** `backend` block is configured at `init` time — changing it requires re-`init` (with `-migrate-state` to move state).

---

### Q5. Why should Terraform state NOT be stored locally?

**State contains secrets & is critical:**
1. **Sensitive data** — state stores resource IDs, and may store secrets (password hashes, keys) in plaintext
2. **Team collaboration** — local state = each dev sees different world; conflicts
3. **CI/CD** — pipelines can't access your laptop's state
4. **Loss/disaster** — laptop dies → state gone → cannot manage infra
5. **Locking** — local has no locking → concurrent applies corrupt state
6. **Auditability** — remote state enables versioning (S3 versioning) and history

**So:** always remote + encrypted + versioned + locked.

---

### Q6. How would you configure an S3 backend for Terraform?

```hcl
terraform {
  backend "s3" {
    bucket         = "company-terraform-state"
    key            = "prod/infra/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
```

**Prerequisites (the S3 bucket must be created manually / out-of-band first):**
```bash
# enable versioning on bucket (state recovery)
aws s3api put-bucket-versioning --bucket company-terraform-state \
  --versioning-configuration Status=Enabled

# create DynamoDB lock table
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

**Why versioning?** Recovers from accidental deletion/corruption of state.
**Why DynamoDB?** Provides the lock (prevents concurrent applies).

---

### Q7. How does Terraform state locking work?

- When you run `apply` (or `plan` in some backends), Terraform **acquires a lock**
- **S3 backend** uses a **DynamoDB table**: Terraform writes a lock item `LockID = state-key` to the table
- If another process tries to apply the same state → the lock item already exists → **second apply is blocked** with `Error: Error acquiring the state lock`
- On completion → lock released (item deleted)

```
Engineer A: terraform apply  → DynamoDB lock acquired → applies → lock released
Engineer B: terraform apply  → LOCKED → "Error acquiring the state lock" → blocked
```

**Why it matters:** two concurrent applies to the same state = **corrupt state + conflicting infra**.

---

### Q8. How do you prevent concurrent Terraform applies?

1. **State locking** (DynamoDB for S3 backend) — the primary defense (see Q7)
2. **CI/CD as single entry point** — engineers don't run `apply` directly; pipeline does
3. **Separate state per environment/component** — reduces contention
4. **Permissions** — only CI/specific roles can write state
5. **Lock timeout / forced unlock** — `terraform force-unlock <lock-id>` for stale locks (use carefully)

**If you DO hit a lock conflict:** find who's running it (`aws dynamodb get-item`), coordinate, wait; only `force-unlock` if the lock is stale (no active apply).

---

### Q9. What is Terraform state drift?

**Definition:** when the **real infrastructure** differs from what Terraform's **state** (and config) says it should be.

**Examples of drift:**
- Someone manually deleted an EC2 instance / scaled a cluster in the console
- Someone changed a resource attribute outside Terraform (e.g., manually changed a security group)
- AWS auto-modified things (e.g., AMI replaced, autoscaling)

**Why it matters:** Terraform `plan` shows drift as changes. If you `apply`, Terraform will **revert manual changes** back to config — which is usually correct but can surprise.

---

### Q10. How do you detect Terraform drift?

- **`terraform plan`** — compare real state vs config; any diff = drift. Run periodically (nightly CI job) and in every pipeline
- **`terraform refresh`** — update state with real-world values (doesn't change infra, just state)
- **`terraform show`** / `terraform state list` — inspect current state
- **Drift detection tools:** Terraform Cloud's "drift detection", `tfenv`, third-party (Infracost has drift, Atlantis)
- **Audit logs** — AWS CloudTrail / resource changes outside TF

**CI pattern:** nightly job runs `terraform plan -detailed-exitcode` → non-zero exit code (2) = changes found → alert.

---

### Q11. How do you resolve Terraform drift?

**The workflow:**
1. **Detect** (plan/refresh)
2. **Analyze** — what changed and why? (was it manual? an outage workaround?)
3. **Decide:**
   - **Adopt the change** → update config to match reality (if the manual change was desired) → `apply`
   - **Revert the change** → update infra to match config → `apply`
4. **Apply** — Terraform reconciles state to config
5. **Prevent recurrence** — restrict manual console access, use Terraform Cloud/Atlantis, alerts on drift

> **Interview line:** "Terraform is the source of truth. Drift happens when reality and code diverge. I detect with plan/refresh, decide whether to codify the change or revert it, then apply to reconcile."

---

### Q12. How do you prevent unsafe infrastructure changes?

**Layered prevention:**
1. **Plan review** — every change goes through `terraform plan` + **human review** (Atlantis/CI PR pattern, "plan in PR")
2. **Permissions** — least privilege: devs can plan, only approved roles/CI apply to prod
3. **State locking** — no concurrent applies
4. **Policy as code** — **Sentinel / OPA (Open Policy Agent) / AWS Config** — forbid e.g., public S3 buckets, deletion of production resources
5. **Separation of prod** — prod has its own state, its own CI job, **manual approval** gate
6. **Backups & versioning** — state versioned (S3) → recovery
7. **`-target` / `-destroy` guards** — avoid unintended blast radius
8. **Change management** — change tickets + audit trail
9. **Plan previews** in CI (e.g., `terraform plan` in PR comments) so review is easy

---

### Q13. How do you manage Terraform state across multiple teams?

**Pattern: state per team/component + a shared bucket structure.**

```
s3://company-tfstate/
  team-platform/prod/terraform.tfstate
  team-platform/dev/terraform.tfstate
  team-data/prod/terraform.tfstate
  ...
```
- **Separate state files** per team/env/component (independent apply, no conflicts)
- **IAM restrictions** — team A can only read/write its own keys
- **Shared modules** in a central repo (versioned) → teams reuse, not reinvent
- **Ownership:** team owns its state; central platform owns the shared bucket + module registry
- **Naming & tagging standards** across teams

---

### Q14. How do you version Terraform modules?

**Three source types:**

1. **Git tags (common):**
   ```hcl
   module "vpc" {
     source = "git::https://github.com/org/terraform-aws-vpc.git?ref=v2.1.0"
   }
   ```

2. **Terraform Registry:**
   ```hcl
   module "vpc" { source = "terraform-aws-modules/vpc/aws" }  # resolves latest
   # pin: source = "terraform-aws-modules/vpc/aws@4.0.1"
   ```

3. **Private registry / S3 / GCS buckets:** versioned artifact storage

**Versioning practices:**
- **SemVer** — MAJOR (breaking), MINOR (feature), PATCH (bugfix)
- **Pin versions** in production (never float `latest`)
- **Changelog** per module version
- **Test before promote** — test module version in staging before prod
- **Dependency lock** — `terraform.lock.hcl` for provider versions

---

### Q15. How do you manage secrets in Terraform?

**NEVER store secrets in plaintext in `.tf` files or state.**

| Approach | Tool |
|---|---|
| **Reference secrets** instead of storing | `data "aws_secretsmanager_secret_version"` |
| Vault integration | `vault` provider / env vars |
| **Variables** + CI secrets | `TF_VAR_db_password` set in CI secrets |
| **`sensitive = true`** on variables | marks output sensitive (still in state) |
| **State protection** | encrypt state (S3 SSE-KMS), restrict access |

```hcl
# GOOD: reference, don't embed
variable "db_password" { type = string; sensitive = true }
resource "aws_db_instance" "db" {
  password = var.db_password   # passed at runtime, not in repo
}
```

**Reminder:** even "secrets" in state are stored in **plaintext inside the state file** → that's WHY you encrypt the state bucket + restrict access + enable versioning (with access control).

---

### Q16. How do you review Terraform changes before applying them?

**The review workflow (Plan-in-PR / Atlantis):**
1. Dev writes `.tf` code → opens PR
2. CI automatically runs `terraform plan` (or `terraform init && terraform plan`)
3. Plan output is **posted to the PR** (Atlantis comment, GitHub Actions comment, or `terraform plan` artifact)
4. **Human reviews** the diff + plan → approves
5. **On merge/approval** → `terraform apply` runs in CI (or Atlantis apply)
6. **State updates, no manual apply allowed**

**What reviewers check:** plan touches only intended resources, no destructive changes, IAM least-privilege, security groups tight, no hardcoded secrets, correct env state.

---

### Q17. How would you run Terraform through CI/CD?

**GitHub Actions example (the pattern):**

```yaml
jobs:
  terraform:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: terraform/envs/prod
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - name: Terraform init
        run: terraform init            # pulls modules + configures S3 backend
      - name: Terraform plan
        run: terraform plan -out=tfplan
      - name: Terraform apply          # gated by env (manual approval for prod)
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        run: terraform apply tfplan
```

**Key points:**
- **Auth:** CI assumes an IAM role (OIDC) with the right permissions
- **Backend config** via `backend.tf` or `-backend-config` files per env
- **Plan/apply split** — plan in PR, apply on merge (or via approval)
- **Outputs to secrets/monitoring** as needed
- **Tag/version infrastructure code** — same GitOps discipline as app code

---

### Q18. What happens if two engineers run terraform apply at the same time?

- **With locking (recommended):** first acquires lock (DynamoDB), second gets **"Error acquiring the state lock"** → blocked until first finishes
- **Without locking (local state):** both read state, both apply → **state corruption**, conflicting resources, one overwrites the other — **disaster**

> **Answer:** "The lock prevents it. With an S3 + DynamoDB backend, the second engineer's apply is rejected with a lock error, so they wait for the first to finish. That's why remote state with locking is non-negotiable."

---

### Q19. What is the difference between Terraform workspaces and separate state files?

| Aspect | Workspaces | Separate state files |
|---|---|---|
| Config | **one** config, N states | **separate** config dirs, separate states |
| Isolation | logical — same code, switch state | physical — isolated code + state |
| Risk | easy to apply to wrong workspace | near impossible to touch wrong env |
| Permissions | same for all workspaces | per-state IAM (prod locked down) |
| When to use | same infrastructure, small projects, feature branches | different envs, prod isolation, teams |

**Rule of thumb:** use **workspaces for "same infra, different instance"** (dev1, dev2); use **separate state for environments** (dev/staging/prod) because prod needs different config + strict permissions.

---

### Q20. How do you protect production Terraform infrastructure?

1. **Separate state + backend** for prod (own S3 key, own DynamoDB lock)
2. **Separate IAM roles** — prod role only accessible to CI/approved users; **least privilege** (no prod perms for devs)
3. **Manual approval gate** in CI before prod apply
4. **Plan review** mandatory (Atlantis/plan-in-PR)
5. **Policy as code** (Sentinel/OPA) — block destructive/insecure changes
6. **State encryption** (S3 SSE-KMS) + versioning + access logging
7. **No force-unlock by default** — escalated process
8. **Audit logs** (CloudTrail + Terraform runs log)
9. **Locked variables** (Terraform Cloud) / strict tfvars
10. **Prevent destroy** — `prevent_destroy = true` lifecycle on prod resources

```hcl
resource "aws_s3_bucket" "prod_data" {
  lifecycle { prevent_destroy = true }
}
```

---

## SECTION C: Terraform Scenario Quick-Reference

| Scenario | Answer |
|---|---|
| Two people `apply` same time | DynamoDB lock blocks second — wait or investigate stale lock |
| State deleted | Restore from S3 versioning (if enabled) — this is why versioning matters |
| Drift detected in nightly plan | Review, decide codify-vs-revert, apply, alert owner |
| Secret in state | It's plaintext in state → encrypt bucket, restrict access, rotate secret, `sensitive=true` going forward |
| Module version update | SemVer, test in staging, pin in prod, changelog |
| CI plan vs apply | Plan in PR for review; apply on merge/approval with correct IAM role |
| Dev changed console manually | Drift → plan shows it → either codify the change or revert |

---

*Next: [03-kubernetes.md](03-kubernetes.md) — the biggest section: Kubernetes.*
