# Terraform Troubleshooting Matrix

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| **State Lock Failed** | Previous process died or lock stuck in DynamoDB | Run `terraform force-unlock <LOCK_ID>` after verifying no active runs |
| **Resource Already Exists** | Resource created manually in AWS console | Use `terraform import <resource_type>.<name> <id>` |
| **State Drift** | Manual modification made outside Terraform | Run `terraform plan` to inspect drift, then `apply` to reconcile |
