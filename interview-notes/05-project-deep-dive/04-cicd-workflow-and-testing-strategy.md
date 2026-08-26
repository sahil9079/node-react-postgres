# Project Deep Dive: CI/CD Workflow & Testing Strategy

> **Core Focus:** Deep dive into GitHub Actions workflows, Jest coverage metrics, SonarQube integration, and vulnerability scanning.

---

## 1. Pipeline Stages & Execution Flow

```
[Git Push to main]
        │
        ▼
 ┌──────────────────────────────────────────────┐
 │ 1. testing (Parallel Matrix)                 │
 │    ├── apiserver: npm ci && npm test --cov   │
 │    └── client:    npm ci && npm test --cov   │
 └──────────────────────┬───────────────────────┘
                        │ (Must Pass)
        ┌───────────────┴───────────────┐
        ▼                               ▼
 ┌───────────────────────────┐   ┌───────────────────────────┐
 │ 2. sonarqube              │   │ 3. security               │
 │    SonarSource scanner    │   │    ├── npm audit          │
 │    Quality Gate check     │   │    └── Trivy fs scan      │
 └───────────────────────────┘   └───────────────────────────┘
```

---

## 2. Test Architecture Breakdown

### Unit vs Integration Testing in Your Project
* **API Server (43 Total Tests):**
  * `appError.test.js`: Validates custom HTTP error classes and status codes.
  * `catchAsync.test.js`: Validates asynchronous error-wrapping middleware.
  * `jwt.test.js`: Validates JWT token generation, expiration timestamps, and signature verification.
  * `session.test.js`: Validates encryption and decryption of session cookies.
  * `authService.test.js`: Tests user registration, password hashing, and login validation.
  * `skillController.test.js`: Tests CRUD endpoints for skills portfolio.
  * `auth.integration.test.js` (Supertest): Tests full user flow (`POST /register` $\to$ `POST /login` $\to$ `GET /profile` $\to$ `POST /refresh-token`).
* **React Client (19 Total Tests):**
  * Tests component rendering, form validation, and auth states (`SignIn.test.js`, `SignUp.test.js`, `App.test.js`, `Header.test.js`).
