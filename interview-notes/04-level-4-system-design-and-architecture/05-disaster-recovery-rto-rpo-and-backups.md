# Level 4: Disaster Recovery (DR), RTO/RPO & Backup Architectures

> **Experience Target:** 4-Year Senior DevOps & Platform Architect  
> **Topic Scope:** Business continuity, RTO/RPO definitions, DR strategy matrix, automated cross-region database backups, and AWS Backup automation.

---

## 1. Defining RTO and RPO

* **RTO (Recovery Time Objective):**
  * The maximum acceptable duration of system downtime after a disaster before service must be fully operational.
  * *Example:* "Target RTO $< 15\text{ minutes}$."
* **RPO (Recovery Point Objective):**
  * The maximum acceptable amount of transactional data loss measured in time.
  * *Example:* "Target RPO $< 1\text{ minute}$ of transactions."

---

## 2. Disaster Recovery Strategy Matrix

| DR Strategy | Cost | RTO | RPO | Architecture Overview |
| :--- | :--- | :--- | :--- | :--- |
| **Backup & Restore** | **$\$$ (Cheapest)** | Hours | 24 Hours | Nightly database dumps and Terraform configs saved to cross-region S3. Restored manually if primary region fails. |
| **Pilot Light** | **$\$ \$$** | 30–60 Min | 15 Min | Database is continuously replicated to secondary AWS region. Compute nodes (EKS) are kept at 0 replicas until activated. |
| **Warm Standby** | **$\$ \$ \$$** | 5–15 Min | Real-time | A minimal, scaled-down version of EKS and RDS runs continuously in the secondary region. |
| **Multi-Region Active-Active** | **$\$ \$ \$ \$$ (Most Expensive)** | **Near 0** | **Near 0** | Full production clusters active in 2+ regions (`us-east-1` and `eu-west-1`) with Route 53 latency routing and Aurora Global Database. |
