# AWS Cost Optimization, Safe Shutdown & Complete Cleanup (`docs/AWS_COST_OPTIMIZATION_AND_CLEANUP.md`)

> **Phase 15 — Mandatory FinOps, Idle Billing Analysis, Temporary Shutdown & Dependency-Ordered Teardown**  
> **Target AWS Region:** `ap-south-1` (Mumbai)  
> **Root Companion Guide:** [../AWS_COST_OPTIMIZATION_AND_CLEANUP.md](../AWS_COST_OPTIMIZATION_AND_CLEANUP.md)

---

## 1. Expected AWS Resources & Hourly / Monthly Cost Drivers (`ap-south-1`)

Kisi bhi AWS deployment (`terraform apply`) se pehle yeh samajhna zaroori hai ki kaunsa resource **idle rehne par bhi bill generate karta hai**:

| AWS Service / Resource | Lab Spec (`infra/envs/lab`) | Approx. Hourly Cost | Approx. Monthly Cost (24×7) | Bills While Idle (Zero Traffic)? | Free-Tier Eligibility Note |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Amazon EKS Control Plane** | 1 Cluster (`skills-lab-eks`) | `\$0.10 / hr` | `~\$73.00 / mo` | **YES** (Charges from creation until deletion) | **Not in AWS Free Tier** |
| **EKS Managed Node Group (EC2)** | 2× `t3.medium` On-Demand | `~\$0.0896 / hr` | `~\$65.40 / mo` | **YES** (Unless scaled to `0` nodes) | `t3.medium` is not Free Tier (`t2.micro`/`t3.micro` has too few ENI IPs for EKS) |
| **NAT Gateway** | 1 NAT GW (`single_nat_gateway = true`) | `~\$0.059 / hr` | `~\$43.00 / mo` + data | **YES** (Hourly charge even with 0 bytes transferred) | **Not in AWS Free Tier** |
| **Application Load Balancer (ALB)** | 1 ALB (`skills-platform-alb`) | `~\$0.0252 / hr` + LCU | `~\$18.40 / mo` | **YES** (Provisioned via `k8s/ingress.yaml`) | 750 hrs/mo in 12-month Free Tier for new accounts |
| **Public IPv4 Addresses** | 1 NAT EIP + 2 Public ALB IPs | `\$0.005 / IP / hr` | `~\$10.95 / mo` (3 IPs) | **YES** (AWS charges `\$0.005/hr` for all public IPv4s since Feb 2024) | **Not in AWS Free Tier** |
| **Amazon RDS PostgreSQL 15** | 1× `db.t4g.micro` (`20 GB gp3`, Single-AZ) | `~\$0.018 / hr` + storage | `~\$15.50 / mo` | **YES** (Storage `~\$2.30/mo` bills even when RDS is stopped) | 750 hrs/mo for 12-month new AWS accounts |
| **EBS Volumes (`gp3`)** | 2× `20 GB` Node Root Volumes | Included in month | `~\$3.80 / mo` | **YES** (Persist if volumes are not deleted with instances) | 30 GB in 12-month Free Tier |
| **AWS Secrets Manager & CloudWatch** | 1 Secret + Log Groups | Usage/monthly | `~\$0.40/secret` + `\$0.50/GB` | **YES** | Minimal cost if retention is set to 7 days |
| **Total Estimated Lab Cost** | **Full EKS + RDS + ALB Lab** | **~\$0.29 / hour** | **~\$230 / month (24×7)** | **4-Hour Practice Session = ~\$1.16** | Always teardown after practice! |

### Cheaper Architectural Alternatives (Interview Trade-Offs)
1. **Local Docker Compose (`\$0.00/month`)**: Use `docker compose up --build -d` for 95% of daily coding, NGINX routing, Prometheus scraping, and Grafana dashboard labs.
2. **AWS ECS Fargate + ALB + Public Subnets (`~\$25/month`)**: Eliminates the `\$73/mo` EKS control plane fee and the `\$43/mo` NAT Gateway fee while still running containers on AWS.
3. **Single EC2 (`t3.small`) Running K3s or Docker Compose (`~\$15/month`)**: Good for ultra-low-budget demos, though lacks managed control-plane HA.

---

## 2. AWS Budgets & Billing Alarm Pre-Flight Setup

