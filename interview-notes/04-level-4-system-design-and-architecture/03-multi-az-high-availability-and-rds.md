# Level 4: Multi-AZ High Availability & Amazon RDS Architecture

> **Experience Target:** 4-Year Senior DevOps & Platform Architect  
> **Topic Scope:** Multi-AZ architecture, EKS Topology Spread Constraints, RDS Multi-AZ synchronous replication, Read Replicas, and Connection Pooling with PgBouncer.

---

## 1. Multi-AZ EKS Pod Spreading

To prevent an entire service from going down if an AWS Availability Zone has an outage, we enforce **Topology Spread Constraints**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: apiserver
spec:
  replicas: 6
  template:
    spec:
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app: apiserver
```
* **How it Works:** Guarantees that Kubernetes schedules an equal distribution of API pods across `ap-south-1a`, `ap-south-1b`, and `ap-south-1c`. If AZ `1a` fails completely, remaining pods in `1b` and `1c` continue serving user traffic without downtime.

---

## 2. Amazon RDS PostgreSQL Multi-AZ Deployment

```
[EKS Worker Nodes AZ-1]              [EKS Worker Nodes AZ-2]
          │                                     │
          ▼                                     ▼
┌─────────────────────────────────────────────────────────────┐
│ RDS Primary Endpoint (DNS: db.company.internal)             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────┐ Synchronous   ┌──────────────────────────────┐
│ Primary DB Instance (AZ-1)   │ ────────────► │ Standby DB Instance (AZ-2)   │
│ - Handles Reads & Writes     │ Replication   │ - Hot Standby (Zero Data Loss│
└──────────────────────────────┘               └──────────────────────────────┘
```

### Key Enterprise RDS Advantages:
1. **Synchronous Physical Replication:** Every write to the primary DB in AZ-1 is synchronously committed to the standby DB in AZ-2 before acknowledging success to Express.
2. **Automated Failover:** If AZ-1 experiences a hardware or network failure, AWS RDS automatically flips the DNS endpoint record to the Standby in **under 60 seconds** ($RTO < 60\text{s}$, $RPO = 0$).
3. **Automated Backups & PITR:** Daily automated snapshots plus Continuous WAL log archiving to S3, enabling Point-in-Time Recovery (PITR) to any specific second in the past 35 days.
