# 08 — Terraform and AWS in Simple Words

Folder: `infra/`

## 1. What Terraform is

Terraform is **infrastructure as code**.

Instead of clicking in the AWS console:

1. You write what you want in `.tf` files.
2. `terraform plan` shows what will change.
3. `terraform apply` creates it.
4. `terraform destroy` removes it.

This means the infrastructure is reviewable, repeatable and recoverable.

## 2. The three important words

| Word | Simple meaning |
| :--- | :--- |
| **Provider** | The plugin that talks to AWS (`hashicorp/aws`) |
| **Module** | A reusable group of resources |
| **State** | Terraform's memory of what it created |

**State is critical.** It maps your code to real AWS resource IDs. If state is lost, Terraform does not know what exists.

That is why state goes in **S3**:
- shared by the team,
- encrypted,
- versioned,
- locked so two people cannot apply at once.

## 3. The folders

```
infra/
├── bootstrap/        create the S3 state bucket (run once)
├── modules/
│   ├── network/      VPC, subnets, NAT, route tables, firewalls
│   ├── ecr/          Docker image repositories
│   ├── eks/          Kubernetes cluster + nodes
│   ├── rds/          PostgreSQL + secret
│   └── iam/          GitHub OIDC role + workload role
└── envs/lab/         connects the modules for one environment
```

**Rule:** modules are generic. Environments are specific. Do not edit a module just for one environment; pass variables.

## 4. The network (the most important diagram)

```
VPC 10.0.0.0/16
│
├── Public subnets (internet-facing)
│     10.0.1.0/24  ap-south-1a   ALB, NAT Gateway
│     10.0.2.0/24  ap-south-1b
│
├── Private app subnets (no direct internet in)
│     10.0.11.0/24 ap-south-1a   EKS nodes and Pods
│     10.0.12.0/24 ap-south-1b
│
└── Private DB subnets
      10.0.21.0/24 ap-south-1a   RDS PostgreSQL
      10.0.22.0/24 ap-south-1b
```

Why three tiers?

- **Public** = only the load balancer.
- **Private app** = your app servers, hidden from the internet.
- **Private DB** = the database, reachable only from the app.

## 5. The network pieces

| Piece | Simple meaning |
| :--- | :--- |
| **Internet Gateway** | Door from the VPC to the internet |
| **NAT Gateway** | Lets private subnets make outbound calls (e.g. pull images) but blocks inbound |
| **Route table** | "Send this traffic to that gateway" |
| **Security group** | A firewall attached to resources |

The firewall chain is:

```
Internet -> ALB (80/443) -> EKS workloads (80/8010) -> RDS (5432)
```

The database security group accepts traffic **only** from the EKS workloads security group. No public CIDR. That is correct.

**Cost note:** the lab uses one NAT Gateway to save money. If that AZ fails, outbound traffic from the other AZ stops. Production should use one NAT per AZ.

## 6. EKS module

EKS has two parts:

| Part | Managed by | What it is |
| :--- | :--- | :--- |
| **Control plane** | AWS | API server, scheduler, etcd |
| **Node group** | You (Terraform) | EC2 machines where Pods run |

The module creates:

- cluster IAM role,
- node IAM role + three required policies,
- EKS cluster (version 1.31),
- managed node group (t3.medium, 1-3 nodes).

Log types enabled: `api`, `audit`, `authenticator`. Audit logs are important for security.

## 7. RDS module

```hcl
resource "aws_db_instance" "postgres" {
  engine                 = "postgres"
  engine_version         = "15"
  instance_class         = "db.t4g.micro"
  storage_encrypted      = true
  publicly_accessible    = false
  backup_retention_period = 7
  multi_az               = false   # lab
}
```

| Setting | Lab | Production |
| :--- | :--- | :--- |
| `publicly_accessible` | false | false |
| `multi_az` | false | **true** |
| `deletion_protection` | false | **true** |
| `skip_final_snapshot` | true | **false** |

The module also creates a Secrets Manager entry with database and JWT values. In a real setup, replace the placeholder JWT values immediately.

## 8. ECR module

ECR stores Docker images.

- `IMMUTABLE` tags: you cannot overwrite `v1.1.0`. You must push a new tag.
- `scan_on_push`: AWS scans images for known vulnerabilities.
- Lifecycle rule: keep only the last 15 images to control cost.

## 9. IAM and OIDC (why there are no AWS keys)

Old way:

```
GitHub secret: AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY
```

Problems: long-lived, easy to leak, hard to rotate.

New way (this repo):

```
GitHub Actions -> asks GitHub for a short-lived OIDC token
               -> AWS STS verifies the token
               -> returns temporary credentials
```

The IAM role trusts only:

```
repo:sahil9079/node-react-postgres:ref:refs/heads/main
```

So another repository cannot use it.

**Important gap:** IAM lets the role push to ECR and describe EKS, but `kubectl` permissions come from Kubernetes (EKS access entry / `aws-auth`), not IAM. If `kubectl` says `Unauthorized`, that mapping is missing.

## 10. Commands

```bash
# state bucket (once)
cd infra/bootstrap
terraform init
terraform apply -var="state_bucket_name=skills-tfstate-<unique>"

# lab
cd ../envs/lab
terraform init
terraform fmt -check
terraform validate
terraform plan -out=tfplan
terraform apply tfplan

# outputs
terraform output

# destroy
terraform destroy
```

Always read the plan. Look for `-/+` (replace). Replacing RDS can destroy data.

## 11. Cost (rough, ap-south-1)

| Resource | Monthly |
| :--- | :--- |
| EKS control plane | ~$73 |
| 2 × t3.medium nodes | ~$60 |
| NAT Gateway | ~$32 |
| RDS db.t4g.micro | ~$13 |
| ALB | ~$18 |
| Storage/data | extra |

**Total: roughly $150-200/month if left running.**

Destroy the lab when you finish. Use `scripts/post-destroy-check.sh` to find leftovers.

## 12. Terraform checklist

- [ ] I can explain provider, module, state.
- [ ] I can draw the VPC.
- [ ] I can explain why RDS is private.
- [ ] I can explain OIDC vs access keys.
- [ ] I know the cost and how to destroy.
