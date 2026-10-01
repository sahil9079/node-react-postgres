# Terraform Fundamentals - Level 1: Foundation

## 1. Terraform Core Workflow
```
+-------------------------------------------------------------------------+
|                         TERRAFORM CORE WORKFLOW                         |
|                                                                         |
|  [main.tf] ----> terraform init  ----> Downloads Provider Plugins       |
|             ----> terraform plan  ----> Generates Execution Spec        |
|             ----> terraform apply ----> Provisions Cloud Infrastructure |
|             ----> terraform destroy --> Teardown (Sandbox cleanup only) |
+-------------------------------------------------------------------------+
```

## 2. Core HCL Blocks
```hcl
# Provider Definition
provider "aws" {
  region = var.aws_region
}

# Resource Definition
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true

  tags = {
    Name        = "${var.environment}-vpc"
    Environment = var.environment
  }
}

# Variable Definition
variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

# Output Definition
output "vpc_id" {
  value = aws_vpc.main.id
}
```
