# 07. Project Explanation — FullStack-DevOps-Pipeline

> **Use this file to explain your project in interviews.** Memorize the "30-second pitch", then use the deep-dive sections for follow-up questions. Always anchor answers in what YOU built.

---

## 1. 30-Second Elevator Pitch (memorize this)

> "I built the complete DevOps lifecycle for a 3-tier web application — a Node.js/Express API, React frontend, and PostgreSQL database. I containerized it with Docker using multi-stage builds, orchestrated it on Kubernetes with 10 manifests, designed a GitHub Actions CI/CD pipeline that runs 62 Jest tests with a 50% coverage gate and SonarQube quality analysis, and applied security best practices like non-root containers and secrets management. The whole thing goes from code commit to a deployed LoadBalancer service that serves the React app and reverse-proxies API calls."

---

## 2. Architecture at a Glance

```
Browser
  │
  ├── / (static files)
  └── /api/ (REST calls)
       │
       ▼
┌──────────────────────────────┐
│ client pod — nginx           │
│  /  → /usr/share/nginx/html  │   ← serves React build
│  /api/ → proxy_pass apiserver│   ← reverse proxy
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ apiserver pod — Express      │
│ JWT auth · skills CRUD       │
│ port 8010                    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ postgres pod — PostgreSQL 15 │
│ port 5432                    │
└──────────────────────────────┘
```

**Key point:** The client (nginx) is the **only public entry point**. Everything else is internal ClusterIP.

---

## 3. The 10 Kubernetes Manifests (know each one)

| # | File | Kind | Purpose |
|---|---|---|---|
| 1 | `namespace.yaml` | Namespace | Scoped `node-react-app` — isolation for all resources |
| 2 | `configmap.yaml` | ConfigMap | Non-sensitive env vars (NODE_ENV, PORT_DEV, API_VERSION, DB_HOST, DB_PORT, DB_NAME) |
| 3 | `secret.yaml` | Secret | Sensitive: DB_USER, DB_PASS, JWT_SECRET (base64) |
| 4 | `dbpvc.yaml` | PersistentVolumeClaim | 3Gi storage for PostgreSQL (data survives pod restarts) |
| 5 | `dbdep.yaml` | Deployment | postgres:15-alpine, mounts PVC, env from Secret |
| 6 | `dbsrc.yaml` | Service (ClusterIP) | Exposes postgres internally on port 5432 |
| 7 | `apidep.yaml` | Deployment | apiserver, `envFrom` ConfigMap + Secret, port 8010 |
| 8 | `apisrc.yaml` | Service (ClusterIP) | Exposes apiserver internally |
| 9 | `clientdep.yaml` | Deployment | client image, port 80 |
| 10 | `clientsrc.yaml` | Service (**LoadBalancer**) | Only public entry point → AWS ALB |

### Why ConfigMap + Secret split?
- **ConfigMap** — visible, non-sensitive (everyone can read it)
- **Secret** — base64 (minimal obfuscation; should be KMS-encrypted at rest) — holds credentials
- **Injection:** `envFrom: configMapRef` + `secretRef` → all keys become env vars
- **Why not one file?** Separation of concerns — devs can see config, only operators manage secrets

### Why LoadBalancer (not Ingress)? ← YOUR signature decision
- Client nginx already handles **all routing** (static files + `/api/` proxy)
- A `LoadBalancer` Service just makes nginx reachable → AWS auto-creates an ALB
- Ingress would add an NLB (~$20/mo) + Ingress Controller for **zero benefit** — nginx already routes
- Ingress is justified when: multiple backends need path-based routing, or you need free SSL via ACM
- **Answer format:** "I evaluated Ingress but chose LoadBalancer because X. I'd add Ingress when Y."

### Deployment label chain (know this — it connects everything)
```yaml
# Deployment selects pods by label
selector: { matchLabels: { app: client-app } }
template: { metadata: { labels: { app: client-app } } }   # pods get this label

# Service routes to pods with matching label
service.spec.selector: { app: client-app }
```
- Deployment uses labels to **manage** its pods (scaling, rolling update)
- Service uses labels to **route** traffic to pods
- Mismatch = broken — service finds no pods, or deployment rejects the spec

---

## 4. Docker Details (be specific)

### apiserver/Dockerfile
```dockerfile
FROM node:18-slim          # smaller attack surface than bullseye
WORKDIR /app
COPY package*.json ./      # copy manifests FIRST to leverage layer caching
RUN npm ci                 # deterministic install from lockfile
COPY . .                   # then copy app code
USER node                  # non-root — security best practice
EXPOSE 8010
CMD ["node", "index.js"]
```

### client/Dockerfile (multi-stage — YOUR talking point)
```dockerfile
# STAGE 1: build
FROM node:18-bullseye-slim AS Builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build          # creates /app/build

# STAGE 2: runtime
FROM nginx:1.29-alpine     # final image is nginx only
COPY --from=Builder /app/build /usr/share/nginx/html
RUN rm -rf /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Why multi-stage? (answer with numbers)
- **Without:** Node image ~1GB → React app served by Node (slow, huge)
- **With:** nginx alpine ~23MB final image — build tools and node_modules never ship
- Benefit: smaller pull time, less attack surface, faster deploys

### nginx.conf (explain each line)
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;      # React static files live here
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;   # SPA fallback → always serve index.html
    }
    location /api/ {
        proxy_pass http://apiserver:8010/;  # reverse proxy to API
    }
}
```
- `try_files ... /index.html` → React Router works on refresh (no 404 on deep links)
- `/api/` prefix stripped by `proxy_pass` with trailing `/`
- **Docker Compose:** `apiserver` (service name); **K8s:** would be `apiserver-service` — DNS names differ

