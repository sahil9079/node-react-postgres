# Terraform Hands-On Labs

## Lab 1: Building a Complete Modular AWS VPC
1. Create `modules/vpc/main.tf`, `variables.tf`, and `outputs.tf`.
2. Instantiate module in root `main.tf`.
3. Run `terraform init`, `terraform plan`, and `terraform apply`.
4. Inspect state file: `terraform state list` and `terraform state show module.vpc.aws_vpc.main`.
