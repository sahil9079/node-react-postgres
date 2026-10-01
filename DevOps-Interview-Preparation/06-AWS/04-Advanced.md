# AWS Fundamentals - Level 3: Advanced

## 1. Production IAM Architecture: IRSA & Least Privilege
* **IAM Roles for Service Accounts (IRSA):** Allows Kubernetes Pods to assume fine-grained IAM roles directly via OIDC federation, eliminating the need to attach broad AWS permissions to the underlying EC2 Worker Node instance profile.
* **How IRSA Works Internally:**
  1. EKS hosts an OIDC Discovery Endpoint.
  2. K8s injects a projected service account token into the Pod.
  3. The AWS SDK in the container exchanges this token with AWS STS (`sts:AssumeRoleWithWebIdentity`) to receive temporary AWS credentials.
