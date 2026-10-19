# Repository Discovery & Complete File Inventory (`docs/REPOSITORY_INVENTORY.md`)

> **Phase 0 — Complete Repository Discovery & File Inventory**  
> **Repository Root:** `d:\javascript_project\node-react-postgres`  
> **Git Branch & Status:** `main` (up to date with `origin/main`, working tree clean at commit `de34346`)  
> **Target AWS Region:** `ap-south-1` (Mumbai)

---

## 1. Executive Summary (Hinglish Overview)

Yeh repository ek **3-Tier Skills Management Platform** (`react-auth`) hai jismein:
1. **Frontend (`client/`)**: React 17 Single-Page Application (SPA) with Ant Design (`antd`) UI components, Axios HTTP client, React Router v6, Jest/React Testing Library unit tests, aur Cypress E2E tests. Production container mein yeh **NGINX (`nginx:1.27-alpine`)** ke through static assets serve karta hai aur `/api/*` requests ko backend container par **Reverse Proxy** karta hai.
2. **Backend API (`apiserver/`)**: Node.js + Express 4 REST API jo **Sequelize ORM (`v6.37.8`)** aur `pg` driver ke through **PostgreSQL (`sampledb`)** database se connect hota hai. Ismein JWT + AES-256 encrypted session cookies, RBAC (`athorizeOnly.js`), image upload/resize (`multer` + `sharp`), operational health probes (`/healthz`, `/readyz`), aur Prometheus telemetry (`/metrics`) shamil hain.
3. **Database (`postgres` / Amazon RDS)**: Local development mein `postgres:15-alpine` Docker container (`sampledb`) use hota hai; cloud target architecture mein **Private Amazon RDS for PostgreSQL 15** (isolated DB subnets mein with `DB_SSL=true`) use hota hai.
4. **DevOps & Cloud Stack**: Repository mein **Docker Multi-Stage Builds**, **Docker Compose** (3 segmented networks + Prometheus & Grafana), **Kubernetes & Kustomize (`k8s/`)**, **Terraform IaC (`infra/`)**, **GitHub Actions CI/CD (`.github/workflows/`)**, **SonarQube (`sonar-project.properties`)**, aur **k6 Load Testing (`apiserver/k6-tests/`)** configured hain.

---

## 2. Verified Local Environment & CLI Toolchain

Discovery ke dauran system par niche diye gaye official DevOps CLI tools verify kiye gaye:

| Tool | Verified Version | Purpose in This Repository |
| :--- | :--- | :--- |
| **Node.js** | `v24.17.0` | Backend Express runtime & Frontend React build runtime |
| **npm** | `11.13.0` | Package management & test execution (`npm ci`, `npm test`) |
| **Git** | `2.43.0.windows.1` | Version control (`main` branch synced with `origin/main`) |
| **Docker Engine** | `28.4.0` (build `d8eb465`) | Multi-stage container image builds & non-root runtime |
| **Docker Compose** | `v2.39.4-desktop.1` | Local 5-container orchestration (`postgres`, `apiserver`, `client`, `prometheus`, `grafana`) |
| **Terraform** | `v1.15.4` | Infrastructure as Code (`infra/bootstrap`, `infra/modules/*`, `infra/envs/lab`) |
| **kubectl** | `v1.34.0` | Kubernetes manifest validation & EKS cluster operations |
| **Kustomize** | `v5.7.1` (built into `kubectl`) | Environment overlay rendering (`k8s/overlays/lab`, `k8s/overlays/production`) |
| **AWS CLI** | `2.31.3` (Python `3.13.7`) | AWS authentication, ECR/EKS/RDS inspection & post-destroy billing audits |

---

## 3. Repository Directory Tree

> **Note:** Generated directories (`node_modules/`, `.git/`, `coverage/`) are inventoried in Section 4.8 and excluded from the tree below for readability.

