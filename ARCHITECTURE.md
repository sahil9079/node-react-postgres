# Architecture Decision Record

This document captures the architecture decisions, tradeoffs, and reasoning behind the DevOps infrastructure for this project.

---

## 1. Container Orchestration: Docker Compose → Kubernetes

### Decision
Use Docker Compose for local development, Kubernetes (EKS) for production deployment.

### Rationale
| Environment | Orchestrator | Why |
|---|---|---|
| Local dev | Docker Compose | Fast feedback loop, single-machine, easy debugging |
| Production | EKS | Auto-scaling, self-healing, rolling updates, cloud-native |

### Mapping: Docker Compose → K8s

```
docker-compose.yaml                    k8s/
                                   
services.db              ──►  dbdep.yaml (Deployment)
  image                       dbsrc.yaml (Service)
  ports                       dbpvc.yaml (PersistentVolumeClaim)
  environment                 
  volumes                     
  healthcheck                 
                                   
services.apiserver         ──►  apidep.yaml (Deployment)
  build                       apisrc.yaml (Service)
  env_file                    
  depends_on                  
  ports                       
                                   
services.client            ──►  clientdep.yaml (Deployment)
  build                       clientsrc.yaml (Service)
  ports                       
  depends_on                  
                                   
volumes.dbdata             ──►  dbpvc.yaml
                                   
env_file (.config.env)     ──►  configmap.yaml (non-sensitive)
                                 secret.yaml (sensitive)
```

### Why not ECS/Fargate?
EKS was chosen because:
- Kubernetes is the industry standard — skills transfer across any cloud
- Full control over pod networking, security policies, and scaling
- Same manifests work on-prem (kubeadm), local (Kind), or cloud (EKS/AKS/GKE)

---

## 2. Client Traffic Routing: LoadBalancer vs Ingress

### Decision
Use `type: LoadBalancer` on the client service. Do NOT use a K8s Ingress resource.

### Architecture Flow
```
Browser
  │
  ▼
AWS ALB (created by LoadBalancer)
  │
  ▼
client pod (nginx)
  ├── /  →  /usr/share/nginx/html/*  (React SPA)
  └── /api/  →  proxy_pass http://apiserver-service:8010/
                    │
                    ▼
              apiserver pod
```

### Why not Ingress?

| Factor | LoadBalancer | Ingress + NLB |
|---|---|---|
| Complexity | 1 Service manifest | Ingress resource + Ingress Controller + cert manager |
| Cost | Free tier eligible (ALB) | NLB ~$20/month |
| Routing | Handled by nginx in pod | Handled at AWS level |
| SSL | Self-managed (or ACM via annotation) | ACM integration |
| Fit | ✅ Perfect for single-service app | Overkill for this architecture |

### The key insight
The client's nginx already handles **both** serving static files AND proxying `/api/` requests. Adding Ingress between the user and nginx would be an unnecessary layer. The LoadBalancer simply makes nginx reachable from the internet.

### What would change with Ingress
```
Browser
  │
  ├── /  ──────────────────────────────►  client-service (ClusterIP)  ──►  client pod
  │
  └── /api/  ──►  Ingress (NLB)  ──►  apiserver-service (ClusterIP)  ──►  apiserver pod
```
The ingress would split traffic at the load balancer level, removing the proxy job from client nginx. This is useful when:
- You have multiple services to route to
- You need free SSL via ACM
- You run multiple domains

None of these apply here — so LoadBalancer is correct.

---

## 3. nginx Configuration Strategy: Bake vs Inject

### Decision
Bake `nginx.conf` into the Docker image at build time. Do NOT use a K8s ConfigMap volume mount.

### Tradeoff Analysis

| Approach | Pros | Cons |
|---|---|---|
| **Baked in** (current) | Simple, no K8s config needed, consistent image | Config change = rebuild image |
| **ConfigMap mount** | Change proxy settings without rebuild | More K8s YAML, adds coupling |

