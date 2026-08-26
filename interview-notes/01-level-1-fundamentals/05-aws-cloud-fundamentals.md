# Level 1: AWS Cloud Fundamentals & Core Services

> **Experience Target:** 1-Year Junior/Associate DevOps Engineer  
> **Topic Scope:** Core AWS services, EC2, VPC, EKS, ALB, EBS, ECR, S3, IAM basics, Security Groups vs NACLs.

---

## 1. Core AWS Services in Your Architecture

| AWS Service | What it is | How it relates to your project |
| :--- | :--- | :--- |
| **Amazon EKS** | Managed Elastic Kubernetes Service | Hosts the control plane and manages the EC2 worker nodes running your pods. |
| **AWS ALB** | Application Load Balancer (Layer 7) | Auto-provisioned by `clientsrc.yaml` (`type: LoadBalancer`) to route HTTP traffic into the Nginx client pod. |
| **Amazon EBS** | Elastic Block Store | Dynamic storage volume provisioned via `dbpvc.yaml` to persist PostgreSQL database files. |
| **Amazon ECR / Docker Hub** | Elastic Container Registry | Stores Docker images (`sahil9079/js-apiserver:v1.1.0` and `sahil9079/js-client:v1.1.0`). |
| **Amazon VPC** | Virtual Private Cloud | Logically isolated cloud network containing your subnets, routing tables, and worker nodes. |
| **AWS IAM** | Identity & Access Management | Controls access permissions for EKS worker nodes, GitHub Actions CI/CD pipelines, and engineers. |

---

## 2. AWS Networking Fundamentals

### Q1. What is the difference between a Public Subnet and a Private Subnet?
* **Public Subnet:**
  * Has a Route Table entry directing `0.0.0.0/0` (default internet traffic) to an **Internet Gateway (IGW)**.
  * Instances receive public IP addresses and are directly reachable from the internet (e.g. Public Load Balancers, Bastion Hosts).
* **Private Subnet:**
  * Does **NOT** route directly to an IGW.
  * To access the internet (e.g. to download npm packages or security patches), instances route outbound traffic through a **NAT Gateway** located in a public subnet.
  * Best practice: Databases (PostgreSQL) and backend APIs should always reside in private subnets.

---

### Q2. What is the difference between a Security Group and a Network ACL (NACL)?

| Feature | Security Group (SG) | Network ACL (NACL) |
| :--- | :--- | :--- |
| **Level** | Operates at the **Instance / ENI level**. | Operates at the **Subnet boundary level**. |
| **Statefulness** | **Stateful:** If inbound traffic is allowed, return outbound traffic is automatically allowed. | **Stateless:** Outbound return traffic must be explicitly allowed. |
| **Rule Types** | Supports **Allow rules only** (cannot explicitly deny). | Supports both **Allow and Deny rules**. |
| **Evaluation** | All rules are evaluated together. | Rules are evaluated in strict numerical order (lowest first). |

---

## 3. AWS IAM Basics (Least Privilege)

### Q1. What are IAM Users, Roles, and Policies?
* **IAM User:** A permanent identity representing a person or service account with long-lived credentials (Access Key ID & Secret Access Key).
* **IAM Policy:** A JSON document defining granular permissions (`Effect: Allow/Deny`, `Action`, `Resource`).
* **IAM Role:** An identity with temporary security credentials that can be assumed by AWS services (e.g. an EC2 instance or EKS Pod) without hardcoding long-lived secrets.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage"
      ],
      "Resource": "*"
    }
  ]
}
```