```text
node-react-postgres/
├── .dockerignore                                  # Root Docker build context exclusions
├── .gitignore                                     # Git tracking exclusions (.config.env, *.tfstate*, etc.)
├── ARCHITECTURE.md                                # Production 3-Tier AWS EKS + Private RDS architecture guide
├── AWS_COST_OPTIMIZATION_AND_CLEANUP.md           # FinOps, safe workload pause & teardown manual
├── DEVOPS_IMPLEMENTATION_GUIDE.md                 # End-to-end Hinglish DevOps implementation manual (Phases 0–15)
├── KUBERNETES_DEEP_DIVE.md                        # Deep-dive guide on K8s manifests, probes, HPA, PDB & ALB Ingress
├── README.md                                      # Repository entrypoint, architecture diagram & quickstart
├── docker-compose.yaml                            # Local 5-service stack (Postgres, API, NGINX/React, Prometheus, Grafana)
├── package.json                                   # Root helper scripts (concurrently)
├── package-lock.json                              # Root dependency lockfile
├── sonar-project.properties                       # SonarQube / SonarCloud static analysis configuration
│
├── .github/
│   └── workflows/
│       ├── main.yaml                              # CI Pipeline: Jest tests, SonarQube, Docker build, Trivy scan
│       └── deploy-lab.yml                         # Manual CD Pipeline: AWS OIDC -> ECR push -> EKS Kustomize rollout
│
├── apiserver/                                     # Backend Node.js / Express REST API (Port 8010)
│   ├── .config.env                                # Local untracked environment file (gitignored & dockerignored)
│   ├── .dockerignore                              # Excludes node_modules, .config.env, coverage, tests from image
│   ├── Dockerfile                                 # 2-stage production Dockerfile (node:18-alpine, USER node, HEALTHCHECK)
│   ├── api.js                                     # Express Router mounting /v1/users and /v1/skills
│   ├── app.js                                     # Express app setup, Helmet, CORS, /healthz, /readyz, /metrics
│   ├── babel.config.js                            # Babel configuration for Jest test transpilation
│   ├── example.env                                # Template environment variables (PORT=8010, DB_SSL=false, etc.)
│   ├── index.js                                   # Process entrypoint: env loading, Sequelize sync, HTTP server listen
│   ├── jest.config.js                             # Jest test runner & 50% global coverage gate configuration
│   ├── metrics.js                                 # Zero-dependency Prometheus 0.0.4 metrics collector
│   ├── package.json                               # Backend dependencies & test scripts
│   ├── package-lock.json                          # Backend lockfile
│   ├── config/
│   │   └── index.js                               # Environment-based port & URL selector (dev/test/prod)
│   ├── controllers/
│   │   ├── authController.js                      # Signup, login, logout, verify, forgot/reset password handlers
│   │   ├── skillController.js                     # CRUD controllers for user skills & location options
│   │   └── userController.js                      # Profile view, profile update (with image cleanup) & password update
│   ├── dev-data/
│   │   ├── roles.json                             # Seed data for roles
│   │   ├── seed.js                                # CLI script to import/delete seed data
│   │   └── users.json                             # Seed data for sample users
│   ├── images/
│   │   └── profile/.gitkeep                       # Upload directory for resized user profile images
│   ├── k6-tests/
│   │   ├── login.js                               # Grafana k6 load test for /api/v1/users/login
│   │   └── skills.js                              # Grafana k6 load test for /api/v1/skills
│   ├── middleware/
│   │   ├── athorizeOnly.js                        # Role-based access control (RBAC) middleware
│   │   ├── convertErrors.js                       # Normalizes JWT & Sequelize errors into AppError instances
│   │   ├── handleErrors.js                        # Global Express error handler (dev vs prod responses)
│   │   ├── isLoggedIn.js                          # Validates session cookie via authService.checkUserSession
│   │   ├── resizeMultipleImages.js                # Sharp multi-image resizer middleware
│   │   ├── resizeSingleImage.js                   # Sharp single profile image resizer (300x300 JPEG)
│   │   ├── uploadMutipleFiles.js                  # Multer memory storage for multiple files
│   │   └── uploadSingleFile.js                    # Multer memory storage for single image upload
│   ├── models/
│   │   ├── index.js                               # Sequelize connection pool & RDS TLS (DB_SSL) configuration
│   │   └── sampledb/
│   │       ├── index.js                           # Model loader & entity associations (User, Role, Skill, LocationOption)
│   │       ├── locationOption.js                  # LocationOption Sequelize model (location_options table)
│   │       ├── role.js                            # Role Sequelize model (roles table)
│   │       ├── skill.js                           # Skill Sequelize model (skills table)
│   │       └── user.js                            # User Sequelize model (users table + bcrypt hooks)
│   ├── routes/
│   │   ├── authRoutes.js                          # /api/v1/users auth endpoints
│   │   ├── skillRoutes.js                         # /api/v1/skills endpoints
│   │   └── userRoutes.js                          # /api/v1/users profile endpoints
│   ├── services/
│   │   └── authService.js                         # Core business logic for authentication, JWT & session validation
│   ├── utils/
│   │   ├── appError.js                            # Custom operational error class (statusCode, isOperational)
│   │   ├── catchAsync.js                          # Async wrapper forwarding rejected promises to next(err)
│   │   ├── email.js                               # Email verification & password reset sender utility
│   │   ├── jwt.js                                 # JWT sign and verify helpers
│   │   └── session.js                             # AES-256-CBC cookie encryption/decryption utility
│   └── __tests__/
│       ├── setup.js                               # Jest test environment variables
│       ├── integration/
│       │   └── auth.integration.test.js           # Supertest integration tests for Auth API routes
│       └── unit/
│           ├── health.test.js                     # Unit/integration tests for /healthz, /readyz, /metrics & middlewares
│           ├── controllers/skillController.test.js# Unit tests for skillController
│           ├── services/authService.test.js       # Unit tests for authService
│           └── utils/
│               ├── appError.test.js               # Unit tests for AppError
│               ├── catchAsync.test.js             # Unit tests for catchAsync
│               ├── jwt.test.js                    # Unit tests for JWT helper
│               └── session.test.js                # Unit tests for AES-256 session encryption
│
├── client/                                        # Frontend React 17 SPA + NGINX Reverse Proxy
│   ├── .dockerignore                              # Excludes node_modules, build/, scan-report.json from image context
│   ├── Dockerfile                                 # 2-stage Dockerfile (node:18-alpine build -> nginx:1.27-alpine)
│   ├── cypress.config.js                          # Cypress E2E test runner configuration
│   ├── nginx.conf                                 # NGINX SPA routing, /nginx-health & /api/ reverse proxy to apiserver:8010
│   ├── package.json                               # Frontend dependencies (React 17, Antd 4, Axios) & scripts
│   ├── package-lock.json                          # Frontend lockfile
│   ├── scan-report.json                           # Historical vulnerability scan artifact (untracked/ignored in future builds)
│   ├── build/                                     # Pre-built static artifact directory (also contient legacy design.rar)
│   ├── cypress/
│   │   ├── e2e/auth.cy.js                         # Cypress E2E authentication flow test
│   │   └── support/e2e.js                         # Cypress support file
│   ├── public/                                    # Static HTML template & public assets
│   └── src/
│       ├── App.js                                 # React root component & route definitions
│       ├── index.js                               # React DOM entrypoint
│       ├── setupTests.js                          # Jest-DOM setup for React Testing Library
│       ├── assets/style/{App.css,index.css}       # Stylesheets
│       ├── components/                            # Reusable UI components (Loading, SkillAdd, SkillList, SkillUpdate)
│       ├── context/UserContext.jsx                # Global user authentication context
│       ├── hooks/                                 # Custom hooks (useAuth, useCheckAuth, useErrorHandler)
│       ├── layouts/                               # Page layouts (MainLayout, DashboardLayout, Header)
│       ├── pages/                                 # Route pages (Home, About, Contact, UserSkills, SignIn, SignUp)
│       ├── routers/{PrivateRoute.jsx,PublicRoute.jsx} # Route guards
│       ├── services/{authService.js,userService.js}   # Frontend API service wrappers
│       ├── utils/{alertNotification.js,createHttpClient.js} # Notification & Axios client utilities
│       └── __tests__/                             # 9 Frontend Jest test suites (19 tests total)
│
├── deploy/                                        # Local & Container Observability Configurations
│   ├── grafana/
│   │   ├── dashboards/node-api.json               # Pre-built Grafana dashboard (RPS, p95 latency, 5xx errors, memory)
│   │   └── provisioning/
│   │       ├── dashboards/dashboards.yml          # Grafana automatic dashboard provider
│   │       └── datasources/prometheus.yml         # Grafana automatic Prometheus datasource config
│   └── prometheus/
│       ├── alerts.yml                             # Alert rules (API Instance Down, High 5xx Rate, High p95, Heap >85%)
│       └── prometheus.yml                         # Scrape config targeting apiserver:8010/metrics every 15s
│
├── infra/                                         # Terraform Infrastructure as Code (AWS ap-south-1)
│   ├── bootstrap/main.tf                          # S3 remote state bucket (KMS + versioning + public access block)
│   ├── envs/
│   │   └── lab/
│   │       ├── main.tf                            # Root module wiring VPC, ECR, EKS, RDS & IAM with S3 use_lockfile
│   │       └── terraform.tfvars.example           # Example input variables for ap-south-1 lab environment
│   └── modules/
│       ├── ecr/main.tf                            # Immutable ECR repositories + scan-on-push + lifecycle policies
│       ├── eks/main.tf                            # EKS v1.31 cluster, OIDC provider & managed node group
│       ├── iam/main.tf                            # GitHub OIDC IAM role & EKS Pod IRSA role for Secrets Manager
│       ├── network/main.tf                        # VPC (10.0.0.0/16), 3-tier subnets, IGW, NAT & SG chain
│       └── rds/main.tf                            # Private PostgreSQL 15 RDS + AWS Secrets Manager secret
│
├── k8s/                                           # Kubernetes & Kustomize Manifests
│   ├── namespace.yaml                             # Dedicated 'production' namespace
│   ├── serviceaccount.yaml                        # 'apiserver-sa' ServiceAccount for IRSA
│   ├── rbac.yaml                                  # Least-privilege Role & RoleBinding
│   ├── configmap.yaml                             # Non-sensitive configuration (DB_SSL, PORT, URLs, etc.)
│   ├── secret.yaml                                # Template Kubernetes Secret (placeholder values)
│   ├── external-secret.yaml                       # ExternalSecret syncing from AWS Secrets Manager
│   ├── dbpvc.yaml                                 # Local K8s only: 1Gi PersistentVolumeClaim for PostgreSQL
│   ├── dbdep.yaml                                 # Local K8s only: PostgreSQL 15 Deployment
│   ├── dbsrc.yaml                                 # Local K8s only: postgres-cluster-ip-service (Port 5432)
│   ├── apidep.yaml                                # Backend API Deployment (probes, resources, securityContext)
│   ├── apisrc.yaml                                # Backend ClusterIP Service (apiserver-service:8010)
│   ├── clientdep.yaml                             # Frontend NGINX/React Deployment (probes, resources)
│   ├── clientsrc.yaml                             # Frontend ClusterIP Service (client-service:3000 -> targetPort 80)
│   ├── ingress.yaml                               # AWS ALB Ingress routing /api/* -> apiserver and /* -> client
│   ├── hpa.yaml                                   # HorizontalPodAutoscaler (2–6 replicas on CPU 70% / Memory 80%)
│   ├── pdb.yaml                                   # PodDisruptionBudget (minAvailable: 1)
│   ├── kustomization.yaml                         # Base Kustomize entrypoint
│   └── overlays/
│       ├── lab/kustomization.yaml                 # Lab overlay (includes local PostgreSQL pods for Minikube/Kind)
│       └── production/kustomization.yaml          # Production EKS overlay (excludes local DB pods, uses Private RDS + ESO)
│
├── scripts/                                       # Operational & Verification Shell Scripts
│   ├── aws-preflight.sh                           # Verifies AWS STS identity, region (ap-south-1) & CLI tools
│   ├── post-destroy-check.sh                      # 11-point AWS CLI verification after teardown to prevent surprise bills
│   └── smoke-test.sh                              # Automated post-deployment HTTP check (/healthz, /readyz, /metrics, /)
│
├── docs/
│   ├── REPOSITORY_INVENTORY.md                    # This complete file inventory & discovery document
│   └── adr/
│       └── ADR-001-architecture-and-devops-evolution.md # Architecture Decision Record
│
├── interview-notes/                               # Existing multi-level DevOps study notes (preserved untouched)
└── DevOps-Interview-Preparation/                  # Existing 22-module DevOps curriculum (preserved untouched)
```

