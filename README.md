# Node React PostgreSQL — Full-Stack DevOps Project

A production-grade full-stack application (Express + React + PostgreSQL) with complete DevOps automation: Docker containerization, Kubernetes orchestration on EKS, CI/CD pipeline, SonarQube code quality, and comprehensive testing.

---

## Architecture Overview

```
Browser
  |
  ├── / (static files) ───────────────────────────────┐
  ├── /api/ (REST API calls) ───────┐                 │
  |                                 ▼                 ▼
  |                    ┌──────────────────────┐
  |                    │  nginx (reverse proxy)│
  |                    │  /api/ → apiserver    │
  |                    └──────┬───────────────┘
  |                           │
  |                           ▼
  |                    ┌──────────────────────┐
  |                    │  Express API Server   │
  |                    │  JWT Auth + CRUD      │
  |                    │  Port 8010            │
  |                    └──────┬───────────────┘
  |                           │
  |                           ▼
  |                    ┌──────────────────────┐
  |                    │  PostgreSQL 15        │
  |                    │  Sequelize ORM        │
  |                    └──────────────────────┘
```

### Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| **K8s Ingress** | Not used | Client nginx already handles routing (static files + /api/ proxy). LoadBalancer service is simpler and avoids ~$20/mo NLB cost |
| **Client routing** | nginx reverse proxy | Single public endpoint. nginx serves React SPA and proxies `/api/` to apiserver |
| **API exposure** | ClusterIP only | Apiserver is internal — never exposed directly to the internet |
| **DB_HOST** mismatch handled | Per-environment config | Docker Compose uses `db`, K8s uses `postgres-service` |

---

## Tech Stack

### Application
| Layer | Technology |
|---|---|
| Frontend | React 17, Ant Design, React Router 6 |
| Backend | Express 4, Sequelize ORM (PostgreSQL) |
| Auth | JWT + bcrypt + session encryption |
| Database | PostgreSQL 15 (Alpine) |

### DevOps & Infrastructure
| Category | Tools |
|---|---|
| Containerization | Docker, Docker Compose, Multi-stage builds |
| Orchestration | Kubernetes (EKS), Deployments + Services + PVC |
| CI/CD | GitHub Actions (test → build → push → deploy) |
| Code Quality | SonarQube (local), Jest coverage thresholds (50% min) |
| Load Testing | k6 (login + skills endpoints) |
| E2E Testing | Cypress (auth flows) |
| Monitoring | Prometheus + Grafana (planned) |

---

## Project Structure

```
node-react-postgres/
├── apiserver/                 # Express API server
│   ├── __tests__/             # Unit + Integration tests (43 tests)
│   ├── k6-tests/              # Load test scripts
│   ├── Dockerfile             # Multi-stage, node:18-slim, USER node
│   ├── jest.config.js         # Coverage thresholds
│   └── .config.env            # Environment variables
├── client/                    # React frontend
│   ├── src/__tests__/         # Component unit tests (19 tests)
│   ├── cypress/               # E2E tests
│   ├── Dockerfile             # Multi-stage build → nginx
│   └── nginx.conf             # Reverse proxy config
├── k8s/                       # Kubernetes manifests
│   ├── namespace.yaml
│   ├── configmap.yaml         # Non-sensitive env vars
│   ├── secret.yaml            # DB creds + JWT secret
│   ├── dbpvc.yaml             # PostgreSQL persistent storage
│   ├── dbdep.yaml             # PostgreSQL deployment
│   ├── dbsrc.yaml             # PostgreSQL ClusterIP service
│   ├── apidep.yaml            # API server deployment
│   ├── apisrc.yaml            # API server ClusterIP service
│   ├── clientdep.yaml         # Client deployment
│   └── clientsrc.yaml         # Client LoadBalancer service
├── docker-compose.yaml        # Local development orchestration
├── sonar-project.properties   # SonarQube analysis config
└── .github/workflows/         # CI/CD pipeline
```

---

## Docker Containerization

