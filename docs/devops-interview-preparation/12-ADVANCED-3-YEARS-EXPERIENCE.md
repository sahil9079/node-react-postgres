# 12 — Advanced ~3+ Years DevOps Architecture & Trade-Offs (`12-ADVANCED-3-YEARS-EXPERIENCE.md`)

---

## 1. What Distinguishes a ~3+ Years DevOps Engineer from a Junior? (Hinglish)

Fresher ya Junior engineer batata hai *"Maine Dockerfile aur EKS YAML likha."*
Ek ~3+ years competency wala engineer batata hai:
1. **Why this design over alternatives** (e.g., Single ALB Ingress with `ClusterIP` vs multiple `LoadBalancer` Services).
2. **Failure Domain & Blast Radius** (e.g., Agar `ap-south-1a` down ho jaye ya RDS failover ho toh `apiserver` Pods ka kya hoga?).
3. **Database Connection Pool Math** (e.g., `HPA maxReplicas: 6` $\times$ Sequelize `pool.max: 5` = `30` connections vs `db.t4g.micro` `max_connections`).
4. **Honest Limitations & Next Evolution Steps** (e.g., Ephemeral `/app/images` storage aur `sampledb.sync()` vs Sequelize migrations).

---

## 2. Deep Architectural Trade-Offs in This Project

### Trade-Off 1: Single ALB Ingress (`target-type: ip`) vs `type: LoadBalancer` Services
- **Junior Approach**: `client-service` aur `apiserver-service` dono ko `type: LoadBalancer` bana dena $\to$ 2 alag AWS Load Balancers (`~\$36.80/month`), 2 alag DNS names, aur CORS issues.
- **Our Production Approach ([k8s/ingress.yaml](file:///d:/javascript_project/node-react-postgres/k8s/ingress.yaml))**: Dono Services ko `ClusterIP` rakha aur `alb.ingress.kubernetes.io/group.name: skills-platform-alb` ke saath ek single ALB se `/api` aur `/` route kiya. `target-type: ip` use karne se ALB traffic seedha Pod ENI IP par bhejta hai (extra `kube-proxy` NodePort hop bachta hai).

### Trade-Off 2: Sequelize Connection Pool vs HPA Scaling Math
- [apiserver/models/index.js](file:///d:/javascript_project/node-react-postgres/apiserver/models/index.js#L16-L21) mein `pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }` configured hai.
- [k8s/hpa.yaml](file:///d:/javascript_project/node-react-postgres/k8s/hpa.yaml#L12) mein `maxReplicas: 6` hai.
- **Capacity Math**: Peak scale par `6 Pods × 5 connections/Pod = 30 PostgreSQL connections`. RollingUpdate (`maxSurge: 1`) ke dauran `7 Pods × 5 = 35 connections`. `db.t4g.micro` (1 GB RAM) लगभग `~80–110 max_connections` support karta hai. Isliye `35 < 80` safe hai! Agar hum `maxReplicas: 30` kar dete (`150 connections`), toh RDS `FATAL: remaining connection slots are reserved` throw karta aur **Amazon RDS Proxy** ya **PgBouncer** lagana padta.

### Trade-Off 3: Zero-Downtime Database Migrations (Expand-and-Contract Pattern)
- RollingUpdate ke waqt `v1` Pod aur `v2` Pod dono ek hi `sampledb` database se connected hote hain.
- Agar `v2` kisi column ko rename ya drop kar de, toh `v1` Pods turant `500 Internal Server Error` dena shuru kar denge.
- **Safe 3-Step Pattern**: (1) **Expand**: Add nullable column in Migration 1 and deploy dual-writing code. (2) **Backfill**: Migrate existing rows. (3) **Contract**: Remove old column references in `v3` and drop the old column in Migration 2.
