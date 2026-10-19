# 15 — AWS Cost Optimization & Complete Cleanup Study Module (`15-AWS-COST-OPTIMIZATION-AND-CLEANUP.md`)

> **Full Operational Reference:** See [../AWS_COST_OPTIMIZATION_AND_CLEANUP.md](../AWS_COST_OPTIMIZATION_AND_CLEANUP.md) and [../../AWS_COST_OPTIMIZATION_AND_CLEANUP.md](../../AWS_COST_OPTIMIZATION_AND_CLEANUP.md)

---

## 1. Simple Hinglish Summary for Interviews

Cloud interviews mein ek bahut common सवाल hota hai: *"How do you control AWS costs in non-production and production environments?"*
Is project mein humne **5 concrete FinOps controls** lagaye hain:
1. **Local-First Workflow (`$0/month`)**: Docker Compose (`postgres`, `apiserver`, `client`, `prometheus`, `grafana`) aur `kubectl kustomize` validation local par chalte hain.
2. **Right-Sized Lab Topology (`infra/envs/lab/main.tf`)**:
   - Single NAT Gateway (`single_nat_gateway = true`) saves `~$43/month` in lab.
   - Single-AZ `db.t4g.micro` RDS (`multi_az = false`, `skip_final_snapshot = true`) saves `~$15+/month` and prevents post-destroy snapshot charges.
3. **Single Shared ALB via Ingress (`k8s/ingress.yaml`)**: Using `ClusterIP` Services behind 1 ALB (`skills-platform-alb`) instead of separate `type: LoadBalancer` Services saves `~$18.40/month` per avoided load balancer plus public IPv4 fees.
4. **ECR Lifecycle Policy (`infra/modules/ecr/main.tf`)**: Automatically expires old images beyond the latest `15` immutable builds so ECR storage never grows unbounded.
5. **Dependency-Ordered Teardown & 11-Point Post-Destroy Verification (`scripts/post-destroy-check.sh`)**: Guarantees no orphaned ALB, NAT Gateway, Elastic IP, EBS Volume, or RDS Snapshot continues billing after lab teardown.

---

## 2. Interview Question & Sample Answer

- **Q**: *Why does `terraform destroy` sometimes fail or leave behind billable resources when tearing down an EKS cluster, and how did you solve it?*
  - **Honest Answer**: "When the AWS Load Balancer Controller runs inside EKS, it provisions an Application Load Balancer and attaches Elastic Network Interfaces (ENIs) and Security Groups to the VPC's public subnets outside of Terraform's state file. If we run `terraform destroy` first, Terraform destroys the EKS node group—killing the controller before it can delete the ALB—and then `terraform destroy` hangs with a `DependencyViolation` on the VPC and subnets, leaving the ALB and NAT Gateway billing hourly. In our teardown runbook, we always delete the Kubernetes `Ingress` (`kubectl delete ingress skills-platform-ingress -n node-react-app`) first, verify via `aws elbv2 describe-load-balancers` that the ALB is gone, empty ECR images, run `terraform destroy`, and finally run `scripts/post-destroy-check.sh` to audit 11 resource types across `ap-south-1`."