---

## 4. Relevant Files and Their Purposes (By Category)

### 4.1 Root Configuration & Documentation Files
| File Path | Purpose |
| :--- | :--- |
| `.gitignore` | Prevents secrets (`.config.env`, `*.tfvars`), Terraform state (`*.tfstate*`), dependencies (`node_modules`), and OS junk (`.DS_Store`) from being committed to Git. |
| `.dockerignore` | Prevents root-level secrets, `.git`, docs, and `infra/` from polluting root Docker build contexts. |
| `package.json` | Convenience wrapper using `concurrently` to start `apiserver` and `client` together during host-based development. |
| `docker-compose.yaml` | Defines the local 5-container stack (`postgres`, `apiserver`, `client`, `prometheus`, `grafana`) across 3 isolated bridge networks (`frontend-net`, `backend-net`, `monitoring-net`). |
| `sonar-project.properties` | Configures SonarQube/SonarCloud sources (`apiserver`, `client/src`), test inclusions, and LCOV coverage paths. |
| `README.md` | Main project overview, Mermaid architecture diagram, phase status tracker, and quickstart commands. |
| `DEVOPS_IMPLEMENTATION_GUIDE.md` | Comprehensive Hinglish implementation manual covering Phases 0–15, 48 official DevOps terms, and 9 incident playbooks. |
| `AWS_COST_OPTIMIZATION_AND_CLEANUP.md` | AWS FinOps manual covering cost drivers, Operation A (local stop), Operation B (AWS pause), and Operation C (full teardown). |
| `ARCHITECTURE.md` | Detailed architectural blueprint of the 3-tier system across edge, compute, data, CI/CD, and observability layers. |
| `KUBERNETES_DEEP_DIVE.md` | Detailed guide explaining every manifest in `k8s/` and `k8s/overlays/`. |

