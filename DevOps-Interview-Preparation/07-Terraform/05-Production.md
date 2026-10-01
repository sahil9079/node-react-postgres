# Terraform Fundamentals - Level 4: Production

## 1. Handling State Drift, Imports, and Refactoring
* **State Drift (`terraform plan`):** Detects differences between the actual cloud infrastructure and the state file.
* **Importing Existing Resources:**
  ```bash
  terraform import aws_s3_bucket.legacy my-legacy-bucket-name
  ```
* **Safe Resource Renaming (`moved` block):**
  ```hcl
  moved {
    from = aws_instance.web
    to   = aws_instance.app_server
  }
  ```
  *(Prevents Terraform from destroying and recreating the resource when renamed in code)*.
