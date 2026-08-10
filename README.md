# FullStack-DevOps-Pipeline

A production-grade full-stack web application with complete DevOps automation. The application itself is a **Skills Management Platform** built with Express, React, and PostgreSQL — featuring JWT authentication, CRUD operations, file upload, and session management.

The DevOps layer includes Docker multi-stage containerization, Kubernetes orchestration for EKS, a GitHub Actions CI/CD pipeline, SonarQube code quality analysis with coverage-gated testing, and infrastructure-as-code planning. Every piece of the pipeline is built from scratch — no copy-paste tutorials.

---

## Project Overview

### What the application does
A full-stack Skills Management platform where users can sign up, log in, and manage their professional skills portfolio. Users can create, read, update, and delete skills, upload profile images, and manage their session securely. The frontend is a React SPA with Ant Design components; the backend is a RESTful Express API with Sequelize ORM connecting to PostgreSQL.

### What the DevOps pipeline does
Takes that application and containerizes it, orchestrates it on Kubernetes, runs automated tests at every commit, enforces code quality gates via SonarQube, builds and pushes Docker images to a registry, and deploys to an EKS cluster — all automated through GitHub Actions.

---

## Architecture

```
Browser
  |
  ├── / (static files) ───────────────────────────────┐
  ├── /api/ (REST API calls) ───────┐                 │
  |                                 ▼                 ▼
  |                    ┌──────────────────────────────────┐
  |                    │  nginx (reverse proxy)            │
  |                    │  / → React SPA (index.html)       │
  |                    │  /api/ → proxy_pass to apiserver  │
  |                    └──────────────┬───────────────────┘
  |                                   │
  |                                   ▼
  |                    ┌──────────────────────────────────┐
  |                    │  Express API Server (Node.js)     │
  |                    │  JWT Auth · Skills CRUD           │
  |                    │  File Upload · Session Mgmt       │
  |                    │  Port 8010                        │
  |                    └──────────────┬───────────────────┘
  |                                   │
  |                                   ▼
  |                    ┌──────────────────────────────────┐
  |                    │  PostgreSQL 15 (Alpine)           │
  |                    │  Sequelize ORM                    │
  |                    │  Sampledb database                │
  |                    └──────────────────────────────────┘
```

### Key Architecture Decisions

| Decision | Choice | Why |
|---|---|---|
| **K8s Ingress** | Not used | Client nginx already handles all routing. LoadBalancer alone is simpler and avoids $20/mo NLB cost |
| **Client routing** | nginx reverse proxy | Single public endpoint — nginx serves React AND proxies `/api/` to the API server |
| **API exposure** | ClusterIP (internal only) | Apiserver is never exposed directly to the internet — all traffic goes through nginx |
| **DB_HOST** per-environment | Docker: `db`, K8s: `postgres-service` | Service naming differs between Docker Compose and K8s — handled via per-environment ConfigMap |
| **nginx config** | Baked into Docker image | Simple, no K8s ConfigMap needed for now. ConfigMap can be added later if needed |
| **Secrets management** | K8s Secret (base64) | DB_USER, DB_PASS, JWT_SECRET stored as K8s Secret. Non-sensitive config in ConfigMap |

---

## Tech Stack

### Application
| Layer | Technology |
|---|---|
| Frontend | React 17, Ant Design, React Router 6, Axios |
| Backend | Express 4, Sequelize ORM, JWT, bcryptjs |
| Database | PostgreSQL 15 (Alpine) |
| Auth | JWT access tokens + refresh tokens + session encryption |

### DevOps & Infrastructure
| Category | Tools |
|---|---|
| Containerization | Docker, Docker Compose, Multi-stage builds |
| Orchestration | Kubernetes (EKS), Deployments + Services + PVC |
| CI/CD | GitHub Actions (test → build → push → deploy) |
| Code Quality | SonarQube (local), Jest coverage thresholds (50% min) |
| Container Registry | Docker Hub (`sahil9079/js-apiserver`, `sahil9079/js-client`) |
| Infrastructure | eksctl (planned), Terraform (future) |
| Monitoring | Prometheus + Grafana (planned) |

