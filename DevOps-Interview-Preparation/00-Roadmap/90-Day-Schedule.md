# Detailed 90-Day Master Schedule
*Daily Breakdown Across 12 Weeks (3 Months)*

---

### MONTH 1: Foundations, Linux Internals, Networking, Docker & Dual CI/CD

* **Week 1: Linux Operating System Internals & Bash Automation**
  * Day 1: Linux Architecture, Boot Flow, Filesystem Hierarchy (VFS, Inodes, Ext4/XFS)
  * Day 2: Process Management, Signals (SIGTERM vs SIGKILL), Cgroups & Namespaces
  * Day 3: Memory Internals (Virtual Memory, Swappiness, Buffer/Cache, OOM Killer)
  * Day 4: Disk I/O, Filesystem Recovery, Systemd Unit Architecture & Journalctl
  * Day 5: Linux Text Processing Mastery (`grep`, `awk`, `sed`, `find`, `xargs`, pipes)
  * Day 6: Advanced Bash Automation (Error Handling, Traps, Exit Codes, POSIX Standards)
  * Day 7: Week 1 Assessment, Practical Exam & Mock Interview Drill

* **Week 2: Enterprise Networking, Nginx, Storage & Databases**
  * Day 8: OSI & TCP/IP Layer Deep-Dive, 3-Way Handshake, TCP Flags, Port States
  * Day 9: IP Addressing, CIDR Subnetting, Routing Tables, NAT, DNS Resolution Flow
  * Day 10: HTTP/HTTPS, SSL/TLS Handshake, Mutual TLS (mTLS), Headers, Status Codes
  * Day 11: Nginx as Reverse Proxy, Load Balancer, Upstream Config, Buffer Tuning
  * Day 12: Troubleshooting 502/503/504 Bad Gateway Errors at Nginx & Upstream Levels
  * Day 13: PostgreSQL & MySQL Administration, Connection Pooling, Backup/Restore
  * Day 14: Week 2 Assessment, Network Packet Trace Lab & Troubleshooting Test

* **Week 3: Containerization Internals, Docker Security & Optimization**
  * Day 15: Docker Engine Architecture, containerd, runc, Namespaces & Cgroups
  * Day 16: Dockerfile Deep-Dive, UnionFS, Layer Caching Optimization, Multi-Stage
  * Day 17: Non-Root Containers, Docker Security Hardening, Vulnerability Scanning
  * Day 18: Container Networking (Bridge, Host, Overlay, Macvlan) & Port Mapping
  * Day 19: Storage Drivers, Volume Types (Named vs Bind Mounts), Permission Mapping
  * Day 20: Docker Compose for Multi-Container Apps (Healthchecks, Dependencies)
  * Day 21: Week 3 Assessment, Docker Hardening Lab & Optimization Benchmark

* **Week 4: Dual CI/CD Pipelines (Jenkins & GitHub Actions) + DevSecOps**
  * Day 22: Git Internal Plumbing (Objects: Blobs, Trees, Commits, Annotated Tags)
  * Day 23: Advanced Git Workflows (Rebase vs Merge, Cherry-pick, Conflict Resolution)
  * Day 24: Jenkins Architecture, Master-Agent Distributed Builds, Declarative Pipelines
  * Day 25: Maven Build Lifecycle, Plugin Management, SonarQube Quality Gates
  * Day 26: GitHub Actions Workflows, Runners, Matrix Builds, Caching, Contexts
  * Day 27: DevSecOps Integration: Trivy Container Scanning, SAST, Secret Scanning
  * Day 28: Week 4 Comprehensive Assessment: End-to-End Dual Pipeline Build Exam

---

### MONTH 2: Kubernetes Internals, EKS, Cloud Architecture & Terraform

* **Week 5: Kubernetes Core Architecture & Workload Management**
  * Day 29: K8s Control Plane Internals (kube-apiserver, etcd quorum, kube-scheduler)
  * Day 30: K8s Node Architecture (kubelet, CRI, kube-proxy, iptables vs IPVS)
  * Day 31: Pod Lifecycle, Phase Transitions, Init Containers, Ephemeral Containers
  * Day 32: Deployments, ReplicaSets, RollingUpdate Strategy, Rollbacks, PDB
  * Day 33: Resource Management: Requests, Limits, QoS Classes (Guaranteed/Burstable/BestEffort)
  * Day 34: Probes (Startup, Liveness, Readiness) & Health Check Failure Mechanics
  * Day 35: Week 5 Assessment: CrashLoopBackOff & Resource Starvation Labs

* **Week 6: K8s Networking, Ingress, Storage, Security & Workload Scheduling**
  * Day 36: K8s Services (ClusterIP, NodePort, LoadBalancer), CoreDNS Architecture
  * Day 37: Ingress Controllers, Ingress Resources, Path/Host Routing Rules
  * Day 38: K8s Storage Architecture: PV, PVC, StorageClasses, Dynamic Provisioning
  * Day 39: Configuration Management: ConfigMaps, Secrets, External Secrets Operator
  * Day 40: Advanced Scheduling: NodeSelector, Node Affinity, Taints, Tolerations
  * Day 41: K8s RBAC: ServiceAccounts, Roles, RoleBindings, ClusterRoles
  * Day 42: Week 6 Assessment: Storage Pending & DNS Troubleshooting Lab Exam