### 4.2 Backend Application (`apiserver/`)
| File Path | Purpose |
| :--- | :--- |
| `apiserver/index.js` | Application entrypoint: loads `.config.env`, calls `sampledb.sync()`, and starts HTTP server on `config.PORT` (`8010`). |
| `apiserver/app.js` | Express application definition: configures `helmet`, `cors`, `cookieParser`, `compression`, `metricsMiddleware`, `/healthz`, `/readyz`, `/metrics`, `/api` routes, and error middlewares. |
| `apiserver/metrics.js` | Custom zero-dependency Prometheus 0.0.4 exporter tracking `http_requests_total`, `http_request_duration_seconds` histograms, and Node.js memory/CPU/uptime gauges. |
| `apiserver/api.js` | Sub-router mounting `/v1/users` (`authRoutes`, `userRoutes`) and `/v1/skills` (`skillRoutes`). |
| `apiserver/config/index.js` | Environment selector resolving `PORT` (`8010`), `URL`, and `CLIENT_URL` for `development`, `test`, and `production`. |
| `apiserver/models/index.js` | Initializes Sequelize instance (`sampledb`) with PostgreSQL connection pool (`max: 5`) and optional RDS TLS (`DB_SSL=true`). |
| `apiserver/models/sampledb/*.js` | Sequelize models for `User`, `Role`, `Skill`, and `LocationOption` plus their `belongsTo`/`hasMany` relationships. |
| `apiserver/controllers/*.js` | Request handlers for authentication (`authController.js`), user profile/password (`userController.js`), and skills CRUD (`skillController.js`). |
| `apiserver/services/authService.js` | Business logic for user registration, password hashing (`bcryptjs`), JWT token verification, and encrypted session validation. |
| `apiserver/middleware/*.js` | Auth verification (`isLoggedIn.js`), RBAC (`athorizeOnly.js`), error normalization (`convertErrors.js`, `handleErrors.js`), and image upload/resizing (`multer` + `sharp`). |
| `apiserver/utils/*.js` | Helpers for `AppError`, `catchAsync`, `jwt` signing/verification, `session` AES-256-CBC encryption, and `email` transport. |
| `apiserver/Dockerfile` | 2-stage production container build (`node:18-alpine`), running as non-root `USER node` with `/healthz` `HEALTHCHECK`. |
| `apiserver/__tests__/**` | 8 Jest test suites (53 tests total) covering unit, middleware, health/readiness/metrics, and auth integration flows. |
| `apiserver/k6-tests/{login.js,skills.js}` | Grafana `k6` load testing scripts for login and skills endpoints. |