---

## Project Structure

```
FullStack-DevOps-Pipeline/
├── apiserver/                       # Express API server
│   ├── __tests__/                   # Unit + Integration tests (43 tests)
│   │   ├── unit/                    # Unit tests: utils, services, controllers
│   │   │   ├── utils/               # appError, catchAsync, jwt, session
│   │   │   ├── services/            # authService
│   │   │   └── controllers/         # skillController
│   │   ├── integration/             # Auth endpoint integration tests
│   │   └── setup.js                 # Test environment setup (env vars, mocks)
│   ├── config/                      # DB config, environment config
│   ├── controllers/                 # Route handlers (auth, skills, upload)
│   ├── middleware/                   # Auth middleware, error handlers
│   ├── models/                      # Sequelize models (User, Skill)
│   ├── routes/                      # Express route definitions
│   ├── services/                    # Business logic (auth, skills)
│   ├── utils/                       # Helpers (AppError, catchAsync, JWT, session)
│   ├── Dockerfile                   # node:18-slim, npm ci, USER node
│   ├── jest.config.js               # Jest config with coverage thresholds
│   ├── babel.config.js              # Babel for ES module support in tests
│   └── .config.env                  # Environment variables (gitignored)
│
├── client/                          # React frontend
│   ├── src/__tests__/               # Component unit tests (19 tests)
│   │   ├── App.test.js              # App shell rendering
│   │   ├── SignIn.test.js           # Login form behavior
│   │   ├── SignUp.test.js           # Registration form behavior
│   │   ├── Home.test.js             # Home page rendering
│   │   ├── About.test.js            # About page content
│   │   ├── Contact.test.js          # Contact page content
│   │   ├── Header.test.js           # Navigation header
│   │   ├── Loading.test.js          # Loading spinner component
│   │   └── utils.test.js            # Utility functions
│   ├── src/components/              # React components
│   ├── Dockerfile                   # Multi-stage: Node build → nginx runtime
│   └── nginx.conf                   # Reverse proxy config
│
├── k8s/                             # Kubernetes manifests
│   ├── namespace.yaml               # node-react-app namespace
│   ├── configmap.yaml               # Non-sensitive env vars
│   ├── secret.yaml                  # DB creds + JWT secret
│   ├── dbpvc.yaml                   # PostgreSQL 3Gi persistent volume
│   ├── dbdep.yaml                   # PostgreSQL deployment
│   ├── dbsrc.yaml                   # PostgreSQL ClusterIP service
│   ├── apidep.yaml                  # API server deployment
│   ├── apisrc.yaml                  # API server ClusterIP service
│   ├── clientdep.yaml               # Client deployment
│   └── clientsrc.yaml               # Client LoadBalancer service
│
├── docker-compose.yaml              # Local development (3 services)
├── sonar-project.properties         # SonarQube analysis config
└── .github/workflows/               # CI/CD pipeline (GitHub Actions)
```

---

## Docker Containerization

### Images Built

| Service | Base Image | Size Strategy | Registry | Tag |
|---|---|---|---|---|
| apiserver | `node:18-slim` | Single stage, minimal dependencies | `sahil9079/js-apiserver` | `v1.1.0` |
| client | `node:18-bullseye-slim` → `nginx:1.29-alpine` | Multi-stage — build in Node, serve in nginx | `sahil9079/js-client` | `v1.1.0` |
| postgres | `postgres:15-alpine` (official) | Official alpine image | Docker Hub | `latest` |

### Dockerfile Best Practices Applied