### docker-compose.yaml (understand it fully)
```yaml
db:
  image: postgres:15-alpine
  healthcheck: pg_isready -U postgres -d sampledb   # app waits for REAL readiness
  volumes: dbdata:/var/lib/postgresql/data

apiserver:
  build: ./apiserver
  env_file: ./apiserver/.config.env
  depends_on:
    db: { condition: service_healthy }    # only start when DB is healthy

client:
  build: ./client
  depends_on: [apiserver]
```
- `depends_on` + healthcheck solves **startup ordering** in Docker
- In K8s there's no `depends_on` → solved with initContainers or readiness/startup probes (be ready to say this)

### Docker → K8s mapping table (interview favorite)
| Docker Compose | Kubernetes |
|---|---|
| service (db) | Deployment + Service |
| volumes | PersistentVolumeClaim |
| env_file | ConfigMap + Secret |
| depends_on | initContainer / startup probe |
| exposed ports | Service port/targetPort |
| networks | (default) same namespace DNS |

---

## 5. CI/CD Design (your pipeline)

```
[git push] → [Test: 62 Jest tests] → [SonarQube quality gate]
          → [Build Docker images] → [Push to Docker Hub]
          → [Deploy to EKS: kubectl set image]
```

| Stage | Tool | Blocks deploy if... |
|---|---|---|
| Test | Jest (unit + integration) | any test fails |
| Quality | SonarQube scanner | coverage < 50% or gate fails |
| Build | Docker | build error |
| Push | Docker Hub | auth/push error |
| Deploy | kubectl / helm | rollout fails |

### Enforcing quality gates (tie to your project)
- **Coverage threshold:** `jest.config.js` → `coverageThreshold: { global: { branches: 50, functions: 50, lines: 50, statements: 50 } }`
- **CI behavior:** run `npm run test:coverage` → CI fails if threshold not met → merge blocked
- **SonarQube:** `sonar-project.properties` defines sources/tests; scanner uploads report; **Quality Gate** (default: bugs=0, coverage rules) → scanner exits non-zero on fail → pipeline stops

### GitHub Actions authentication to AWS (be ready)
- **Never** put long-lived AWS keys in GitHub Secrets for prod
- **Best:** OIDC federation — GitHub assumes an IAM role via OIDC token (no keys stored)
- Steps: configure IAM IdP (GitHub OIDC) → IAM role with trust policy → `aws-actions/configure-aws-credentials@v4` with `role-to-assume`
- Alternative (older/simpler): `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` in GitHub Secrets

---

## 6. Testing in Your Project

| Layer | Count | Tool | What it covers |
|---|---|---|---|
| Unit | 57 (38 API + 19 client) | Jest | utils, services, controllers, React components |
| Integration | 5 | Jest + Supertest | signup → login → profile → token refresh |

### Notable test setup choices (show depth)
- `jest.config.js` → `setupFiles: ['./__tests__/setup.js']` sets env vars + mocks before tests
- **Troubleshooting story:** Jest v25 couldn't parse `node:` protocol imports (from `sharp`/`formidable`) → upgraded to **Jest 29** fixed it; also needed `supertest@6` and `uuid@9` (ESM/CJS compat)
- `client/src/setupTests.js` → matchMedia polyfill, jest-dom, localStorage mock (jsdom quirks)

---

## 7. Troubleshooting Stories (interview gold — be ready to tell these)

### Story 1: Jest v25 `node:` protocol failure
- **Symptom:** tests fail importing modules using `require('node:fs')`
- **Root cause:** Jest 25 didn't support `node:` protocol prefix
- **Fix:** upgraded `jest@^29.7.0` — solved all 3 related issues at once
- **Lesson:** sometimes upgrade is the fix, not a workaround

### Story 2: SonarQube "Not authorized"
- **Symptom:** scanner returns unauthorized with valid token
- **Root cause (investigated):** container had no volume mount → data lost on restart; project/token state inconsistent
- **Fix path:** recreate container WITH `-v sonarqube_data` + `-v sonarqube_extensions`, recreate project, generate fresh token
- **Lesson:** stateful tools need persistent storage even in dev

### Story 3: ConfigMap DB_HOST mismatch
- Docker Compose service name is `db`; K8s Service is `postgres-service`
- **Fix:** per-environment config (`DB_HOST` differs), not a shared file

---

## 8. Answers to Likely "Project" Interview Questions

**Q: What was your role in the project?**
> I was the DevOps engineer. I took an existing application and built the entire infrastructure — Dockerfiles, docker-compose, Kubernetes manifests, CI/CD pipeline design, and code quality integration.

**Q: What was the hardest problem you solved?**
> Debugging the Jest 25 incompatibility with modern Node module resolution, and setting up SonarQube with local infrastructure to avoid cloud provisioning errors. (Pick one, tell the story from section 7.)

**Q: What would you do differently / next?**
> Add: Helm charts, ArgoCD GitOps, Terraform for the EKS cluster, Prometheus/Grafana monitoring, Trivy container scanning, and make the K8s nginx config a ConfigMap for zero-rebuild config changes.

**Q: Why LoadBalancer and not Ingress?**
> Because the client's nginx already does all the routing — serving static files and proxying /api/. A LoadBalancer simply exposes it. Ingress would add an NLB (~$20/mo) and a controller for no benefit. I'd use Ingress when I need multiple services on one LB, path-based routing at the LB, or free ACM SSL.

**Q: How would you scale this to production?**
> More replicas + HPA, DB as a managed service (RDS) or StatefulSet, secrets via External Secrets + KMS, add monitoring, add Trivy + SAST, add Terraform for cluster, GitOps with ArgoCD.

---

*Next: read [01-cicd.md](01-cicd.md) for the CI/CD interview questions.*