### 4.3 Frontend Application (`client/`)
| File Path | Purpose |
| :--- | :--- |
| `client/src/App.js` & `index.js` | React 17 SPA entrypoint and client-side routing (`PublicRoute` and `PrivateRoute`). |
| `client/src/services/*.js` & `utils/createHttpClient.js` | Axios HTTP client wrappers sending requests to relative `/api/v1/*` paths with credentials (`withCredentials: true`). |
| `client/nginx.conf` | Production NGINX config serving React static build on port `80`, exposing `/nginx-health`, and proxying `/api/` to `http://apiserver:8010`. |
| `client/Dockerfile` | 2-stage Dockerfile compiling React static assets in Stage 1 (`node:18-alpine`) and serving via `nginx:1.27-alpine` in Stage 2. |
| `client/src/__tests__/*.test.js` | 9 React Testing Library + Jest test suites (19 tests total). |
| `client/cypress/e2e/auth.cy.js` | Cypress end-to-end browser test suite for user authentication. |

### 4.4 Observability, Infrastructure as Code, Kubernetes & CI/CD
| File Path | Purpose |
| :--- | :--- |
| `deploy/prometheus/{prometheus.yml,alerts.yml}` | Prometheus scrape configuration (`apiserver:8010/metrics`) and 4 golden-signal alert rules. |
| `deploy/grafana/**` | Auto-provisioned Prometheus datasource and `node-api.json` dashboard for local observability. |
| `infra/bootstrap/main.tf` | Provisions S3 state bucket with versioning, KMS encryption, and public access blocks. |
| `infra/modules/{network,ecr,eks,rds,iam}/main.tf` | Modular Terraform definitions for VPC/Subnets/NAT/SGs, ECR, EKS `v1.31`, Private RDS PostgreSQL 15, and OIDC/IRSA IAM roles. |
| `infra/envs/lab/main.tf` | Root Terraform environment for `ap-south-1` using native S3 state locking (`use_lockfile = true`). |
| `k8s/*.yaml` & `k8s/overlays/{lab,production}/` | Kubernetes manifests and Kustomize overlays separating local Minikube/Kind DB pods (`lab`) from AWS EKS + Private RDS (`production`). |
| `.github/workflows/{main.yaml,deploy-lab.yml}` | Automated CI quality/security pipeline (`main.yaml`) and manual OIDC-authenticated EKS deployment workflow (`deploy-lab.yml`). |
| `scripts/{aws-preflight.sh,smoke-test.sh,post-destroy-check.sh}` | Pre-deployment AWS identity checks, post-deployment HTTP smoke tests, and post-teardown orphan resource checks. |

