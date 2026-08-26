# Level 2: Terraform State Management, State Locking & Drift

> **Experience Target:** 2-Year Mid-Level DevOps Engineer  
> **Topic Scope:** Remote state architectures, S3 + DynamoDB locking mechanics, concurrency conflict resolution, drift detection (`-detailed-exitcode`), and workspace management.

---

## 1. Remote State Backend Architecture

```
[Developer / CI-CD]
        │
        ├── 1. Acquire Lock ──────────────────► [AWS DynamoDB Table] (LockID)
        │                                              │ (If locked: rejects concurrent apply)
        ├── 2. Read / Write State (Encrypted) ─► [AWS S3 Bucket] (KMS + Versioning)
        │
        └── 3. Release Lock ──────────────────► [AWS DynamoDB Table] (Delete LockID)
```

### Production Backend Configuration
```hcl
terraform {
  required_version = ">= 1.5.0"
  backend "s3" {
    bucket         = "prod-terraform-state-company"
    key            = "skills-app/eks/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true                    # S3 Server-Side Encryption (AWS KMS)
    dynamodb_table = "terraform-state-locks" # Concurrency locking mechanism
  }
}
```

---

## 2. State Locking Mechanics & Concurrency

### Q1. What happens if two engineers or pipelines run `terraform apply` simultaneously?
* **With S3 + DynamoDB Locking (Production):**
  1. Process A writes an item to DynamoDB with primary key `LockID = skills-app/eks/terraform.tfstate`.
  2. Process B attempts to write the same `LockID`, receives an error from DynamoDB, and halts with:
     ```
     Error: Error acquiring the state lock
     Lock Info:
       ID:        3b9a1c2d-4e5f-6a7b-8c9d-0e1f2a3b4c5d
       Path:      prod-terraform-state-company/skills-app/eks/terraform.tfstate
       Operation: OperationTypeApply
       Who:       ci-runner-04@github-actions
     ```
  3. Process B exits safely without corrupting the state file.
* **Without State Locking (Local State):**
  * Both processes read the state, make conflicting cloud API calls, and overwrite the state file. The state becomes corrupted, leaving orphaned AWS resources that can no longer be updated or destroyed via code.

---

## 3. Terraform State Drift

### Q1. What is Terraform Drift and how do you detect it in CI/CD?
* **Definition:** Drift occurs when real-world cloud infrastructure differs from what is defined in Terraform configuration (e.g. an engineer manually opened port 22 on an AWS Security Group in the AWS Web Console).
* **Automated Detection via Nightly CI Pipeline:**
  ```bash
  terraform plan -detailed-exitcode -no-color
  # Exit Code 0: Clean — Infrastructure matches code exactly.
  # Exit Code 1: Error during execution.
  # Exit Code 2: Drift detected — Differences exist between real cloud and code.
  ```
* **Remediation:**
  * **To Revert Manual Changes:** Run `terraform apply` to overwrite the console changes and restore the infrastructure to the Git-approved state.
  * **To Adopt Manual Changes:** Update your `.tf` files to include the manual rule, then run `terraform apply` to cleanly synchronize the state.