### Current approach
```dockerfile
# client/Dockerfile
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

### When to switch to ConfigMap
If the proxy destination (`apiserver-service:8010`) changes between environments, you'd need different images or a ConfigMap. Since we already have per-environment Docker Compose (`apiserver:8010`) vs K8s (`apiserver-service:8010`), maintaining separate `nginx.conf` files is a valid tradeoff for simplicity.

---

## 4. Environment Variables: Docker Compose vs K8s

### Decision
Docker Compose uses a single `env_file`. K8s splits into ConfigMap + Secret.

### The split
```
.config.env (all plaintext)
│
├── NODE_ENV         ──►  ConfigMap  (not sensitive)
├── PORT_DEV         ──►  ConfigMap
├── API_VERSION      ──►  ConfigMap
├── DB_HOST          ──►  ConfigMap
├── DB_PORT          ──►  ConfigMap
├── DB_NAME          ──►  ConfigMap
│
├── DB_USER          ──►  Secret     (sensitive)
├── DB_PASS          ──►  Secret
└── JWT_SECRET       ──►  Secret
```

### Why the split
- **ConfigMap** values are visible to anyone with cluster access — fine for non-sensitive data
- **Secret** values are base64-encoded and can be encrypted at rest (KMS) — required for credentials
- **Separation of concerns** — developers see config, operators manage secrets

### Injection in K8s
```yaml
envFrom:
  - configMapRef:
      name: configmap         # All ConfigMap keys become env vars
  - secretRef:
      name: my-secret          # All Secret keys become env vars
```

---

## 5. Database Hostname: The Per-Environment Problem

### Problem
Docker Compose names the postgres service `db`, and the apiserver connects to `DB_HOST=db`. In K8s, the service is named `postgres-service`.

### Current solution
Per-environment `configmap.yaml`:
```yaml
DB_HOST: "postgres-service"   # K8s
```
vs `.config.env`:
```
DB_HOST=db                    # Docker Compose
```

### Alternative considered
Rename both to the same value — but then either Docker Compose (`db`) or K8s (`postgres-service`) would have a misleading name. Per-environment config is the pragmatic choice.

---

## 6. Testing Strategy

### Decision
Multiple testing layers, each serving a specific purpose:

```
         ╱  Unit (57)  — Fast, isolated, catch logic errors
Testing ╱   Integration (5)  — API contract validation
        ╲   E2E (Cypress)  — User flow simulation
         ╲  Load (k6)  — Performance under concurrency
```

### Coverage Thresholds (Jest)
```javascript
coverageThreshold: {
  global: {
    branches: 50,
    functions: 50,
    lines: 50,
    statements: 50,
  },
}
```
- 50% is a baseline — prevents untested code from being merged
- Focused on **utils, services, controllers** — the core business logic
- Tests for non-root user (`USER node`) in Dockerfiles are NOT automated yet

---

## 7. Code Quality: SonarQube

### Decision
Run SonarQube locally (Docker container) instead of SonarCloud.

### Why local SonarQube
| Factor | SonarQube (local) | SonarCloud |
|---|---|---|
| Setup | `docker run sonarqube` | GitHub OAuth |
| Network dependency | None (localhost) | Requires internet |
| JRE provisioning | Works | 403 errors on corporate network (sonar-scanner 6.x) |
| Token auth | Token generated from local UI | GitHub token |
| Cost | Free | Free for public repos |

### Current blocker
SonarQube scanner returns "Not authorized" despite valid token. Likely causes:
- Container lacks volume mount — data lost on restart
- Project needs to be re-created on fresh container
- Token scope mismatch

### Resolution plan
```bash
docker rm sonarqube
docker run -d --name sonarqube \
  -p 9000:9000 \
  -v sonarqube_data:/opt/sonarqube/data \
  -v sonarqube_extensions:/opt/sonarqube/extensions \
  sonarqube:lts-community
# Re-create project, generate token, re-run scanner
```

---

## 8. CI/CD Pipeline Design

### Decision
GitHub Actions for CI/CD pipeline with stages: Test → Quality → Build → Push → Deploy.

### Why GitHub Actions (not Jenkins)
| Factor | GitHub Actions | Jenkins |
|---|---|---|
| Setup | Zero infrastructure | Server + plugins |
| GitHub integration | Native | Webhook |
| Cost | Free for public repos | Self-hosted server cost |
| Pipeline as Code | YAML in `.github/workflows/` | Jenkinsfile (Groovy) |
| Target audience | Personal project | Enterprise |

### Pipeline stages
```
[git push]
    │
    ▼
