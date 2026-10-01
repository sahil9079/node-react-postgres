# AWS Fundamentals - Level 2: Intermediate

## 1. Security Groups vs NACLs
* **Security Group (SG):** Stateful virtual firewall at the **Instance / ENI level**. Allows rules only (no deny rules). Return traffic is automatically allowed.
* **Network ACL (NACL):** Stateless virtual firewall at the **Subnet level**. Evaluates rules in numbered order; supports explicit Allow and Deny rules. Must allow outbound ephemeral ports (1024-65535).

## 2. AWS CLI Essential Commands
```bash
# S3 Bucket & Object Operations
aws s3 ls
aws s3 cp app.tar.gz s3://my-prod-artifacts/builds/
aws s3 sync ./dist s3://my-frontend-bucket --delete

# EC2 & EKS Inspection
aws ec2 describe-instances --filters "Name=instance-state-name,Values=running"
aws eks update-kubeconfig --region us-east-1 --name production-cluster
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
```