* **Week 7: AWS Infrastructure Deep-Dive & Production Amazon EKS**
  * Day 43: AWS Core Networking: VPC, Public/Private Subnets, IGW, NAT Gateways
  * Day 44: AWS Security Architecture: IAM Roles, Policies, Boundary, SGs vs NACLs
  * Day 45: Elastic Load Balancing (ALB/NLB), Target Groups, SSL Termination
  * Day 46: Amazon EKS Architecture, VPC CNI Plugin, Subnet Tagging Requirements
  * Day 47: IAM Roles for Service Accounts (IRSA) & Pod Identity Authentication
  * Day 48: AWS Load Balancer Controller & EBS CSI Driver Integration on EKS
  * Day 49: Week 7 Assessment: Multi-AZ EKS Provisioning & IRSA Debugging

* **Week 8: Infrastructure as Code with Terraform**
  * Day 50: Terraform Core Architecture, State Engine, Dependency Graph, Providers
  * Day 51: State Management: Remote Backend (S3 + DynamoDB State Locking), Drift
  * Day 52: Advanced HCL: Dynamic Blocks, `for_each`, `count`, Locals, Conditionals
  * Day 53: Enterprise Terraform Modules Design (Reusable VPC, EKS, RDS Modules)
  * Day 54: State Operations: `import`, `moved`, `state rm`, Recovering Corrupted State
  * Day 55: Terraform Security, CI/CD Automated Execution, tfsec/trivy IaC Scanning
  * Day 56: Week 8 Assessment: Full Multi-Tier AWS Infrastructure Terraform Build

---

### MONTH 3: Enterprise Projects, Observability, Troubleshooting & Interviews

* **Week 9: PROJECT 1 - Full-Stack App on AWS EKS (Node.js/React/PostgreSQL)**
  * Day 57: Project 1: Architecture Blueprint, VPC & EKS Terraform Automation
  * Day 58: Project 1: Docker Multi-Stage Builds & Automated GitHub Actions CI
  * Day 59: Project 1: K8s Manifests (Deployment, StatefulSet/PostgreSQL, PVC, Config)
  * Day 60: Project 1: AWS ALB Controller, Ingress Configuration & ACM SSL
  * Day 61: Project 1: DevSecOps (Trivy, SonarQube, Secret Management with SSM)
  * Day 62: Project 1: Autoscaling (HPA + Cluster Autoscaler / Karpenter) & Chaos Test
  * Day 63: Project 1: 10-Minute Executive Architectural Presentation & Defense Drill

* **Week 10: PROJECT 2 - Three-Tier Enterprise Java Application on EKS**
  * Day 64: Project 2: Three-Tier Java Architecture Blueprint & Nexus/Tomcat/MySQL Setup
  * Day 65: Project 2: Jenkins Pipeline Mastery: Multi-Branch Pipeline with Shared Libs
  * Day 66: Project 2: SonarQube Quality Gates, Unit Testing & ECR Image Publishing
  * Day 67: Project 2: Production K8s Deployment, Nginx Ingress & DB Migration
  * Day 68: Project 2: Production Observability (Prometheus Metrics & Grafana Dashboards)
  * Day 69: Project 2: Zero-Downtime Deployment (Blue/Green & Canary on EKS)
  * Day 70: Project 2: 10-Minute Enterprise Pipeline Defense & Cross-Questioning Drill

* **Week 11: Production Troubleshooting & Live Incident Simulation**
  * Day 71: Troubleshooting Masterclass: Kubernetes Pod Failures & Network Partitions
  * Day 72: Troubleshooting Masterclass: AWS Networking, IAM 403 AccessDenied & Route 53
  * Day 73: Troubleshooting Masterclass: CI/CD Pipeline Broken Dependencies & Agent Outages
  * Day 74: Troubleshooting Masterclass: High CPU/Memory Starvation & Linux Kernel Panics
  * Day 75: Troubleshooting Masterclass: Database Connection Exhaustion & Locking
  * Day 76: Troubleshooting Masterclass: Terraform Drift & State Lock Resolution
  * Day 77: Week 11 Comprehensive Incident RCA Simulation Exam

* **Week 12: Interview Mastery, Architecture Board & Final Certification**
  * Day 78: Core Linux, OS & Networking Rapid-Fire Technical Drill
  * Day 79: Docker & Kubernetes Low-Level Architecture Technical Drill
  * Day 80: AWS & Terraform Infrastructure Design Whiteboarding Drill
  * Day 81: CI/CD, DevSecOps & Security Hardening Technical Drill
  * Day 82: 3.5-Year Scenario-Based & Cross-Questioning Simulation
  * Day 83: Project 1 & Project 2 End-to-End Architectural Defense
  * Day 84: Behavioral, Agile, Incident Management & SRE Communication Mastery
  * Day 85: Full Mock Interview #1 (Screening + Core Technical)
  * Day 86: Full Mock Interview #2 (Deep Kubernetes & AWS Infrastructure)
  * Day 87: Full Mock Interview #3 (Live Production Troubleshooting)
  * Day 88: Full Mock Interview #4 (System Design & Architecture Board)
  * Day 89: 3.5-Year Competency Checklist Verification & Weak-Spot Patching
  * Day 90: Final Readiness Sign-Off & Interview Strategy Deployment
