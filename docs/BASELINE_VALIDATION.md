# Baseline Validation Report (`docs/BASELINE_VALIDATION.md`)

> **Phase 2 — Establish a Reliable Baseline**  
> **Repository:** `d:\javascript_project\node-react-postgres`  
> **Git Commit Tested:** `de34346` (`main`)

---

## 1. How the Application Runs (Local Startup Modes)

Is repository ko local machine par run karne ke 2 modes hain:

### Mode A: Host-Based Development (`npm` + Local PostgreSQL)
1. **Prerequisites**: Node.js (`v18+` or `v24.x`), npm, aur running PostgreSQL instance (`localhost:5432`, database `sampledb`).
2. **Environment File**: Copy `apiserver/example.env` to `apiserver/.config.env`.
3. **Commands**:
   ```powershell
   # Backend API Server (Port 8010)
   cd apiserver
   npm ci
   node index.js

   # Frontend React Dev Server (Port 3000, proxies /api to localhost:8010)
   cd ../client
   npm ci
   npm start
   ```

### Mode B: Containerized 5-Service Stack (`docker compose`)
1. **Prerequisites**: Docker Desktop / Docker Engine (`28.4.0`) + Docker Compose (`v2.39.4`).
2. **Commands**:
   ```powershell
   Copy-Item apiserver/example.env apiserver/.config.env
   docker compose up --build -d
   ```
3. **Exposed Local Endpoints**:
   - Frontend (NGINX + React SPA): `http://localhost:80`
   - NGINX Liveness Endpoint: `http://localhost:80/nginx-health`
   - Backend API Liveness Probe: `http://localhost:8010/healthz`
   - Backend API Readiness Probe (DB Check): `http://localhost:8010/readyz`
   - Backend Prometheus Metrics: `http://localhost:8010/metrics`
   - Prometheus UI: `http://localhost:9090`
   - Grafana UI: `http://localhost:3001`

---

## 2. Executed Baseline Test & Validation Results

Niche diye gaye sabhi validation commands actual workspace (`d:\javascript_project\node-react-postgres`) mein execute kiye gaye hain:

### 2.1 Backend Unit & Integration Tests (`apiserver`)
- **Command Executed**:
  ```powershell
  npm --prefix apiserver test -- --coverage
  ```
- **Actual Result**: **PASSED (Exit Code 0)**
  - **Test Suites**: `8 passed, 8 total`
    1. `__tests__/unit/utils/appError.test.js`
    2. `__tests__/unit/utils/catchAsync.test.js`
    3. `__tests__/unit/utils/jwt.test.js`
    4. `__tests__/unit/utils/session.test.js`
    5. `__tests__/unit/services/authService.test.js`
    6. `__tests__/unit/controllers/skillController.test.js`
    7. `__tests__/integration/auth.integration.test.js`
    8. `__tests__/unit/health.test.js`
  - **Total Tests**: `53 passed, 53 total`
  - **Measured Coverage vs `jest.config.js` Threshold (50%)**:
    - **Statements**: `68.28%` (Threshold: `50%` — PASS)
    - **Branches**: `53.80%` (Threshold: `50%` — PASS)
    - **Functions**: `60.00%` (Threshold: `50%` — PASS)
    - **Lines**: `68.63%` (Threshold: `50%` — PASS)

### 2.2 Frontend Component & Utility Tests (`client`)
- **Command Executed**:
  ```powershell
  npm --prefix client test -- --watchAll=false
  ```
- **Actual Result**: **PASSED (Exit Code 0)**
  - **Test Suites**: `9 passed, 9 total` (`About.test.js`, `App.test.js`, `Contact.test.js`, `Header.test.js`, `Home.test.js`, `Loading.test.js`, `SignIn.test.js`, `SignUp.test.js`, `utils.test.js`)
  - **Total Tests**: `19 passed, 19 total`

### 2.3 Docker Compose Specification Validation
- **Command Executed**:
  ```powershell
  docker compose config --quiet
  ```
- **Actual Result**: **PASSED (Exit Code 0)** — All 5 services (`db`, `apiserver`, `client`, `prometheus`, `grafana`), 3 bridge networks, and 3 named volumes validate cleanly.

### 2.4 Kubernetes & Kustomize Manifest Validation
- **Commands Executed**:
  ```powershell
  kubectl kustomize k8s > $null
  kubectl kustomize k8s/overlays/lab > $null
  kubectl kustomize k8s/overlays/production > $null
  ```
- **Actual Result**: **PASSED (Exit Code 0 for all three targets)** — YAML syntax, Kustomize resource references, and JSON6902 patches render without errors.

### 2.5 Terraform Formatting Check
- **Command Executed**:
  ```powershell
  terraform -chdir=infra fmt -check -recursive
  ```
- **Actual Result**: **PASSED (Exit Code 0)** — All `.tf` files across `bootstrap`, `modules/{network,ecr,eks,rds,iam}`, and `envs/lab` conform to canonical HCL formatting.

---

## 3. Baseline Defect Log (Pre-Existing Issues vs New Findings)

| Category | Description | Status |
| :--- | :--- | :--- |
| **Pre-Existing Coverage Failure (Resolved)** | Running `npm test -- --coverage` on the original 43 backend tests failed the 50% global threshold (`36.9%` statements, `22.22%` functions) because middlewares and operational endpoints were untested. | **Fixed & Verified** in `apiserver/__tests__/unit/health.test.js` (`68.28%` statements, `53.80%` branches). |
| **Cross-File Findings (`F-01` to `F-10`)** | Identified during Phase 1 audit in [docs/COMPLETE_REPOSITORY_REVIEW.md](./COMPLETE_REPOSITORY_REVIEW.md) (e.g., NGINX `apiserver` DNS in Kubernetes, SonarQube artifact path in GitHub Actions, `skillController.js` parenthesis bug, Terraform Secrets Manager resource). | **Queued for Controlled Fix Batch (Phase 14)** upon user approval. |
