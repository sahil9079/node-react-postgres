# Project 1: K8s-DevOps-Pipeline (Node.js/React + PostgreSQL on AWS EKS)

## 1. Project Overview (From Resume)
* **Stack:** Node.js/Express REST API, React Frontend, PostgreSQL Database.
* **CI/CD:** GitHub Actions with DevSecOps automation (SonarQube 50% coverage threshold + Trivy container scanning).
* **Cloud & Infrastructure:** AWS EKS, VPC, ALB Ingress Controller, IAM (IRSA), Terraform, EBS gp3 storage.

## 2. Architecture Diagram
```
Developer Push --> GitHub Repository --> GitHub Actions Workflow
                                                |
          +-------------------------------------+-------------------------------------+
          |                                     |                                     |
          v                                     v                                     v
   Unit Tests (57 tests)             SonarQube Quality Gate               Trivy Vulnerability Scan
   (Jest / Integration)             (50% Coverage Threshold)            (Fail on CRITICAL/HIGH CVE)
                                                |
                                                v
                                   Build & Tag Docker Image
                                                |
                                                v (AWS OIDC Authentication)
                                     Push to Amazon ECR
                                                |
                                                v
                                     Deploy to AWS EKS Cluster
                                (Rolling Update with Zero Downtime)
```

## 3. 10-Minute Interview Presentation Script
> *"In my primary project, I engineered an end-to-end production-grade DevOps pipeline for a full-stack Node.js, React, and PostgreSQL platform deployed on Amazon EKS. 
> 
> For our CI/CD automation, I built GitHub Actions workflows integrating strict DevSecOps gates. Every pull request triggers multi-layer testing executing 57 unit and integration tests, followed by SonarQube static code analysis enforcing a mandatory 50% code coverage threshold. Next, Trivy scans the Docker image filesystem and base OS layers, automatically blocking builds if any unpatched Critical or High vulnerabilities are detected.
> 
> On the AWS infrastructure side, we provisioned a multi-AZ VPC and EKS cluster using Terraform. Application authentication to AWS services is secured using IAM Roles for Service Accounts (IRSA) via OIDC. Incoming traffic is routed through an AWS Application Load Balancer managed by the AWS Load Balancer Controller in IP mode for optimal latency. Stateful PostgreSQL storage is dynamically provisioned using EBS gp3 CSI drivers, and stateless workloads autoscale seamlessly with HPA."*