### Images
| Service | Base Image | Registry | Tag |
|---|---|---|---|
| apiserver | `node:18-slim` | Docker Hub `sahil9079/js-apiserver` | `v1.1.0` |
| client | `node:18-bullseye-slim` → `nginx:1.29-alpine` | Docker Hub `sahil9079/js-client` | `v1.1.0` |
| postgres | `postgres:15-alpine` | Docker Hub (official) | `latest` |

### Dockerfile Best Practices Applied
- **Multi-stage builds** — client Dockerfile separates build (Node) from runtime (nginx), minimizing final image size
- **`USER node`** — apiserver runs as non-root user for security
- **`.dockerignore`** — both services exclude `node_modules`, tests, build artifacts
- **`npm ci`** — deterministic installs (faster, uses lockfile)
- **`EXPOSE`** — documents intended ports (8010 for API, 80 for client)

### Docker Compose (`docker-compose up`)
```
docker-compose up -d    # Starts all 3 services
                        # db depends_on: service_healthy
                        # apiserver depends_on: db healthy
                        # client depends_on: apiserver
```

---

## Kubernetes Deployment (EKS)

### Service Architecture
```
Internet
  │
  ▼
[LoadBalancer] client-service (port 80)
  │
  ▼
[nginx] client pod
  ├── /         → serves React SPA
  └── /api/     → proxy_pass → apiserver-service:8010
                      │
                      ▼
            [ClusterIP] apiserver-service (port 8010)
                      │
                      ▼
            [ClusterIP] postgres-service (port 5432)
```

### Apply Order
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/                    # applies all manifests
```

### Resource Mapping (Docker Compose → K8s)
| Docker Compose | Kubernetes | Notes |
|---|---|---|
| `db` service | `dbdep.yaml` + `dbsrc.yaml` + `dbpvc.yaml` | Stateful deployment with persistent volume |
| `apiserver` service | `apidep.yaml` + `apisrc.yaml` | Stateless, env from ConfigMap + Secret |
| `client` service | `clientdep.yaml` + `clientsrc.yaml` | Stateless, nginx config baked into image |
| `env_file: .config.env` | `configmap.yaml` + `secret.yaml` | Separated by sensitivity |
| depends_on | Init containers (best effort — app retries on startup) | No native depends_on in K8s |

### Why LoadBalancer (Not Ingress)
- Client nginx already handles path-based routing (`/` vs `/api/`)
- No need for an Ingress controller
- AWS ALB created automatically with LoadBalancer service type (free tier eligible)
- Ingress would require NLB (~$20/month) with no architectural benefit

---

## Testing Strategy

| Test Type | Framework | Count | What It Covers |
|---|---|---|---|
| **Unit Tests** | Jest | 38 (API) + 19 (Client) = **57** | Utils, services, controllers, React components |
| **Integration Tests** | Jest + Supertest | 5 | Auth endpoints (signup, login, profile, refresh) |
| **E2E Tests** | Cypress | 1 spec | Full auth flow (signup → login → protected page) |
| **Load Tests** | k6 | 2 scripts | Login endpoint, Skills CRUD |
| **Coverage Threshold** | Jest | 50% min | Branches, functions, lines, statements |

### Running Tests
```bash
# API unit + integration
cd apiserver && npm test              # all 43 tests
cd apiserver && npm run test:unit      # unit only
cd apiserver && npm run test:integration # integration only
cd apiserver && npm run test:coverage   # with coverage

# Client unit
cd client && npm test                 # all 19 tests
cd client && npm run test:coverage     # with coverage

# E2E
cd client && npx cypress run

