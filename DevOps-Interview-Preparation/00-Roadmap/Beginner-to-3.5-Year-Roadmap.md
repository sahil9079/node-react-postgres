# Comprehensive Beginner to 3.5-Year DevOps Roadmap
*Target Profile: Sahil Khan | 3+ Years DevOps & Cloud Infrastructure Engineer*

---

## 1. Executive Summary & Progression Hierarchy
This roadmap takes you systematically from first principles to the depth expected of an enterprise DevOps Engineer with 3–3.5 years of hands-on experience. 

```
[LEVEL 0: BEGINNER]       --> Fundamental definitions, real-world analogies, problem context
        ↓
[LEVEL 1: FOUNDATION]     --> Core architecture, component breakdown, essential syntax & CLI
        ↓
[LEVEL 2: INTERMEDIATE]   --> Multi-service interaction, configs, Docker Compose, CI workflows
        ↓
[LEVEL 3: ADVANCED]       --> Deep internals, kernel mechanics, storage CSI, CNI, IRSA, state drift
        ↓
[LEVEL 4: PRODUCTION]     --> Real-world pipelines, observability, GitOps, DevSecOps gates, DR
        ↓
[LEVEL 5: 3.5-YEAR LEVEL] --> Incident RCA, architecture trade-offs, capacity planning, interview defense
```

---

## 2. 90-Day High-Level Phase Breakdown

```
+---------------------------------------------------------------------------------------------------+
|                                      90-DAY DEVOPS CURRICULUM                                     |
+-----------------------------------+-----------------------------------+---------------------------+
|              MONTH 1              |              MONTH 2              |          MONTH 3          |
|    Foundations & Core Plumbing    |   Kubernetes, EKS, Cloud & IaC    | Enterprise CI/CD & Prod   |
+-----------------------------------+-----------------------------------+---------------------------+
| Week 1: Linux Architecture & Bash | Week 5: Kubernetes Core & Pods    | Week 9: Project 1 (EKS)   |
| Week 2: Enterprise Networking     | Week 6: K8s Storage, CNI, Ingress | Week 10: Project 2 (Java) |
| Week 3: Docker & Containerization | Week 7: AWS Architecture & EKS    | Week 11: RCA & Incidents  |
| Week 4: Dual CI/CD Pipelines      | Week 8: Terraform Deep Dive       | Week 12: Mock Interviews  |
+-----------------------------------+-----------------------------------+---------------------------+
```

---

## 3. Technology Mastery Map Grounded in Resume

| Domain | Key Technologies on Resume | Target Competency (3.5 Year Level) |
| :--- | :--- | :--- |
| **Operating System** | Linux (Ubuntu, RedHat), Bash, Systemd | Kernel process isolation, cgroups, VFS, socket states, shell traps |
| **Networking** | OSI, TCP/IP, DNS, HTTP/S, Nginx, ALB | Packet inspection, TLS handshakes, HTTP status triage (502/503/504) |
| **Containers** | Docker, Docker Compose, Multi-stage | Non-root containers, layer cache optimization, UnionFS, containerd |
| **Orchestration** | Kubernetes, EKS, kubectl | Control plane internals, kube-proxy iptables, IRSA, HPA, Probes |
| **Cloud (AWS)** | VPC, EC2, S3, IAM, ECR, ALB, AutoScaling | Multi-AZ secure VPC design, IAM least-privilege, ALB Ingress Controller |
| **IaC** | Terraform (HCL), Remote S3/DynamoDB | Module architecture, state locking, drift remediation, dynamic blocks |
| **CI/CD** | Jenkins (Declarative), GitHub Actions | Master-agent scaling, GitHub OIDC AWS auth, shared libraries |
| **DevSecOps** | SonarQube, Trivy, Checkstyle | SAST quality gates, container CVE mitigation, automated image blocking |
| **Web & App** | Nginx, Apache Tomcat, Node.js, Java | Reverse proxy routing, upstream connection pools, JVM heap tuning |
| **Databases** | PostgreSQL, MySQL | Connection pooling, persistent volume attachments, stateful backup/restore |
