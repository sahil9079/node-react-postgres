# AWS Fundamentals - Level 1: Foundation

## 1. Core AWS Services on Resume
* **Compute:** EC2 (Elastic Compute Cloud), Auto Scaling Groups.
* **Container Services:** EKS (Elastic Kubernetes Service), ECS (Elastic Container Service), ECR (Elastic Container Registry).
* **Networking:** VPC (Virtual Private Cloud), Subnets, Route Tables, Internet Gateway (IGW), NAT Gateway, Security Groups, ALB/NLB.
* **Storage:** S3 (Simple Storage Service), EBS (Elastic Block Store).
* **Security & Governance:** IAM (Identity & Access Management), CloudWatch.

## 2. VPC High-Level Architecture
```
+---------------------------------------------------------------------------------+
|                       AWS REGION (e.g., us-east-1)                              |
|  +---------------------------------------------------------------------------+  |
|  | VPC (CIDR: 10.0.0.0/16)                                                   |  |
|  |                                                                           |  |
|  |  +-----------------------------+     +-----------------------------+      |  |
|  |  | AZ-1a (Public Subnet)       |     | AZ-1b (Public Subnet)       |      |  |
|  |  | [Internet Facing ALB]       |     | [Internet Facing ALB]       |      |  |
|  |  | [NAT Gateway]               |     | [NAT Gateway]               |      |  |
|  |  +-----------------------------+     +-----------------------------+      |  |
|  |                 |                                   |                     |  |
|  |                 v                                   v                     |  |
|  |  +-----------------------------+     +-----------------------------+      |  |
|  |  | AZ-1a (Private Subnet)      |     | AZ-1b (Private Subnet)      |      |  |
|  |  | [EKS Worker Nodes]          |     | [EKS Worker Nodes]          |      |  |
|  |  | [Postgres RDS / Pods]       |     | [Postgres RDS / Pods]       |      |  |
|  |  +-----------------------------+     +-----------------------------+      |  |
|  +---------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------+
```