---

## 5. Technology and Dependency Inventory

### Backend (`apiserver/package.json`)
- **Runtime Dependencies**: `express` (`^4.20.0`), `sequelize` (`^6.37.8`), `pg` (`^8.7.1`), `jsonwebtoken` (`^9.0.3`), `bcryptjs` (`^2.4.3`), `helmet` (`^5.0.2`), `cors` (`^2.8.5`), `cookie-parser` (`^1.4.6`), `compression` (`^1.7.4`), `dotenv` (`^10.0.0`), `multer` (`^1.4.5-lts.1`), `sharp` (`^0.35.2`), `axios` (`^1.16.0`), `morgan` (`^1.10.0`), `http-status` (`^1.5.0`), `uuid` (`^9.0.1`).
- **Dev/Test Dependencies**: `jest` (`^29.7.0`), `supertest` (`^6.3.4`), `@babel/core` (`^8.0.1`), `@babel/preset-env` (`^8.0.2`), `@babel/types` (`^8.0.0`).

### Frontend (`client/package.json`)
- **Dependencies**: `react` (`^17.0.2`), `react-dom` (`^17.0.2`), `react-router-dom` (`^6.2.1`), `antd` (`^4.19.2`), `axios` (`^0.25.0`), `js-cookie` (`^3.0.1`), `react-scripts` (`5.0.0`), `web-vitals` (`^2.1.4`).
- **Testing Libraries**: `@testing-library/react` (`^12.1.2`), `@testing-library/jest-dom` (`^5.16.2`), `@testing-library/user-event` (`^13.5.0`), plus Cypress configuration (`client/cypress.config.js`).

---

## 6. Existing Architecture & Deployment Flow

1. **Local Development Flow (Docker Compose)**:
   - User accesses `http://localhost:80` $\to$ hits `client` container (`nginx:1.27-alpine`).
   - Static routes (`/*`) serve compiled React SPA files from `/usr/share/nginx/html`.
   - API routes (`/api/*`) are reverse-proxied by NGINX over `frontend-net` to `http://apiserver:8010`.
   - `apiserver` queries `postgres:5432` (`sampledb`) over isolated `backend-net`.
   - `prometheus` (`:9090`) scrapes `apiserver:8010/metrics` over `monitoring-net`, and `grafana` (`:3001`) visualizes Golden Signals.