┌─────────────────────────────────────────────┐
│ 1. Install dependencies                     │
│    cd apiserver && npm ci                    │
│    cd client && npm ci                       │
└─────────────────┬───────────────────────────┘
                  ▼
┌─────────────────────────────────────────────┐
│ 2. Run tests                                │
│    apiserver: npm test (unit + integration) │
│    client: npm test (React components)      │
│    Coverage reports generated               │
└─────────────────┬───────────────────────────┘
                  ▼
┌─────────────────────────────────────────────┐
│ 3. SonarQube analysis                       │
│    sonar-scanner -Dsonar.token=${{ secrets. │
│      SONAR_TOKEN }}                         │
│    Quality gate must pass                   │
└─────────────────┬───────────────────────────┘
                  ▼
┌─────────────────────────────────────────────┐
│ 4. Build Docker images                      │
│    docker build -t sahil9079/js-apiserver   │
│    docker build -t sahil9079/js-client      │
└─────────────────┬───────────────────────────┘
                  ▼
┌─────────────────────────────────────────────┐
│ 5. Push to Docker Hub                       │
│    docker push sahil9079/js-apiserver:tag   │
│    docker push sahil9079/js-client:tag      │
└─────────────────┬───────────────────────────┘
                  ▼
┌─────────────────────────────────────────────┐
│ 6. Deploy to EKS                            │
│    kubectl set image deployment/apiserver   │
│    kubectl set image deployment/client      │
└─────────────────────────────────────────────┘
```

### Security scanning decision
`npm audit` and Trivy are **skipped for now**:
- Client has 39 vulnerabilities (4 low, 26 moderate, 9 high)
- All in **devDependencies** (Jest, webpack, react-scripts) — not in production code
- Acceptable risk for a learning project
- Will add when pipeline is green

---

## 9. Docker Security Practices

### Applied
| Practice | Where | Why |
|---|---|---|
| `USER node` | apiserver/Dockerfile:6 | Non-root reduces blast radius |
| `node:18-slim` | apiserver base image | Smaller attack surface than `bullseye` |
| `.dockerignore` | Both services | Prevents secrets, tests, node_modules from entering image |
| `npm ci` | Both Dockerfiles | Deterministic, respects lockfile |

### Not yet applied (planned)
| Practice | Planned for |
|---|---|
| `HEALTHCHECK` | Both Dockerfiles |
| `USER nginx` | client/Dockerfile (nginx stage) |
| `COPY --chown` | client/Dockerfile |
| Read-only root filesystem | K8s pod security context |

---

## 10. Known Issues & Tech Debt

| Issue | Impact | Resolution |
|---|---|---|
| `DB_HOST` mismatch | Different values for Docker vs K8s | Per-environment config — acceptable |
| nginx `proxy_pass` | Same — `apiserver` vs `apiserver-service` | Docker vs K8s DNS naming — acceptable |
| SonarQube auth | Blocked analysis | Recreate container with volume mount |
| No depends_on in K8s | Apiserver may crash-loop until postgres is ready | Add initContainer or startup probe |
| npm audit vulns | 39 in client devDependencies | Acceptable risk — defer until pipeline is green |

---

## 11. Future Roadmap

| Phase | What | Status |
|---|---|---|
| 1 | Docker hardening (HEALTHCHECK, USER nginx) | Planned |
| 2 | Fix SonarQube auth | Blocked |
| 3 | Create K8s manifests | ✅ Done (with known fixes) |
| 4 | Create CI/CD pipeline (GitHub Actions) | Planned |
| 5 | Create EKS cluster (eksctl) | Planned |
| 6 | Deploy to EKS | Planned |
| 7 | Prometheus + Grafana monitoring | Planned |
| 8 | ArgoCD GitOps | Future |
| 9 | Terraform IaC | Future |

---

*This document evolves with the project. Update it when architecture decisions change.*
