# Level 4: Enterprise Cloud Security — IAM Least Privilege & IRSA

> **Experience Target:** 4-Year Senior DevOps & Platform Architect  
> **Topic Scope:** IAM Roles for Service Accounts (IRSA), EKS Pod Identity, OIDC identity providers for GitHub Actions, and KMS envelope encryption.

---

## 1. IAM Roles for Service Accounts (IRSA)

### Why Static AWS Keys in Kubernetes are an Anti-Pattern:
* Hardcoding `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in Kubernetes Secrets or environment variables risks credential leaks, requires manual rotation, and violates least-privilege principles.

### How IRSA Works:
1. **OIDC Provider:** You create an OpenID Connect (OIDC) identity provider for your EKS cluster in AWS IAM.
2. **Kubernetes ServiceAccount:** You annotate a Kubernetes ServiceAccount with the IAM Role ARN:
   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: apiserver-sa
     namespace: node-react-app
     annotations:
       eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/SkillsAppS3UploaderRole
   ```
3. **IAM Trust Policy:** The AWS IAM Role trusts the cluster's OIDC issuer and restricts assumption strictly to the `apiserver-sa` in namespace `node-react-app`:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Federated": "arn:aws:iam::123456789012:oidc-provider/oidc.eks.ap-south-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E"
         },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": {
           "StringEquals": {
             "oidc.eks.ap-south-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E:sub": "system:serviceaccount:node-react-app:apiserver-sa"
           }
         }
       }
     ]
   }
   ```
4. **Token Injection:** The EKS Pod Identity webhook automatically injects an ephemeral JWT token into `/var/run/secrets/eks.amazonaws.com/serviceaccount/token`. The AWS SDK uses this token to obtain temporary STS credentials dynamically.

---

## 2. GitHub Actions OIDC Authentication to AWS (Zero Long-Lived Keys)

* Instead of storing AWS access keys in GitHub Secrets, GitHub Actions uses OpenID Connect (OIDC) to assume an AWS IAM role dynamically during pipeline runs:
```yaml
permissions:
  id-token: write
  contents: read

steps:
  - name: Configure AWS Credentials
    uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsDeploymentRole
      aws-region: ap-south-1
```
