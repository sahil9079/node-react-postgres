# AWS Fundamentals - Level 4: Production

## 1. Multi-AZ High Availability & Disaster Recovery
* **Compute:** Spread EKS Node Groups across minimum 3 Availability Zones.
* **Storage:** Use Multi-AZ RDS for automated synchronous replication and automated failover.
* **Load Balancing:** Internet-facing ALB with Target Groups routing across healthy private targets in all AZs.
* **Subnet Tagging for EKS Load Balancer Controller:**
  * Public Subnets: `kubernetes.io/role/elb = 1`
  * Private Subnets: `kubernetes.io/role/internal-elb = 1`
  * Cluster Shared Tag: `kubernetes.io/cluster/<cluster-name> = shared`
