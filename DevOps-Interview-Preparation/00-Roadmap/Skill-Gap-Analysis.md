# Skill-Gap Analysis & Resume Verification
*Candidate: Sahil Khan | Target: 3–3.5 Years Production DevOps Competency*

---

## 1. Resume Audit & Baseline Assessment

Your resume represents solid professional hands-on exposure across two distinct project implementations:
1. **Full-Stack EKS App (Node.js/React/PostgreSQL)** with GitHub Actions, Trivy, SonarQube, and IAM.
2. **Enterprise Java 3-Tier App** with Jenkins, Maven, SonarQube, Docker, ECR, and Kubernetes.
3. **Infrastructure Automation** with Terraform, AWS VPC, EC2, EKS, S3, and ALB.

### Identified Gap Categories (After 1.5 Months Study Hiatus)
```
┌───────────────────────────────┐
│     SKILL GAP CATEGORIES      │
├───────────────────────────────┤
│ 1. Low-Level Linux Internals  │ -> Process signals, Inode leaks, Virtual memory paging
│ 2. Networking Debugging Depth │ -> TCP 3-way handshake flags, MTU/MSS, DNS caching & CNAME loops
│ 3. Kubernetes Edge-Case Triage│ -> OOMKilled vs CPU throttling, CNI IP exhaustion, Probe race conditions
│ 4. Terraform State Surgery    │ -> State corruption recovery, terraform import, moved blocks
│ 5. AWS Production Security    │ -> IRSA OIDC trust policies vs Instance Profiles, KMS envelope encryption
│ 6. Spoken English & RCA Comms │ -> Explaining high-severity incidents in structured STAR/RCA format
└───────────────────────────────┘
```

---

## 2. Granular Gap Analysis & Remediation Strategy

| Technology | Claimed on Resume | Potential Interview Trap / Gap | Target Depth to Defend Resume |
| :--- | :--- | :--- | :--- |
| **Linux** | Administered Linux servers | Can run basic commands, but can you explain VFS or debug unlinked file descriptor leaks? | Master `lsof +L1`, `strace`, `journalctl`, `awk`/`sed` log parsers. |
| **Docker** | Containerized applications | Can write Dockerfile, but do you run containers as root? Are images multi-stage? | Master multi-stage builds, non-root users, distroless images, layer caching. |
| **Kubernetes** | EKS deployments, Services, PVC | Know YAML manifests, but how does kube-proxy handle iptables NAT? What if PVC is Pending? | Master StorageClass provisioners, CNI routing, HPA algorithms, etcd quorum. |
| **AWS** | VPC, EKS, IAM, EC2, S3, ALB | Created resources, but can you explain why ALB Controller needs specific subnet tags? | Master `kubernetes.io/role/elb` tags, OIDC IAM policies, VPC endpoints. |
| **Terraform** | IaC infrastructure on AWS | Written `.tf` files, but how do you handle state locks when CI runner dies mid-apply? | Master DynamoDB locking, `force-unlock`, remote backends, and `terraform import`. |
| **CI/CD** | Jenkins & GitHub Actions | Built pipelines, but how do you authenticate GitHub Actions to AWS without static keys? | Master GitHub Actions AWS OIDC Role assumption with zero hardcoded credentials. |
| **DevSecOps** | SonarQube & Trivy | Included tools in pipeline, but what exact quality gate break conditions did you enforce? | Defend 50% coverage gate, zero HIGH/CRITICAL vulnerability blocking in Trivy. |