| Practice | Where | Benefit |
|---|---|---|
| **Multi-stage builds** | `client/Dockerfile` | Final nginx image is ~23MB vs ~1GB if using Node for runtime |
| **`USER node`** | `apiserver/Dockerfile` | Non-root user — reduces container escape risk |
| **`npm ci`** | Both Dockerfiles | Deterministic installs using lockfile (faster than `npm install`) |
| **`.dockerignore`** | Both services | Excludes node_modules, tests, build artifacts from Docker build context |
| **`EXPOSE`** | Both Dockerfiles | Documents intended ports (8010 API, 80 client) |
| **`WORKDIR /app`** | apiserver Dockerfile | Standardized working directory |

### Docker Compose Orchestration

```bash
docker-compose up -d
```

The Compose file defines 3 services with dependency ordering:

```
db (postgres:15-alpine) ──healthcheck──► apiserver (Express :8010) ──► client (nginx :80)
```

- `db` has a healthcheck (`pg_isready`) — apiserver waits until PostgreSQL is actually accepting connections
- `apiserver` depends on `db` being healthy (not just started)
- `client` depends on `apiserver` being started
- Environment variables are injected via `env_file: ./apiserver/.config.env`

---

## Kubernetes Deployment (EKS)

### From Docker Compose to Kubernetes

Every element of `docker-compose.yaml` maps to a K8s resource:

| Docker Compose | Kubernetes Manifest | What It Does |
|---|---|---|
| `services.db` | `dbdep.yaml` | Deployment with 1 replica, postgres:15-alpine, env from Secret |
| | `dbsrc.yaml` | ClusterIP service exposing port 5432 |
| | `dbpvc.yaml` | 3Gi PersistentVolumeClaim for database data |
| `services.apiserver` | `apidep.yaml` | Deployment, env from ConfigMap + Secret, port 8010 |
| | `apisrc.yaml` | ClusterIP service for internal pod communication |
| `services.client` | `clientdep.yaml` | Deployment with baked nginx config |
| | `clientsrc.yaml` | **LoadBalancer** service — the only public entry point |
| `env_file` (secrets) | `secret.yaml` | Base64-encoded DB_USER, DB_PASS, JWT_SECRET |
| `env_file` (config) | `configmap.yaml` | NODE_ENV, PORT_DEV, API_VERSION, DB_HOST, DB_PORT, DB_NAME |
| `volumes.dbdata` | `dbpvc.yaml` | Persistent storage that survives pod restarts |

### Service Architecture (Traffic Flow)

```
Internet
  │
  ▼
AWS ALB (auto-created by LoadBalancer service)
  │  port 80
  ▼
[LoadBalancer] ──► client-service
  │
  ▼
client pod (nginx)
  ├── /          ──► serves /usr/share/nginx/html/* (React build)
  │
  └── /api/      ──► proxy_pass http://apiserver-service:8010/
                        │
                        ▼
              ┌──────────────────────┐
              │ apiserver-service    │
              │ (ClusterIP, :8010)   │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ postgres-service     │
              │ (ClusterIP, :5432)   │
              └──────────────────────┘
```

### Why LoadBalancer Instead of Ingress

This was a deliberate architecture decision:

- The client's nginx **already handles all routing logic** — serving static React files AND proxying `/api/` to the backend
- A LoadBalancer service type simply makes nginx reachable from the internet via an AWS ALB
- Adding K8s Ingress would introduce an NLB (~$20/month) and an Ingress controller for **no added benefit** — nginx already does the routing
- Ingress makes sense when you have multiple backend services needing path-based routing at the load balancer level, or need free SSL via ACM

### Deploy to EKS

```bash
# 1. Create namespace first
kubectl apply -f k8s/namespace.yaml

# 2. Apply all manifests
kubectl apply -f k8s/

# 3. Check status
kubectl get all -n node-react-app
kubectl get svc client-service -n node-react-app   # Get ALB URL
```

---

## Testing Strategy

### Test Layers

| Layer | Framework | Count | What It Validates |
|---|---|---|---|
| **Unit Tests** | Jest | 38 (API) + 19 (Client) = **57** | Individual functions, services, controllers, React components in isolation |
| **Integration Tests** | Jest + Supertest | 5 | API endpoints working together — signup, login, profile, token refresh |

