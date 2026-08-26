# Level 1: Terraform & Infrastructure as Code (IaC) Fundamentals

> **Experience Target:** 1-Year Junior/Associate DevOps Engineer  
> **Topic Scope:** IaC concepts, declarative vs imperative, Terraform CLI commands (`init`, `plan`, `apply`, `destroy`), providers, resources, variables, outputs, and state basics.

---

## 1. Core Infrastructure as Code Concepts

### Q1. What is Infrastructure as Code (IaC) and why do we use Terraform?
* **IaC:** Managing and provisioning computing infrastructure (VPCs, EKS clusters, S3 buckets, RDS databases) through version-controlled configuration files rather than manual point-and-click operations in the AWS Console.
* **Benefits:**
  * **Repeatability:** Deploy identical environments (Dev, Staging, Production) in minutes.
  * **Version Control & Auditability:** Every infrastructure change is reviewed via Pull Requests and tracked in Git.
  * **Disaster Recovery:** Entire cloud environments can be reconstructed from code if an AWS region experiences failure.

---

## 2. The 4-Stage Terraform Lifecycle Workflow

```
[Write .tf Config] ──► [terraform init] ──► [terraform plan] ──► [terraform apply] ──► [terraform destroy]
```

1. **`terraform init`:**
   * Initializes the working directory.
   * Downloads required cloud provider plugins (e.g. `hashicorp/aws`).
   * Configures the remote state backend (e.g. Amazon S3 + DynamoDB).
2. **`terraform plan`:**
   * Compares the current state against live cloud resources.
   * Generates an execution plan showing exactly what will be created (`+`), modified (`~`), or destroyed (`-`) without making any live changes.
3. **`terraform apply`:**
   * Prompts for confirmation, acquires the state lock, and makes API calls to AWS to provision the planned infrastructure.
   * Writes the updated state to `terraform.tfstate`.
4. **`terraform destroy`:**
   * Destroys all infrastructure managed by the current Terraform state file.

---

## 3. Core Terraform Syntax Elements

```hcl
# 1. Provider Configuration
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# 2. Input Variable
variable "aws_region" {
  type        = string
  default     = "ap-south-1"
  description = "AWS region for infrastructure"
}

# 3. Resource Block
resource "aws_s3_bucket" "app_storage" {
  bucket = "node-react-app-media-storage"
  tags = {
    Environment = "production"
    ManagedBy   = "Terraform"
  }
}

# 4. Output Value
output "bucket_arn" {
  value       = aws_s3_bucket.app_storage.arn
  description = "The ARN of the provisioned S3 bucket"
}
```

---

## 4. What is `terraform.tfstate`?
* The state file is a JSON document where Terraform records the mapping between your declared code resources (`aws_s3_bucket.app_storage`) and actual AWS resource IDs (`arn:aws:s3:::node-react-app-media-storage`).
* Terraform relies on this state file to know what resources it created, what has drifted, and what needs to be updated or removed during future runs.
