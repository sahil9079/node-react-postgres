# Level 4: System Design — Scaling the Skills Platform to 1 Million Users

> **Experience Target:** 4-Year Senior DevOps & Platform Architect  
> **Topic Scope:** Architectural redesign, CDN static offloading, multi-AZ database clustering, distributed caching, and microservices boundary planning.

---

## 1. Current Architecture vs. Enterprise Scale Architecture

### Why the Current Project Cannot Handle 1M Users:
1. **Single Replica Bottlenecks:** `apidep.yaml` and `clientdep.yaml` run 1 single pod each. Under 1,000 concurrent requests, the Node.js event loop blocks and Nginx CPU throttles.
2. **Single Database Point of Failure:** PostgreSQL is hosted inside a Kubernetes pod on a 3Gi single-AZ EBS volume. If the node or AZ fails, the entire business goes offline.
3. **Nginx CPU Waste:** The client pod wastes server compute serving static React files and proxying requests.

---

## 2. Redesigned 1M+ User Architecture

```
                                  [1,000,000 Users]
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
     [Amazon CloudFront CDN]                            [AWS Route 53 (DNS)]
     (Static React Assets in S3)                                  │
     - Sub-10ms global edge latency                               ▼
     - 100% offloaded from cluster                      [AWS WAF (DDoS / SQLi)]
                                                                  │
                                                                  ▼
                                                    [AWS ALB Ingress Controller]
                                                    (ACM TLS 1.3 Termination)
                                                                  │
                                                                  ▼
                        ┌──────────────────────────────────────────────────────────┐
                        │                AWS EKS Cluster (Multi-AZ)                │
                        │                                                          │
                        │  [Node Group: AZ-1]                [Node Group: AZ-2]    │
                        │   ┌────────────────────────┐        ┌──────────────────┐ │
                        │   │ Express API Pods (HPA) │        │ Express API Pods │ │
                        │   └───────────┬────────────┘        └────────┬─────────┘ │
                        └───────────────┼──────────────────────────────┼───────────┘
                                        │                              │
                                        ▼                              ▼
                        ┌──────────────────────────────────────────────────────────┐
                        │                 Data & Caching Tier                      │
                        │                                                          │
                        │  [Amazon ElastiCache Redis Cluster]                      │
                        │  - JWT Blacklist & Active Session Storage                │
                        │  - Cached Skills Query Results (80% DB read reduction)   │
                        │                                                          │
                        │  [Amazon RDS PostgreSQL Multi-AZ]                        │
                        │   ├── Primary (Read/Write) in AZ-1                       │
                        │   └── Standby (Sync Replication, Auto-Failover) in AZ-2  │
                        │   └── Read Replicas (Async) for Read-Heavy Queries       │
                        └──────────────────────────────────────────────────────────┘
```

---

## 3. Key Architectural Upgrades & Business Impact

1. **Static React Asset Offloading (S3 + CloudFront):**
   * Eliminates the client Nginx pod entirely from the cluster compute footprint.
   * Static assets are stored in Amazon S3 and distributed across 400+ CloudFront edge locations, delivering 99.999% availability and instant load times globally.
2. **Database Modernization (Amazon RDS Multi-AZ + Read Replicas):**
   * Offloads database management (backups, patches, OS) to AWS.
   * Synchronous replication across AZs guarantees **zero data loss ($RPO = 0$)** and automated 60-second DNS failover ($RTO < 1\text{ min}$).
   * Read Replicas handle read-heavy portfolio/skill lookups, freeing the primary instance for write transactions.
3. **Distributed In-Memory Caching (Redis):**
   * Frequently accessed user profiles and skills listings are cached in Redis with a 5-minute TTL, dropping database CPU load by up to 80%.