### What the Tests Cover

**API Server (38 unit + 5 integration):**
- `appError.test.js` — Custom error class with HTTP status codes
- `catchAsync.test.js` — Async error wrapper for Express routes
- `jwt.test.js` — Token generation, verification, expiry handling
- `session.test.js` — Session encryption and decryption
- `authService.test.js` — User registration, login, password hashing, token refresh
- `skillController.test.js` — CRUD operations for skills
- `auth.integration.test.js` — Full auth flow: register → login → access protected route → refresh token

**Client (19 unit):**
- `App.test.js` — Application shell renders with routing
- `SignIn.test.js` — Login form validation and submission
- `SignUp.test.js` — Registration form validation
- `Home.test.js` — Home page with auth-aware content
- `About.test.js`, `Contact.test.js` — Static page rendering
- `Header.test.js` — Navigation links and auth state
- `Loading.test.js` — Loading spinner display
- `utils.test.js` — Helper functions

### Coverage Thresholds (Quality Gate)

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 50,
    functions: 50,
    lines: 50,
    statements: 50,
  },
}
```

A 50% minimum coverage threshold is enforced on all code paths. This prevents untested code from being merged while keeping the bar achievable. The pipeline will fail if coverage drops below this threshold.

### Running Tests

```bash
# API tests
cd apiserver
npm test                    # Runs all 43 tests (unit + integration)
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:coverage       # With coverage report

# Client tests
cd client
npm test                    # Runs all 19 React component tests
npm run test:coverage       # With coverage report
```

---

## Code Quality (SonarQube)

SonarQube (`sonarqube:lts-community`) runs locally in Docker and analyzes both `apiserver/` and `client/src/` for code smells, bugs, security hotspots, and duplication.

### Configuration

```properties
sonar.projectKey=FullStack-DevOps-Pipeline
sonar.projectName=FullStack DevOps Pipeline
sonar.sources=apiserver,client/src
sonar.tests=apiserver/__tests__,client/src/__tests__
sonar.javascript.lcov.reportPaths=client/coverage/lcov.info,apiserver/coverage/lcov.info
sonar.test.inclusions=**/*.test.js,**/*.test.jsx
```

### Run Analysis

```bash
# Start SonarQube server
docker run -d --name sonarqube \
  -p 9000:9000 \
  -v sonarqube_data:/opt/sonarqube/data \
  -v sonarqube_extensions:/opt/sonarqube/extensions \
  sonarqube:lts-community

# Run scanner from project root
sonar-scanner -Dsonar.token=$SONAR_TOKEN -Dsonar.host.url=http://localhost:9000
```

### Why Local SonarQube (Not SonarCloud)

Local SonarQube was chosen over SonarCloud because:
- **No network dependency** — analysis runs entirely on localhost
- **JRE provisioning** — sonar-scanner 6.x encountered 403 errors fetching the JRE from SonarCloud APIs on corporate networks
- **Same analysis** — Local SonarQube LTS provides identical code quality metrics as SonarCloud
- **Token auth** — Tokens generated from the local UI work identically

---

## CI/CD Pipeline (GitHub Actions)

### Pipeline Stages

```
[git push] → [Test] → [SonarQube] → [Build] → [Push] → [Deploy to EKS]
```

| Stage | Tools | What Happens |
|---|---|---|
| **1. Install** | npm ci | Clean install of dependencies for both apiserver and client |
| **2. Test** | Jest | Run all 57 unit tests + 5 integration tests. If any fail → pipeline stops |
| **3. Quality Gate** | SonarQube Scanner | Analyze code quality. Enforce coverage thresholds (50%+). If quality gate fails → pipeline stops |
| **4. Build** | Docker | Build `sahil9079/js-apiserver` and `sahil9079/js-client` images |
| **5. Push** | Docker Hub | Push images to Docker Hub registry with git tag as version |
| **6. Deploy** | kubectl | Update EKS deployments with new images: `kubectl set image deployment/apiserver ...` |

### Why GitHub Actions (Not Jenkins)

GitHub Actions was chosen because:
- **Zero infrastructure** — no server to manage, no plugins to install
- **Native GitHub integration** — triggers on push/PR/tag, secrets management built in
- **Free for public repos** — no cost for personal projects
- **Pipeline as Code** — YAML workflow files live in the repo alongside the code

---

## Security Practices

| Practice | Where | Why |
|---|---|---|
| **Non-root containers** | `USER node` in apiserver Dockerfile | Reduces blast radius if container is compromised |
| **Secrets in K8s Secret** | `secret.yaml` | DB credentials and JWT secret are base64-encoded and separated from config |
| **Config in ConfigMap** | `configmap.yaml` | Non-sensitive environment variables are visible but not secret |
| **.dockerignore** | Both services | Prevents secrets, node_modules, and test files from entering Docker images |
| **.gitignore** | Root `.gitignore` | `apiserver/.config.env` excluded from version control (local secrets stay local) |
| **Helmet middleware** | Express app | Sets security headers (XSS protection, content-type sniffing prevention, etc.) |

---

## Local Development

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (for local non-Docker runs)
- kubectl + eksctl (for K8s deployment)

### Quick Start

```bash
# 1. Install dependencies
cd apiserver && npm install
cd ../client && npm install

