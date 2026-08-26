# Level 2: Complete Network & Request Flow Analysis

> **Experience Target:** 2-Year Mid-Level DevOps Engineer  
> **Topic Scope:** End-to-end packet flow, AWS ALB routing, Kube-Proxy iptables/IPVS, CoreDNS cluster resolution, Nginx reverse proxying, Sequelize ORM database pooling.

---

## 1. End-to-End Request Flow Walkthrough

Interviewers often ask: **"Explain the complete request lifecycle from the moment a user clicks a button to the database query and back."**

```
┌──────────┐      1. HTTP POST /api/v1/auth/login       ┌────────────────────────┐
│ User     │ ─────────────────────────────────────────► │ AWS Application        │
│ Browser  │ ◄───────────────────────────────────────── │ Load Balancer (Port 80)│
└──────────┘      8. HTTP 200 OK + JWT Cookie           └───────────┬────────────┘
                                                                    │
                                                           2. NodePort:3xxxx
                                                                    ▼
                                                        ┌────────────────────────┐
                                                        │ Kube-Proxy (iptables)  │
                                                        └───────────┬────────────┘
                                                                    │
                                                           3. Virtual ClusterIP
                                                                    ▼
                                                        ┌────────────────────────┐
                                                        │ Client Pod (Nginx:80)  │
                                                        │ - proxy_pass /api/     │
                                                        └───────────┬────────────┘
                                                                    │
                                                           4. TCP to apiserver:8010
                                                                    ▼
                                                        ┌────────────────────────┐
                                                        │ CoreDNS Resolution     │
                                                        │ apiserver-service      │
                                                        └───────────┬────────────┘
                                                                    │
                                                           5. Load Balanced Pod
                                                                    ▼
                                                        ┌────────────────────────┐
                                                        │ Apiserver Pod (Node:18)│
                                                        │ - JWT / bcrypt / route │
                                                        └───────────┬────────────┘
                                                                    │
                                                           6. Sequelize Connection
                                                                    ▼
                                                        ┌────────────────────────┐
                                                        │ PostgreSQL Pod (:5432) │
                                                        │ - Read/Write EBS gp3   │
                                                        └────────────────────────┘
```

---

## 2. Step-by-Step Flow Explanation

1. **Browser Request Generation:**
   * User navigates to `http://<ALB_DNS>/login` and submits credentials. The React SPA sends an asynchronous `POST` request to `/api/v1/auth/login`.
2. **AWS Load Balancer Ingestion:**
   * The AWS ALB (provisioned by `clientsrc.yaml`) listens on Port 80, checks target health, and forwards the TCP packet to the NodePort allocated on one of the EKS worker nodes.
3. **Kube-Proxy & iptables NAT:**
   * The Linux kernel on the worker node uses `iptables` / IPVS packet filtering rules managed by `kube-proxy` to translate the destination IP from the NodePort to the private IP of the `my-app-deployment` client pod.
4. **Nginx Reverse Proxy Inspection:**
   * Nginx receives the request on port 80.
   * `location /api/` matches the URI.
   * Nginx executes `proxy_pass http://apiserver-service:8010/` to forward the payload internally.
5. **CoreDNS Service Discovery:**
   * CoreDNS inside the EKS cluster intercepts the hostname `apiserver-service.node-react-app.svc.cluster.local` and resolves it to the virtual ClusterIP (`10.100.x.x`).
6. **Backend Processing & Authentication:**
   * Kube-proxy distributes the request across active `apiserver` pods.
   * Express middleware executes: `cookieParser`, `helmet` security headers, `express.json()` body parser, and routes the payload to `authController.login`.
   * Bcrypt validates the hashed password.
7. **Database Persistence:**
   * Sequelize connects over TCP to `postgres-service:5432`.
   * PostgreSQL executes the SQL `SELECT * FROM users WHERE email = ?` against the mounted 3Gi AWS EBS gp3 volume (`db-pvc`).
8. **Return Response:**
   * The database returns the user record $\to$ Express signs the JWT token $\to$ Nginx forwards the payload $\to$ AWS ALB sends HTTP 200 with `Set-Cookie` header to the user's browser.
