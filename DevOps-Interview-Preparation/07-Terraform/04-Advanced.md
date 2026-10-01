# Terraform Fundamentals - Level 3: Advanced

## 1. Advanced HCL: `for_each`, Dynamic Blocks & Locals
```hcl
locals {
  common_tags = {
    ManagedBy = "Terraform"
    Project   = "EKS-Infrastructure"
  }
}

resource "aws_subnet" "public" {
  for_each = {
    "us-east-1a" = "10.0.1.0/24"
    "us-east-1b" = "10.0.2.0/24"
  }

  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value
  availability_zone = each.key

  tags = merge(local.common_tags, {
    Name = "public-subnet-${each.key}"
  })
}
```