# 2. Set up environment
cp apiserver/example.env apiserver/.config.env
# Edit .config.env with your PostgreSQL credentials

# 3. Run with Docker Compose
docker-compose up -d

# 4. Run locally (without Docker)
cd apiserver && node index.js    # API on http://localhost:8010
cd client && npm start           # React on http://localhost:3000
```

---

## What I Learned

### Container to Kubernetes Mapping
Every Docker Compose construct has a K8s equivalent. Services become Deployments + Services. Volumes become PVCs. The `env_file` splits into ConfigMap (non-sensitive) and Secret (sensitive). Understanding this mapping is the foundation of moving from Docker Compose to production K8s.

### LoadBalancer vs Ingress Decision
Ingress isn't always the right answer. When your application's nginx already handles path-based routing, a LoadBalancer service is simpler and cheaper. The decision should be based on architecture, not convention.

### Secrets Management
Never commit secrets to version control. `.gitignore` local `.env` files. Use K8s Secrets for production. Split config into sensitive and non-sensitive — this keeps security boundaries clear.

### Jest Version Compatibility
Jest v25 couldn't handle modern JavaScript features (the `node:` protocol prefix used by `sharp` and `formidable`). Upgrading to Jest 29 fixed all compatibility issues at once. Sometimes the right fix is a version upgrade, not workarounds.

### SonarQube vs SonarCloud
Local SonarQube provides identical analysis to SonarCloud without network dependencies. JRE provisioning issues with sonar-scanner 6.x on corporate networks are avoided entirely.

### Test-Driven Infrastructure
The developer writes test code; the DevOps engineer writes the pipeline that runs those tests. Never deploy untested code. Coverage thresholds (50%) provide a quality safety net without being overly restrictive.

---

## Roadmap

| Phase | What | Status |
|---|---|---|
| 1 | Docker containerization with best practices | ✅ Done |
| 2 | Jest/unit/integration testing (62 tests) | ✅ Done |
| 3 | SonarQube code quality analysis | 🔧 Blocked (auth issue) |
| 4 | Kubernetes manifests for EKS | ✅ Done (with known fixes) |
| 5 | GitHub Actions CI/CD pipeline | 📝 Planned |
| 6 | EKS cluster creation (eksctl) | 📝 Planned |
| 7 | Deploy to EKS | 📝 Planned |
| 8 | Prometheus + Grafana monitoring | 📝 Planned |
| 9 | ArgoCD GitOps | 🔮 Future |
| 10 | Terraform IaC (VPC, EKS, IAM) | 🔮 Future |

---

## License

ISC