Before running `terraform apply`, configure a **\$5.00 Monthly AWS Budget Alert**:
```bash
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget '{
    "BudgetName": "Skills-DevOps-Lab-5USD-Cap",
    "BudgetLimit": { "Amount": "5.0", "Unit": "USD" },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }' \
  --notifications-with-subscribers '[
    {
      "Notification": {
        "NotificationType": "ACTUAL",
        "ComparisonOperator": "GREATER_THAN",
        "Threshold": 80.0,
        "ThresholdType": "PERCENTAGE"
      },
      "Subscribers": [{ "SubscriptionType": "EMAIL", "Address": "YOUR_EMAIL@example.com" }]
    }
  ]'
```

---

## 3. Procedure A — Temporary Shutdown (Pause Compute Overnight)

Agar aap agle din lab resume karna chahte hain aur poora cluster destroy nahi karna chahte:

```bash
# 1. Scale Kubernetes Deployments to 0 replicas
kubectl scale deployment apiserver my-app-deployment --replicas=0 -n node-react-app

# 2. Scale EKS Managed Node Group to 0 EC2 instances (stops EC2 compute billing)
aws eks update-nodegroup-config \
  --region ap-south-1 \
  --cluster-name skills-lab-eks \
  --nodegroup-name skills-lab-eks-node-group \
  --scaling-config minSize=0,maxSize=3,desiredSize=0

# 3. Stop the RDS PostgreSQL instance (stops compute billing for up to 7 days)
aws rds stop-db-instance \
  --region ap-south-1 \
  --db-instance-identifier skills-lab-postgres
```

> [!WARNING]
> **Resources That Continue Billing During Temporary Shutdown:**
> Even after stopping EC2 nodes and RDS compute, the **EKS Control Plane (`\$0.10/hr`)**, **NAT Gateway (`\$0.059/hr`)**, **ALB (`\$0.025/hr`)**, **Public IPv4 addresses (`\$0.005/hr/IP`)**, and **RDS gp3 storage (`20 GB`)** **CONTINUE TO INCUR CHARGES (`~\$4.50/day`)**. Do not leave the cluster paused for days—use **Procedure B (Complete Teardown)** instead!

---

## 4. Procedure B — Complete Dependency-Ordered Teardown

> [!CAUTION]
> **Critical Teardown Order Rule:** Never run `terraform destroy` while `k8s/ingress.yaml` or Kubernetes `LoadBalancer` Services still exist! If Terraform tries to delete the VPC before the AWS Load Balancer Controller deletes the ALB and its Target Group ENIs, `terraform destroy` will hang for 45+ minutes with `DependencyViolation: The vpc has mapped public address(es) / network interfaces`.

```bash
# STEP 1: Delete Kubernetes Ingress & Services FIRST so AWS Load Balancer Controller removes the ALB
kubectl delete ingress skills-platform-ingress -n node-react-app --ignore-not-found=true
kubectl delete ns node-react-app --ignore-not-found=true

# STEP 2: Wait 90 seconds and verify the ALB is completely gone
aws elbv2 describe-load-balancers --region ap-south-1 \
  --query "LoadBalancers[].[LoadBalancerName,State.Code]" --output table

# STEP 3: Empty ECR repositories (or allow Terraform to remove them after deleting images)
for repo in skills-apiserver skills-client; do
  IMAGES=$(aws ecr list-images --region ap-south-1 --repository-name $repo --query 'imageIds[*]' --output json)
  if [ "$IMAGES" != "[]" ]; then
    aws ecr batch-delete-image --region ap-south-1 --repository-name $repo --image-ids "$IMAGES"
  fi
done

# STEP 4: Run Terraform Destroy for the Lab Environment
terraform -chdir=infra/envs/lab destroy
```

---

## 5. Procedure C — Post-Cleanup Verification (`scripts/post-destroy-check.sh`)

Teardown ke baad niche diya gaya script run karein taaki koi orphan resource (`NAT Gateway`, `EIP`, `ALB`, `EBS Volume`, `RDS Snapshot`, `Log Group`) bacha na rahe:

```bash
bash scripts/post-destroy-check.sh ap-south-1
```

- **Why Billing Data Takes 8–24 Hours to Update**: AWS Cost Explorer aur Billing Dashboard mein usage records near-real-time nahi hote; resource delete hone ke baad bhi pichle ghanton ka usage agle 8–24 hours tak reflect ho sakta hai. Zero future charges tabhi confirm maanein jab `scripts/post-destroy-check.sh` ke saare checks empty (`[]`) return karein.
