# Level 2: Architectural Decisions & Trade-Offs

> **Experience Target:** 2-Year Mid-Level DevOps Engineer  
> **Topic Scope:** Defending project choices, Ingress vs LoadBalancer, ConfigMap vs Secret separation, baked vs dynamic Nginx configuration, Docker Compose vs Kubernetes mapping.

---

## 1. Decision: `type: LoadBalancer` vs. Kubernetes Ingress Controller

### Q1. Why did you choose `type: LoadBalancer` over Ingress for your React client?
* **Architecture Context:**
  * The React frontend is served by an **Nginx 1.29 container** (`my-app-deployment`).
  * In [`client/nginx.conf`](file:///d:/javascript_project/node-react-postgres/client/nginx.conf), Nginx already handles:
    1. Serving static React SPA files on `/`.
    2. Reverse-proxying `/api/` requests to `http://apiserver-service:8010/`.
* **The Trade-Off Analysis:**
  * **Option A (Current - `type: LoadBalancer`):** AWS provisions an Application Load Balancer directly exposing port 80 to the client pod. Simple, zero extra controllers to maintain, and avoids duplicate proxy layers.
  * **Option B (Ingress Resource + AWS ALB Ingress Controller):** Requires installing the AWS Load Balancer Controller, creating IAM OIDC service accounts, and provisioning an AWS ALB that routes `/` to Nginx and `/api/` to Express.
* **Why LoadBalancer was chosen:**
  * Because Nginx is already acting as the reverse proxy inside the pod, adding an Ingress controller on top creates **double proxying** for zero architectural benefit.
* **When I WOULD switch to Ingress:**
  1. When splitting the backend into microservices (e.g. `/api/auth`, `/api/skills`, `/api/billing`) where routing should happen at the cloud load balancer level.
  2. When managing centralized SSL certificates with AWS Certificate Manager (ACM).
  3. When routing multiple domain names through a single shared AWS ALB.

---

## 2. Decision: Baked Nginx Config vs. ConfigMap Volume Mount

### Q1. Why did you bake `nginx.conf` into the Docker image instead of mounting via ConfigMap?
* **Current Implementation ([`client/Dockerfile`](file:///d:/javascript_project/node-react-postgres/client/Dockerfile#L11)):**
  ```dockerfile
  COPY nginx.conf /etc/nginx/conf.d/default.conf
  ```
* **Trade-Off Matrix:**

| Approach | Advantages | Disadvantages |
| :--- | :--- | :--- |
| **Baked into Image (Current)** | Immutability, simple deployment, guarantees identical config in staging and production. | Changing proxy rules requires rebuilding and pushing a new Docker image. |
| **ConfigMap Mount** | Modify proxy rules or upstream DNS dynamically without rebuilding container images. | Adds Kubernetes coupling; config changes require pod rolling restarts to reload Nginx. |

---

## 3. Decision: Secrets Management (ConfigMap vs. K8s Secret)

### Q1. How did you separate sensitive vs non-sensitive data?
* **Non-Sensitive (ConfigMap):** `NODE_ENV`, `PORT_DEV`, `API_VERSION`, `DB_HOST`, `DB_PORT`, `DB_NAME`.
* **Sensitive (Secret):** `username`, `password`, `JWT_SECRET`.
* **Why the Split Matters:**
  1. **RBAC Isolation:** Developers can view ConfigMaps to inspect application endpoints without having access to database passwords or token signing keys.
  2. **Security Compliance:** Kubernetes Secrets can be encrypted at rest using **AWS KMS Envelope Encryption**, whereas ConfigMaps are stored in plaintext in etcd.
