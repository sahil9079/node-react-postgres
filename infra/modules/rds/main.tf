variable "project_name" { type = string }
variable "environment" { type = string }
variable "private_db_subnet_ids" { type = list(string) }
variable "rds_sg_id" { type = string }
variable "db_name" {
  type    = string
  default = "sampledb"
}
variable "db_username" {
  type    = string
  default = "postgres"
}
variable "db_password" {
  type      = string
  sensitive = true
}
variable "instance_class" {
  type    = string
  default = "db.t4g.micro"
}
variable "multi_az" {
  type        = bool
  default     = false
  description = "Set false in lab for cost control; set true in production for synchronous Multi-AZ standby failover"
}
variable "skip_final_snapshot" {
  type        = bool
  default     = true
  description = "Set true in lab to avoid retained snapshot charges after terraform destroy; set false in production"
}

resource "aws_db_subnet_group" "rds" {
  name       = "${var.project_name}-${var.environment}-db-subnet-group"
  subnet_ids = var.private_db_subnet_ids

  tags = {
    Name = "${var.project_name}-${var.environment}-db-subnet-group"
  }
}

resource "aws_db_instance" "postgres" {
  identifier              = "${var.project_name}-${var.environment}-postgres"
  engine                  = "postgres"
  engine_version          = "15"
  instance_class          = var.instance_class
  allocated_storage       = 20
  max_allocated_storage   = 50
  storage_type            = "gp3"
  storage_encrypted       = true
  db_name                 = var.db_name
  username                = var.db_username
  password                = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.rds.name
  vpc_security_group_ids  = [var.rds_sg_id]
  publicly_accessible     = false
  multi_az                = var.multi_az
  backup_retention_period = 7
  deletion_protection     = false
  skip_final_snapshot     = var.skip_final_snapshot
}

output "rds_endpoint" {
  value       = aws_db_instance.postgres.address
  description = "Private DNS hostname of the RDS PostgreSQL instance"
}

output "rds_port" {
  value = aws_db_instance.postgres.port
}

resource "aws_secretsmanager_secret" "app_credentials" {
  name                    = "prod/node-react-app/credentials"
  description             = "RDS PostgreSQL and JWT/Session credentials synced into EKS via External Secrets Operator"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "app_credentials" {
  secret_id = aws_secretsmanager_secret.app_credentials.id
  secret_string = jsonencode({
    DB_USER                = var.db_username
    DB_PASS                = var.db_password
    JWT_VERIFY_SECRET      = "replace-in-aws-secrets-manager-jwt-verify"
    JWT_SESSION_SECRET     = "replace-in-aws-secrets-manager-jwt-session"
    JWT_REFRESH_SECRET     = "replace-in-aws-secrets-manager-jwt-refresh"
    SESSION_ENCRYPT_SECRET = "replace-in-aws-secrets-manager-session-enc"
  })
}

output "credentials_secret_arn" {
  value       = aws_secretsmanager_secret.app_credentials.arn
  description = "ARN of the AWS Secrets Manager secret consumed by ExternalSecret"
}