# Load tests
cd apiserver && k6 run k6-tests/login.js
cd apiserver && k6 run k6-tests/skills.js
```

---

## Code Quality (SonarQube)

Local SonarQube server (`sonarqube:lts-community`) analyzes both `apiserver/` and `client/src/`.

### Configuration
```properties
sonar.projectKey=node-react-postgres
sonar.sources=apiserver,client/src
sonar.tests=apiserver/__tests__,client/src/__tests__
sonar.javascript.lcov.reportPaths=client/coverage/lcov.info,apiserver/coverage/lcov.info
sonar.test.inclusions=**/*.test.js,**/*.test.jsx
```

### Run Analysis
```bash
# Start SonarQube
docker run -d --name sonarqube \
  -p 9000:9000 \
  -v sonarqube_data:/opt/sonarqube/data \
  sonarqube:lts-community

# Run scanner (from project root)
sonar-scanner -Dsonar.token=$SONAR_TOKEN -Dsonar.host.url=http://localhost:9000
```

---

## CI/CD Pipeline (GitHub Actions)

### Workflow Stages
```
[Push/Tag] → [Test] → [SonarQube] → [Build] → [Push to Docker Hub] → [Deploy to EKS]
```

| Stage | Tools | Details |
|---|---|---|
| **1. Test** | Jest + Cypress | Run all unit/integration/E2E tests |
| **2. Quality Gate** | SonarQube | Enforce coverage thresholds, detect code smells |
| **3. Build** | Docker | Build api + client images |
| **4. Push** | Docker Hub | Push to `sahil9079/js-apiserver` and `sahil9079/js-client` |
| **5. Deploy** | kubectl | Apply K8s manifests to EKS cluster |

*Note: Security scanning (npm audit, Trivy) deferred — existing vulnerabilities are in devDependencies only.*

---

## Infrastructure as Code (Planned)

| Phase | Tool | What |
|---|---|---|
| Cluster Setup | `eksctl` | EKS with 2x t3.medium nodes |
| GitOps (Future) | ArgoCD | Sync K8s state from Git |
| IaC (Future) | Terraform | VPC, subnets, EKS cluster as code |

---

## Security Practices

- **Non-root containers** — `USER node` in apiserver Dockerfile
- **Secrets separation** — DB credentials and JWT secret stored as K8s `Secret` (base64 encoded, env var injection)
- **Config separation** — Non-sensitive config in `ConfigMap`
- **`.dockerignore`** — prevents accidental inclusion of secrets, test files, or build artifacts in images
- **`.gitignore`** — `apiserver/.config.env` excluded from version control (contains plaintext secrets for local dev only)
- **Helmet middleware** — Express security headers (XSS, content-type sniffing, etc.)

---

## Local Development

### Prerequisites
- Node.js 18+, Docker, kubectl, eksctl

### Quick Start
```bash
# 1. Install dependencies
cd apiserver && npm install
cd ../client && npm install

# 2. Set up environment
cp apiserver/example.env apiserver/.config.env
# Edit .config.env with your DB credentials

# 3. Run with Docker Compose
docker-compose up -d

# 4. Run locally (without Docker)
cd apiserver && node index.js    # API on :8010
cd client && npm start           # React on :3000
```

---

## What I Learned

Building this project from scratch as a DevOps engineer:

| Concept | Takeaway |
|---|---|
| **Container to K8s mapping** | Every Docker Compose service maps to a K8s Deployment + Service. Volumes become PVCs. `env_file` splits into ConfigMap + Secret. |
| **LoadBalancer vs Ingress** | Ingress isn't always better. When your app's nginx already handles routing, LoadBalancer is simpler and cheaper. |
| **Secrets management** | Never commit secrets. `.gitignore` local `.env` files. K8s Secrets for production. |
| **Jest version pitfalls** | Old Jest (v25) can't handle `node:` protocol imports. Upgrading to Jest 29 fixed everything. |
| **SonarQube vs SonarCloud** | Local SonarQube avoids corporate network issues with JRE provisioning. Same analysis, no cloud dependency. |
| **Testing pyramid** | 57 unit + 5 integration + E2E + k6 load tests = confidence across all layers. |
| **Test-driven infrastructure** | Write tests first (developer), then build pipeline (DevOps) that runs them. Never deploy untested code. |

---

## License

ISC