2. **Cloud Target Flow (AWS `ap-south-1` Mumbai)**:
   - User $\to$ Route 53 + ACM HTTPS $\to$ single **AWS Application Load Balancer (ALB)** in public subnets (`10.0.1.0/24`, `10.0.2.0/24`).
   - AWS Load Balancer Controller routes `/*` to `client-service:3000` (`ClusterIP`) and `/api/*` to `apiserver-service:8010` (`ClusterIP`) inside private app subnets (`10.0.11.0/24`, `10.0.12.0/24`).
   - `apiserver` pods authenticate to AWS Secrets Manager via **IRSA** (`ExternalSecret`) and connect over TLS (`DB_SSL=true`) to **Private Amazon RDS PostgreSQL 15** in isolated DB subnets (`10.0.21.0/24`, `10.0.22.0/24`).

---

## 7. Existing Functionality, Gaps, Risks & Assumptions

### What Is Working & Verified
- **Unit & Integration Tests**: `53/53` backend tests (8 suites, `68.28%` statement coverage) and `19/19` frontend tests (9 suites) pass.
- **Operational Endpoints**: `/healthz` (liveness), `/readyz` (DB readiness), `/metrics` (Prometheus 0.0.4), and `/nginx-health` are implemented.
- **Manifest & IaC Validation**: `docker compose config`, `kubectl kustomize` (`base`, `lab`, `production`), and `terraform fmt -check` pass.

### Residual Repository Items & Hygiene Gaps to Inspect in Phase 1 Review
1. **Tracked Junk/Binary Artifacts in Git**:
   - `.DS_Store`, `apiserver/.DS_Store`, `client/src/.DS_Store`, `client/src/components/.DS_Store` are currently present on disk.
   - `client/build/` (compiled output) and `client/public/design.rar` / `client/build/design.rar` and `client/scan-report.json` exist in the workspace from earlier commits.
2. **Kubernetes Service Port Mapping Nuance**:
   - `k8s/clientsrc.yaml` exposes `port: 3000` forwarding to `targetPort: 80` (NGINX), while `k8s/clientdep.yaml` declares `containerPort: 80`. While valid in Kubernetes (`Ingress` $\to$ Service `3000` $\to$ Pod `80`), this port mapping must be clearly understood and documented for interviews.
3. **Structured Interview Preparation Directory (`docs/devops-interview-preparation/`)**:
   - While `interview-notes/` and `DevOps-Interview-Preparation/` exist in the root, the dedicated `docs/devops-interview-preparation/00-LEARNING-ROADMAP.md` through `15-AWS-COST-OPTIMIZATION-AND-CLEANUP.md` module series, plus `docs/COMPLETE_REPOSITORY_REVIEW.md`, `docs/BASELINE_VALIDATION.md`, and `docs/CODE_REVIEW_REPORT.md`, need to be generated in the upcoming phases.

---

## 8. Proposed Implementation Phases & Execution Order

| Step / Phase | Deliverable | Dependency |
| :--- | :--- | :--- |
| **Step 1 (Phase 0)** | Repository discovery & `docs/REPOSITORY_INVENTORY.md` (**Completed in this step**) | None |
| **Step 2 (Phase 1)** | Exhaustive file-by-file & cross-file review in `docs/COMPLETE_REPOSITORY_REVIEW.md` | Step 1 |
| **Step 3 (Phase 2)** | Baseline test & build validation report in `docs/BASELINE_VALIDATION.md` | Step 2 |
| **Step 4 (Phases 3–13)** | Step-by-step review & verification of Git workflow, Docker, Compose/NGINX, CI/CD, DevSecOps, Terraform, AWS Architecture, K8s/EKS, Observability & Troubleshooting | Step 3 + User Approval |
| **Step 5 (Phase 14)** | Controlled code/config fixes & `docs/CODE_REVIEW_REPORT.md` | Step 4 |
| **Step 6 (Phase 15)** | Cost optimization & teardown synchronization in `docs/AWS_COST_OPTIMIZATION_AND_CLEANUP.md` | Step 5 |
| **Step 7 (Phases 16–19)** | Complete 16-file learning & 60-scenario interview program in `docs/devops-interview-preparation/` + Interactive Mock Interview mode | Step 6 |
| **Step 8 (Phase 20)** | Final validation and delivery report | All prior steps |
