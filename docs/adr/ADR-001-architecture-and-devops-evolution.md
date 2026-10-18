# ADR-001: Production DevOps Architecture Evolution (ALB Ingress, Private RDS, OIDC & FinOps Lab Controls)

* **Status:** Accepted
* **Date:** 2026-10-18
* **Region Default:** `ap-south-1` (AWS Mumbai)

---

## 1. Context & Problem Statement

The original repository (`node-react-postgres`) contained a working 3-tier React 17 + Node.js/Express 4 + PostgreSQL 15 application with 62 passing Jest unit/integration tests, basic Dockerfiles, a local `docker-compose.yaml`, and 11 flat Kubernetes manifests (`k8s/`).

However, our Phase 0 audit uncovered critical production readiness gaps:
1. **Stateful DB inside Kubernetes (`k8s/dbdep.yaml` + `k8s/dbpvc.yaml`)**: Running PostgreSQL as a `Deployment` with a single-AZ `ReadWriteOnce` EBS volume lacks automated point-in-time recovery, Multi-AZ failover, and safe rolling updates.
2. **Routing & Load Balancer Sprawl (`k8s/clientsrc.yaml`)**: Exposing services directly via `type: LoadBalancer` without an Ingress Controller lacks path-based routing and ACM TLS termination at a shared edge.
3. **Secret & Config Mismatch (`k8s/secret.yaml`)**: Kubernetes Secret keys (`username`, `password`, `JWT_SECRET`) did not match the environment variables required by `apiserver` (`DB_USER`, `DB_PASS`, `JWT_VERIFY_SECRET`, `JWT_SESSION_SECRET`, `SESSION_ENCRYPT_SECRET`), causing immediate `CrashLoopBackOff` in `apiserver/utils/session.js`.
4. **Missing Operational Probes**: `apiserver/app.js` lacked `/healthz` (liveness) and `/readyz` (DB readiness) endpoints.

---

## 2. Key Architectural Decisions

### Decision 1: Keep `apiserver/` and `client/` Directory Structure Intact
* **Decision**: Retain the existing `apiserver/` and `client/` directories as the source of truth rather than renaming `apiserver/` to `api/`.
* **Rationale**: Preserves all 62 working Jest tests, `sonar-project.properties` paths, and Git history without unnecessary churn.

### Decision 2: Separate Liveness (`/healthz`) and Readiness (`/readyz`) Endpoints
* **Decision**: Implement `GET /healthz` (process check only) and `GET /readyz` (`sampledb.authenticate()` check) in `apiserver/app.js`.
* **Rationale**: Prevents Kubernetes `livenessProbe` from restarting API Pods during transient database connectivity issues while allowing `readinessProbe` to remove unhealthy Pods from Service endpoints (`EndpointSlices`).

### Decision 3: Private Amazon RDS for PostgreSQL (Cloud) vs. PostgreSQL Container (Local Compose)
* **Decision**: Use the `postgres:15-alpine` container in `docker-compose.yaml` for zero-cost local development, and use **Private Amazon RDS for PostgreSQL** (`publicly_accessible = false`, private DB subnets, TLS enabled via `DB_SSL=true`) in AWS.
* **Rationale**: Offloads storage durability, automated backups, Point-in-Time Recovery (RPO), and Multi-AZ failover (RTO) to AWS managed RDS.

### Decision 4: Single AWS ALB via Kubernetes Ingress (`AWS Load Balancer Controller`)
* **Decision**: Expose both `client-service` (port 80) and `apiserver-service` (port 8010) as `type: ClusterIP` in EKS, fronted by a single Kubernetes `Ingress` (`ingressClassName: alb`, `target-type: ip`) routing `/api/*` to `apiserver-service` and `/*` to `client-service`.
* **Rationale**: Consolidates traffic onto one Application Load Balancer (saving ~\$16+/month per extra LB), enables ACM HTTPS termination, and routes directly to Pod IPs.

### Decision 5: Cost-Controlled Lab vs. Production HA Parameterization
* **Decision**: Parameterize Terraform modules so the learning lab uses `single_nat_gateway = true` and Single-AZ `db.t4g.micro` RDS, while production `tfvars` enables per-AZ NAT Gateways and `multi_az = true`.
* **Rationale**: Minimizes hourly lab charges while maintaining production-grade Terraform module design.
