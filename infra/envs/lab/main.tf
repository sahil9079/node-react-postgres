terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment after running infra/bootstrap to enable remote S3 state with native lockfile:
  # backend "s3" {
  #   bucket       = "REPLACE_WITH_YOUR_UNIQUE_TF_STATE_BUCKET"
  #   key          = "skills-platform/lab/terraform.tfstate"
  #   region       = "ap-south-1"
  #   encrypt      = true
  #   use_lockfile = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      Owner       = "devops-portfolio"
      ManagedBy   = "Terraform"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "project_name" {
  type    = string
  default = "skills"
}

variable "environment" {
  type    = string
  default = "lab"
}

variable "db_password" {
  type        = string
  sensitive   = true
  default     = "ChangeMeInTfvars123!"
  description = "Master password for private RDS PostgreSQL (override via TF_VAR_db_password or terraform.tfvars)"
}

locals {
  cluster_name = "${var.project_name}-${var.environment}-eks"
}

module "network" {
  source                   = "../../modules/network"
  project_name             = var.project_name
  environment              = var.environment
  cluster_name             = local.cluster_name
  vpc_cidr                 = "10.0.0.0/16"
  azs                      = ["ap-south-1a", "ap-south-1b"]
  public_subnet_cidrs      = ["10.0.1.0/24", "10.0.2.0/24"]
  private_app_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
  private_db_subnet_cidrs  = ["10.0.21.0/24", "10.0.22.0/24"]
  single_nat_gateway       = true
}

module "ecr" {
  source       = "../../modules/ecr"
  repositories = ["skills-apiserver", "skills-client"]
}

module "eks" {
  source                 = "../../modules/eks"
  cluster_name           = local.cluster_name
  private_app_subnet_ids = module.network.private_app_subnet_ids
  node_instance_types    = ["t3.medium"]
  desired_size           = 2
  min_size               = 1
  max_size               = 3
}

module "rds" {
  source                = "../../modules/rds"
  project_name          = var.project_name
  environment           = var.environment
  private_db_subnet_ids = module.network.private_db_subnet_ids
  rds_sg_id             = module.network.rds_sg_id
  db_password           = var.db_password
  instance_class        = "db.t4g.micro"
  multi_az              = false
  skip_final_snapshot   = true
}

module "iam" {
  source       = "../../modules/iam"
  project_name = var.project_name
  environment  = var.environment
  github_repo  = "sahil9079/node-react-postgres"
}

output "vpc_id" { value = module.network.vpc_id }
output "ecr_repository_urls" { value = module.ecr.repository_urls }
output "eks_cluster_name" { value = module.eks.cluster_name }
output "rds_private_endpoint" { value = module.rds.rds_endpoint }
output "github_actions_oidc_role_arn" { value = module.iam.github_actions_role_arn }
