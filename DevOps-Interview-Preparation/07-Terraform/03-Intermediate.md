# Terraform Fundamentals - Level 2: Intermediate

## 1. Production Remote State with S3 and DynamoDB Locking
```hcl
# backend.tf
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "company-terraform-state-prod"
    key            = "vpc/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-locks"
    encrypt        = true
  }
}
```
* **Why S3?** Centralized, encrypted, versioned remote state accessible to team members and CI/CD pipelines.
* **Why DynamoDB?** State Locking prevents concurrent `terraform apply` executions from corrupting the state file.
