# DEVOPS: FRESHER → SENIOR — Read, Build & Master This Project

> **Project:** `node-react-postgres` — React 17 + Node.js/Express 4 + PostgreSQL 15
> **Who this is for:** someone who has never opened this repository and wants to become a DevOps engineer by actually doing the work.
> **What this file is:** a self-paced, hands-on manual. Every code block is either (a) real code that already exists in this repo (so you learn to read it), or (b) a command/file you create yourself while practising.
> **What this file is NOT:** a replacement for the existing docs. It is the *guided path* through them. See [Section 20](#20-existing-docs-and-how-they-fit-together) for how `README.md`, `ARCHITECTURE.md`, `DEVOPS_IMPLEMENTATION_GUIDE.md` and the `docs/` folder fit in.
> **Safety rule:** this guide never asks you to delete project files. You will **add** files, create branches, and run commands. Any fix that requires changing an existing file is shown explicitly, with the instruction to do it on a **new branch** and open a PR — that is exactly how a real engineer works.

---

## Table of Contents

- [0. How to use this guide](#0-how-to-use-this-guide)
- [1. The 30,000-foot map](#1-the-30000-foot-map)
- [2. Reading order: which file, in which order](#2-reading-order-which-file-in-which-order)
- [3. Level 1 — Application foundations (read the code)](#3-level-1--application-foundations-read-the-code)
- [4. Level 2 — Run it locally without Docker](#4-level-2--run-it-locally-without-docker)
- [5. Level 3 — Tests, coverage and quality gates](#5-level-3--tests-coverage-and-quality-gates)
- [6. Level 4 — Docker: build production images](#6-level-4--docker-build-production-images)
- [7. Level 5 — Docker Compose + local observability](#7-level-5--docker-compose--local-observability)
- [8. Level 6 — Kubernetes on your laptop](#8-level-6--kubernetes-on-your-laptop)
- [9. Level 7 — Terraform: build AWS from zero](#9-level-7--terraform-build-aws-from-zero)
- [10. Level 8 — Deploy to Amazon EKS](#10-level-8--deploy-to-amazon-eks)
- [11. Level 9 — CI/CD with GitHub Actions + AWS OIDC](#11-level-9--cicd-with-github-actions--aws-oidc)
- [12. Level 10 — Observability and SRE](#12-level-10--observability-and-sre)
- [13. Level 11 — DevSecOps and hardening](#13-level-11--devsecops-and-hardening)
- [14. Level 12 — Break-and-fix drills (the senior-maker)](#14-level-12--break-and-fix-drills-the-senior-maker)
- [15. Senior topics: scaling, HA, DR, incidents](#15-senior-topics-scaling-ha-dr-incidents)
- [16. The 90-day plan](#16-the-90-day-plan)
- [17. Interview bank mapped to this repo](#17-interview-bank-mapped-to-this-repo)
- [18. Command cheat sheet](#18-command-cheat-sheet)
- [19. Known issues a senior would flag (and fix)](#19-known-issues-a-senior-would-flag-and-fix)
- [20. Existing docs and how they fit together](#20-existing-docs-and-how-they-fit-together)

---

## 0. How to use this guide

### 0.1 The learning loop (use it for every level)

For every level below, do these five things in order:

1. **READ** — open the files listed. Do not skim. Type the code path out loud (or in a notebook).
2. **DRAW** — draw the boxes and arrows on paper: request → container → service → database.
3. **RUN** — execute the commands yourself. Copy-paste is allowed only after you read what each flag does.
4. **BREAK** — deliberately cause the failure in the "Break it" box, then fix it using the diagnostic commands.
5. **EXPLAIN** — write 5 bullet points in your own words, then say them out loud in 60 seconds. If you cannot explain it simply, you do not know it yet.

### 0.2 What you need installed

| Tool | Version used by this repo | Why |
| :--- | :--- | :--- |
| Node.js | 18 LTS | `apiserver/Dockerfile` uses `node:18-bullseye-slim` |
| npm | 9+ | `npm ci` needs a lockfile |
| Git | any recent | branching, PR workflow |
| Docker Desktop / Docker Engine | 24+ | images + Compose |
| kubectl | 1.29+ | Kubernetes |
| kind **or** minikube | latest | local cluster (Section 8) |
| Terraform | >= 1.10 (repo requirement) | S3 native state locking (`use_lockfile`) |
| AWS CLI v2 | latest | EKS/RDS/ECR operations |
| k6 (optional) | latest | load tests in `apiserver/k6-tests/` |
| jq (optional) | latest | reading JSON output |

Verify:

```powershell
node -v
npm -v
docker version
kubectl version --client
terraform version
aws --version
```

> **Windows note:** this repo's scripts are Bash (`.sh`). On Windows use **Git Bash** or **WSL2**. PowerShell equivalents are given where useful. Use `curl.exe` in PowerShell because `curl` is an alias for `Invoke-WebRequest`.

### 0.3 Create a practice branch first

Never experiment on `main`.

```bash
git checkout -b learning/devops-fresher-to-senior
git status
```

### 0.4 The four layers you are learning

```
LAYER 4  CI/CD + Observability + Security     <- senior
LAYER 3  Cloud infrastructure (Terraform, AWS) <- senior
LAYER 2  Orchestration (Docker, Kubernetes)    <- mid
LAYER 1  Application (Node/React/Postgres)     <- fresher
```

A senior engineer can move **down** any layer to debug. That is the whole skill. When a Pod crashes, the senior does not only run `kubectl logs`; they know which Node.js line could have caused it.

---

## 1. The 30,000-foot map

### 1.1 What the application does

It is a small "skills portfolio" app:

- A user **registers** (`POST /api/v1/auth/register`).
- A verification link is printed to the console in development (`/api/v1/auth/verify/:token`).
- The user **logs in** and receives an **encrypted JWT inside an HTTP-only cookie**.
- Logged-in users can **create / read / update / delete their skills** (`/api/v1/skills`).
- Users can update their **profile and profile image** (`/api/v1/users`).

That is the entire product. Everything else in this repo exists to run, ship, secure, observe and pay for that product.

### 1.2 The three tiers

| Tier | Technology | Folder | Listens on |
| :--- | :--- | :--- | :--- |
| Frontend | React 17 SPA served by NGINX | `client/` | `80` (container), `3000` (dev server) |
| Backend | Node.js 18 + Express 4 REST API | `apiserver/` | `8010` |
| Database | PostgreSQL 15 | external / `db` service | `5432` |

### 1.3 The full production picture

```
                        Internet
                            |
                    [ Route 53 DNS ]
                            |
                [ AWS ALB :80/:443 ]        <- created by Kubernetes Ingress
                     /            \
             path /api/*       path /*
                 |                 |
      [ apiserver-service ]   [ client-service ]
         ClusterIP :8010        ClusterIP :80
              |                      |
      [ apiserver Pods ]       [ NGINX/React Pods ]
         (HPA 2-6)                (HPA 2-4)
              |
              | TCP 5432 + TLS
              v
      [ Private RDS PostgreSQL 15 ]
        (private DB subnets, no public IP)
```

Supporting systems:

```
GitHub Actions --OIDC--> AWS IAM role --> ECR (images) --> EKS (deploy)
       |
       +--> Jest, SonarQube, npm audit, Trivy

Prometheus --scrape /metrics--> apiserver Pods --> Grafana dashboards/alerts
CloudWatch <-- ALB / EKS / RDS logs and metrics
Terraform --> VPC, subnets, NAT, EKS, RDS, ECR, IAM, Secrets Manager
```

### 1.4 Request lifecycle (memorise this)

When a browser opens `http://<alb>/skills`:

1. DNS resolves to the ALB.
2. ALB matches path `/` → `client-service:80`.
3. NGINX serves `index.html`; React Router renders `/skills`.
4. React calls `GET /api/v1/skills` (same origin).
5. The browser sends the `__sample_session` cookie.
6. ALB matches `/api` → `apiserver-service:8010`.
7. Express runs: `metricsMiddleware` → `cookieParser` → `cors` → `helmet` → `json` → static → `/api/v1` router → `isLoggedIn` → `skillController.getAllSkills`.
8. `isLoggedIn` decrypts the cookie, verifies the JWT, loads the user and role from PostgreSQL.
9. Controller queries PostgreSQL through Sequelize.
10. Response goes back through `convertErrors`/`handleErrors` if anything failed.
11. Prometheus records the request and exposes it on `/metrics`.

If you can narrate this without notes, you have passed Level 1.

### 1.5 Ports, names and environment variables (keep this table open)

| Thing | Local dev | Docker Compose | Kubernetes (`node-react-app`) |
| :--- | :--- | :--- | :--- |
| API | `localhost:8010` | `apiserver:8010` | `apiserver-service:8010` + alias `apiserver:8010` |
| Client | `localhost:3000` | `localhost:80` (`client:80`) | `client-service:80` |
| DB | `localhost:5432` | `db:5432` | local: `postgres-service:5432`; AWS: RDS endpoint |
| Prometheus | — | `localhost:9090` | in-cluster |
| Grafana | — | `localhost:3001` | in-cluster |
| Health | `/healthz` | `/healthz` | liveness + startup probe |
| Readiness | `/readyz` | `/readyz` | readiness probe |
| Metrics | `/metrics` | `/metrics` | scraped via annotations |

Environment variables the API needs (from `apiserver/example.env`):

| Variable | Meaning | Where it is set in production |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` / `test` / `production` | ConfigMap |
| `API_VERSION` | URL prefix, `v1` | ConfigMap |
| `PORT` | HTTP port, `8010` | ConfigMap |
| `DB_HOST`, `DB_PORT`, `DB_NAME` | PostgreSQL location | ConfigMap (overlay patches `DB_HOST`) |
| `DB_USER`, `DB_PASS` | credentials | Secret / ExternalSecret from AWS Secrets Manager |
| `DB_SSL` | `true` for RDS TLS | ConfigMap (overlay patches to `true`) |
| `JWT_VERIFY_SECRET`, `JWT_SESSION_SECRET`, `JWT_REFRESH_SECRET` | token signing | Secret |
| `JWT_*_EXPIRY` | token lifetimes | ConfigMap |
| `SESSION_ENCRYPT_SECRET`, `SESSION_ALGORITHM` | cookie payload encryption | Secret / ConfigMap |
| `SESSION_COOKIE_NAME` | `__sample_session` | ConfigMap |
| `PASSWORD_HASH_CYCLE` | bcrypt cost, `10` | ConfigMap |
| `IMAGES_DIR` | upload folder | `.env` locally; volume in containers |
| `CLIENT_URL` | redirect after email verification | env |

> **Senior habit:** an environment variable is a *contract* between three files: the app (`process.env.X`), the deployment (`docker-compose.yaml` or ConfigMap/Secret), and the docs. When something is `undefined`, compare all three.

---

## 2. Reading order: which file, in which order

Read **inside-out**: application → container → local stack → Kubernetes → cloud → CI/CD. Do not start with `infra/`; you will drown.

| Step | Files | The question you are answering |
| :--- | :--- | :--- |
| 1 | `package.json`, `apiserver/package.json`, `client/package.json` | What is this app made of? Which scripts exist? |
| 2 | `apiserver/example.env`, `apiserver/config/index.js` | What does the app need to boot? |
| 3 | `apiserver/index.js`, `apiserver/app.js` | How does the server start, and what middleware runs? |
| 4 | `apiserver/api.js`, `apiserver/routes/*.js` | What are the URLs? |
| 5 | `apiserver/controllers/*.js`, `apiserver/services/authService.js` | What does each URL do? |
| 6 | `apiserver/models/index.js`, `apiserver/models/sampledb/*.js` | How is data stored and related? |
| 7 | `apiserver/middleware/*.js`, `apiserver/utils/*.js` | How are auth, errors and uploads handled? |
| 8 | `apiserver/metrics.js` | How does observability hook in? |
| 9 | `client/src/App.js`, `client/src/services/*`, `client/nginx.conf` | How does the frontend talk to the API? |
| 10 | `apiserver/Dockerfile`, `client/Dockerfile`, `.dockerignore` files | How is it packaged? |
| 11 | `docker-compose.yaml` | How does it run as a system locally? |
| 12 | `k8s/*.yaml`, `k8s/overlays/*` | How does it run on Kubernetes? |
| 13 | `infra/bootstrap/main.tf`, `infra/modules/*`, `infra/envs/lab/main.tf` | How is AWS created? |
| 14 | `.github/workflows/main.yaml`, `deploy-lab.yml` | How does code reach production? |
| 15 | `deploy/prometheus/*`, `deploy/grafana/*` | How do we know it is healthy? |
| 16 | `scripts/*.sh`, `apiserver/k6-tests/*` | How do we verify and load-test it? |

---

## 3. Level 1 — Application foundations (read the code)

**Goal:** understand every line that runs when the API boots. This is the part most "DevOps-only" learners skip, and it is why they cannot debug production.

### 3.1 `apiserver/package.json` — dependencies are an infrastructure decision

```json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testMatch='**/__tests__/integration/**/*.test.js'",
    "test:unit": "jest --testMatch='**/__tests__/unit/**/*.test.js'"
  },
  "dependencies": {
    "axios": "^1.16.0",
    "bcryptjs": "^2.4.3",
    "body-parser": "^1.20.3",
    "compression": "^1.7.4",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^10.0.0",
    "express": "^4.20.0",
    "helmet": "^5.0.2",
    "http-status": "^1.5.0",
    "jsonwebtoken": "^9.0.3",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "pg": "^8.7.1",
    "sequelize": "^6.37.8",
    "sharp": "^0.35.2",
    "uuid": "^9.0.1"
  }
}
```

What each package means **to a DevOps engineer**:

| Package | Runtime role | DevOps implication |
| :--- | :--- | :--- |
| `express` | HTTP framework | Port `8010` is the only ingress |
| `sequelize` + `pg` | PostgreSQL ORM/driver | DB connectivity is a readiness dependency |
| `jsonwebtoken` | signs/verifies JWTs | secrets must be rotated, never committed |
| `bcryptjs` | password hashing | CPU-heavy; `PASSWORD_HASH_CYCLE=10` is a latency/security trade-off |
| `helmet` | security headers | baseline hardening, keep it |
| `cors` | cross-origin policy | wide open (`cors()`); should be restricted in prod |
| `compression` | gzip | saves bandwidth, costs CPU |
| `sharp` | image resize | native binary; image build must match OS/arch |
| `multer` | file upload | writes to disk → needs a volume in Kubernetes |
| `dotenv` | loads `.config.env` | local only; prod uses ConfigMap/Secret |
| `morgan` | request logs | only in `development` — prod logging comes from stdout collection |

> **Why `npm ci` and not `npm install`?** `npm ci` installs exactly `package-lock.json`, fails if lockfile and `package.json` disagree, and deletes `node_modules` first. Reproducible builds are a DevOps requirement. Both Dockerfiles use `npm ci`.

### 3.2 `apiserver/index.js` — the boot sequence

```javascript
const dotenv = require('dotenv')
dotenv.config({ path: './.config.env' })

process.on("uncaughtException", err => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...')
    console.log(err.name, err.stack)
    process.exit(1)
})

const { sampledb } = require("./models")
sampledb.authenticate()
    .then(() => console.log(`connected to ${sampledb.config.database} successfully!`))
    .catch(err => console.log(`unable to connect ${sampledb.config.database}!`, err.message))
sampledb.sync({ force: false })
    .then(() => console.log(`synced ${sampledb.config.database} successfully!`))
    .catch(err => console.log(`unable to sync ${sampledb.config.database}!`, err.message))

const app = require('./app')
const { PORT = 8000 } = require("./config")
const server = app.listen(PORT, () => {
    console.log(`Server is awake on port ${PORT}:${process.env.NODE_ENV}`)
})

process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...')
    console.log(err.name, err.stack)
    sampledb.close()
    server.close(() => process.exit(1))
})

process.on('SIGTERM', () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down gracefully')
    sampledb.close()
    server.close(() => console.log('💥 Process terminated!'))
})
```

Read it in four blocks:

1. **Config first.** `dotenv` loads `.config.env` before anything reads `process.env`. In containers this file does not exist (it is in `.dockerignore`), so real env vars are injected — this is the correct pattern.
2. **Crash handlers.** `uncaughtException` exits with code `1`. Kubernetes sees a non-zero exit and restarts the container. That is intentional.
3. **Database connect + `sync()`.** `sync({ force: false })` creates tables if missing and **never drops them**. `force: true` (used only in `dev-data/seed.js`) destroys data. This is a common production footgun; a senior replaces `sync()` with migrations.
4. **Graceful shutdown.** On `SIGTERM` (sent by Kubernetes when a Pod is deleted), the server stops accepting connections and closes the DB pool. The `terminationGracePeriodSeconds` (default 30s) is the deadline.

**Break it (do this):** set `DB_HOST=wrong-host` in `.config.env` and start the API. Notice:
- the process **still starts** and listens on `8010`;
- `/healthz` returns 200;
- `/readyz` returns 503.

That is exactly why liveness and readiness are separate. Read Section 3.3.

### 3.3 `apiserver/app.js` — middleware order is behaviour

```javascript
const app = express()

app.use(metricsMiddleware)                      // 1. measure everything
app.use(cookieParser())                         // 2. parse cookies (auth)
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"))                      // 3. request logs (dev only)
}
app.use(cors())                                 // 4. CORS
app.use(helmet({ crossOriginResourcePolicy: false }))  // 5. security headers
app.use(express.json())                         // 6. JSON body
app.use(express.urlencoded({ extended: true })) // 7. form body

app.get("/healthz", (req, res) => { /* no DB check */ })
app.get("/readyz", async (req, res) => { /* DB authenticate */ })
app.get("/metrics", metricsEndpoint)

app.use(express.static(clientBuildPath))        // React build
app.use(express.static(path.join(__dirname, "images")))  // uploads
app.use(compression())                          // gzip
app.use(`/api/${process.env.API_VERSION}`, api) // routes

app.get("*", (req, res, next) => { /* SPA fallback, only if build exists */ })
app.all("*", (req, res, next) => res.status(404).end())
app.use(convertErrors)
app.use(handleErrors)
```

Five things a senior notices here:

1. **`/healthz` vs `/readyz`** — liveness answers "is the process alive?"; readiness answers "should I receive traffic?". Pointing liveness at the database is a classic outage: DB blips → every Pod restarts → total outage. This repo gets it right.
2. **`/metrics` is inside the same process** — zero extra dependency, but it means metric scraping competes with user traffic. Fine at this scale; at 1M users you would use OpenTelemetry + a sidecar/agent.
3. **Static files are optional** — the API container does not contain the React build (separate images), so `fs.existsSync(clientIndexHtml)` guards the SPA fallback.
4. **`cors()` with no options allows every origin.** With cookie auth you also need `credentials: true` for cross-origin cookies; in production the ALB serves both app and API from one origin, so CORS is mostly unnecessary.
5. **Error middleware must be last and must have 4 arguments.** Express detects error handlers by arity `(err, req, res, next)`. If you add a 3-arg middleware after them, errors stop being handled.

### 3.4 `apiserver/api.js` + `routes/` — the URL contract

```javascript
const api = require("express").Router()

api
    .use('/auth', authRoutes)
    .use('/users', isLoggedIn, userRoutes)
    .use('/skills', isLoggedIn, skillRoutes)
```

`isLoggedIn` is applied **at the router mount**, so every `/users/*` and `/skills/*` request is authenticated. `/auth/*` is public.

| Method | Path | Auth | Controller |
| :--- | :--- | :--- | :--- |
| POST | `/api/v1/auth/register` | no | `authController.register` |
| GET | `/api/v1/auth/verify/:token` | no | `authController.verify` |
| POST | `/api/v1/auth/login` | no | `authController.login` |
| GET | `/api/v1/auth/check-auth` | cookie | `authController.checkAuth` |
| GET | `/api/v1/auth/logout` | no | `authController.logout` |
| GET | `/api/v1/users` | yes | `userController.getMe` |
| POST | `/api/v1/users` | yes | upload → resize → `updateUserProfile` |
| PATCH | `/api/v1/users` | yes | `updateUserPassword` |
| GET | `/api/v1/skills` | yes | `getAllSkills` |
| GET | `/api/v1/skills/:skillId` | yes | `getSkillById` |
| POST | `/api/v1/skills` | yes | `createSkill` |
| PATCH | `/api/v1/skills/:skillId` | yes | `updateSkillById` |
| DELETE | `/api/v1/skills/:skillId` | yes | `deleteSkillById` |

> **Design smell worth mentioning in interviews:** `GET /skills` returns *all* skills, while `getSkillsByUserId` exists but is not routed. A senior would either route it (`GET /users/me/skills`) or remove it.

### 3.5 Authentication: three secrets, three jobs

This repo does **not** use `express-session`. It uses a hand-rolled "encrypted JWT in a cookie" flow. Understand it, because it is a great interview story.

```
LOGIN
  email+password
      |
      v
  bcrypt.compare(password, user.password)          // services/authService.js
      |
      v
  jwt.sign({ id, role: role.code }, JWT_SESSION_SECRET, { expiresIn: 1d })
      |
      v
  AES-192-CBC encrypt(token, SESSION_ENCRYPT_SECRET)   // utils/session.js
      |
      v
  Set-Cookie: __sample_session=<hex>; HttpOnly; SameSite=Strict; Secure(if https)
```

```
REQUEST TO /api/v1/skills
  cookie
    |
    v
  AES decrypt  -> JWT
    |
    v
  jwt.verify(JWT, JWT_SESSION_SECRET)
    |
    v
  SELECT user JOIN role WHERE id = decoded.id
    |
    v
  req.userId, req.role, req.user -> next()
```

```javascript
// apiserver/utils/session.js (key parts)
const key = scryptSync(process.env.SESSION_ENCRYPT_SECRET, 'salt', 24)
const iv = Buffer.alloc(16, 0)              // fixed IV!
const algorithm = process.env.SESSION_ALGORITHM || 'aes-192-cbc'

exports.encrypt = (token) => {
    const cipher = createCipheriv(algorithm, key, iv)
    let encrypted = cipher.update(token, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return encrypted
}
```

Three security observations (say these in an interview):

1. **A fixed IV is a weakness.** The same JWT always encrypts to the same hex string. A random IV per encryption (prefixed to the ciphertext) is the correct design. The JWT signature still protects integrity, so this is defence-in-depth debt, not an open door.
2. **The encrypted JWT is redundant-ish** but useful: the cookie is not readable by JavaScript (HttpOnly) and not a plain JWT a client can inspect.
3. **No refresh-token rotation.** `JWT_REFRESH_SECRET` exists in env but is unused. Logout only clears the cookie; a stolen cookie remains valid until expiry. A senior fix is a server-side session/denylist or short-lived access + rotating refresh tokens.

Also note `createSession()`:

```javascript
const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000 * +process.env.JWT_SESSION_EXPIRY.slice(0, -1))
const config = {
    expires: expiry,
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    sameSite: process.env.NODE_ENV === "development" ? "lax" : "strict"
}
```

`slice(0, -1)` assumes a unit of `d` (`1d`). If someone sets `12h`, the math silently becomes 12 **days**. That is a real bug class: string parsing of config. A senior uses `ms`/`jsonwebtoken`'s own expiry handling.

### 3.6 Middleware and error handling

```javascript
// middleware/isLoggedIn.js
module.exports = catchAsync(async (req, res, next) => {
    const data = await authService.checkUserSession(req.cookies[process.env.SESSION_COOKIE_NAME])
    req.userId = data.id
    req.role = data.role
    req.user = data
    return next()
})
```

```javascript
// utils/catchAsync.js — converts rejected promises into next(err)
module.exports = fn => (req, res, next) => fn(req, res, next).catch(next)
```

```javascript
// utils/appError.js — operational vs programming errors
class AppError extends Error {
    constructor(statusCode, message, isOperational = true, name = "Error", stack = '') {
        super(message)
        this.statusCode = statusCode
        this.name = name
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
        this.isOperational = isOperational
        if (stack) this.stack = stack
        else Error.captureStackTrace(this, this.constructor)
    }
}
```

The error pipeline is: `AppError` → `convertErrors` (normalises JWT/Sequelize errors) → `handleErrors` (dev: full stack; prod: message only for operational errors, generic 500 otherwise).

**Why `isOperational` matters:** an operational error ("email already exists") is safe to show. A programming error (a `TypeError` deep in code) can leak schema and secrets. In production, `handleErrors` hides it. That is why you should **never** return `err.stack` to users.

**Bug to notice:** `middleware/athorizeOnly.js` calls `new AppError('You are not authorized...', 403)` — arguments are swapped (message first, code second). It is currently unused, which is why nobody noticed. This is a perfect "code review" exercise.

### 3.7 Models and the database contract

```javascript
// models/index.js
const useSSL = process.env.DB_SSL === "true"

const sampledb = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    logging: false,
    dialectOptions: useSSL ? {
        ssl: { require: true, rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === "true" }
    } : {},
    define: { underscored: true, timestamps: false }
})
```

Relationships (`models/sampledb/index.js`):

```javascript
User.hasMany(Skill);        Skill.belongsTo(User);
Role.hasMany(User);         User.belongsTo(Role);
Skill.hasMany(LocationOption); LocationOption.belongsTo(Skill);
```

Resulting schema:

```
role (id, name, code)
  ^ 1..n
user (id, first_name, last_name, email, password, password_confirm,
      status, is_verified, profile_img, refresh_token, created_at, updated_at, role_id)
  ^ 1..n
skill (id, category, tag_line, travel_fee, user_id)
  ^ 1..n
location_option (id, option, skill_id)
```

Notes a senior would raise:

- `timestamps: false` globally, but `User` sets `timestamps: true` → only `user` has `created_at`/`updated_at`.
- `passwordConfirm` is **stored in the database**. It should be `type: Sequelize.VIRTUAL`. Storing it doubles the exposure of credentials. The model hashes `password` in `beforeCreate`, but `passwordConfirm` is saved as plaintext and then overwritten with the string `'confirmed'` in `afterCreate` — an awkward workaround.
- `User.beforeCreate` sets `user.roleId = 1` for **every** user, hard-coded. Seeded roles are `1=user`, `2=admin`, `3=superAdmin`. Works, but brittle.
- `sync()` at boot is convenient but unsafe for schema changes. Real answer: Sequelize migrations (`umzug`) run as a Kubernetes `Job` or CI step, not by every replica at startup.

### 3.8 `apiserver/metrics.js` — observability inside the app

This file is worth studying line by line because it is a self-contained Prometheus exporter.

```javascript
const HISTOGRAM_BUCKETS = [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]

function normalizeRoute(req) {
    if (req.route && req.route.path) {
        const baseUrl = req.baseUrl || ""
        return `${baseUrl}${req.route.path === "/" ? "" : req.route.path}` || "/"
    }
    const rawPath = (req.originalUrl || req.url || "/").split("?")[0]
    return rawPath
        .replace(/\/api\/v1\/skills\/[^/]+/g, "/api/v1/skills/:skillId")
        .replace(/\/api\/v1\/auth\/verify\/[^/]+/g, "/api/v1/auth/verify/:token")
        .replace(/\/[0-9a-fA-F-]{8,}/g, "/:id")
        .replace(/\/\d+/g, "/:id")
}
```

Why normalisation exists: if you label a metric with the raw URL, `/skills/1`, `/skills/2`, … create **unbounded label cardinality**. Prometheus memory explodes. This is one of the most common real production incidents caused by application code. Being able to explain "cardinality explosion" is a senior signal.

Emitted metrics:

| Metric | Type | Use |
| :--- | :--- | :--- |
| `http_requests_total{method,route,status_code}` | counter | request rate, error rate |
| `http_request_duration_seconds_bucket/sum/count` | histogram | p50/p95/p99 latency |
| `process_resident_memory_bytes` | gauge | RSS |
| `nodejs_heap_used_bytes` | gauge | heap pressure / OOM risk |
| `process_cpu_user_seconds_total` | counter | CPU saturation |
| `process_uptime_seconds` | gauge | restarts (uptime resets) |

These are the **Four Golden Signals**: latency, traffic, errors, saturation.

### 3.9 Frontend: just enough to debug it

`client/src/App.js` defines the routes; `PrivateRoute` redirects to `/sign-in` when `UserContext` has no user.

`client/src/utils/createHttpClient.js`:

```javascript
export default function createChannel() {
    const controller = new AbortController()
    const token = localStorage.getItem("r-token")
    const request = axios.create({
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        signal: controller.signal,
    })
    return { request, controller }
}
```

`client/src/services/authService.js`:

```javascript
registerUser(values) { return this.request.post("/api/v1/auth/register", values) }
loginUser(values)    { return this.request.post("/api/v1/auth/login", values) }
checkUserAuth()      { return this.request.get("/api/v1/auth/check-auth") }
logoutUser()         { return this.request.get("/api/v1/auth/logout") }
```

Key facts:

- Requests are **relative** (`/api/v1/...`). In dev, `client/package.json` has `"proxy": "http://localhost:8010"`. In Docker/Kubernetes, NGINX proxies `/api/` to `apiserver:8010`.
- Auth is **cookie-based**, so the browser sends the cookie automatically. The `Authorization: Bearer` header in `createHttpClient` is legacy/unused by the backend.
- `AbortController` is created but never aborted in this snippet — cancellation is not actually wired. Another code-review item.
- `PrivateRoute` is only UX. **All real authorisation is server-side** (`isLoggedIn` + ownership checks in `skillController`). Never trust the client.

### 3.10 `client/nginx.conf` — the frontend's real entry point

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location = /nginx-health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    location / {
        try_files $uri $uri/ /index.html;      # SPA routing
    }

    location /api/ {
        proxy_pass http://apiserver:8010;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Three senior details:

1. `try_files ... /index.html` is what makes client-side routes (`/skills`) work on refresh. Without it, NGINX returns 404.
2. `proxy_pass http://apiserver:8010;` (no trailing slash) preserves the full path, so `/api/v1/skills` arrives unchanged. Adding a trailing slash would strip `/api/` and break routing.
3. `X-Forwarded-Proto` is what makes `req.secure` true behind TLS termination, which makes the cookie `Secure`. If you forget it, login "works" but the cookie is not marked Secure.

> **Kubernetes gotcha already solved in this repo:** NGINX resolves `apiserver` **at startup**. If that DNS name does not exist, the container crashes with `host not found in upstream`. That is why `k8s/apisrc.yaml` defines a Service literally named `apiserver`, in addition to `apiserver-service`.

### 3.11 Level 1 checklist

- [ ] I can explain `/healthz` vs `/readyz` without notes.
- [ ] I can draw the login flow including bcrypt, JWT, AES and the cookie.
- [ ] I can list the middleware order in `app.js` and say why order matters.
- [ ] I can explain what `sync({ force: false })` does and why migrations are better.
- [ ] I can explain metric cardinality and why `normalizeRoute` exists.
- [ ] I can explain why the frontend uses relative URLs and how NGINX proxies them.

---

## 4. Level 2 — Run it locally without Docker

**Goal:** get the app running on your machine and prove you can debug a database connection.

### 4.1 Create the env file

```powershell
Copy-Item apiserver/example.env apiserver/.config.env
```

Then edit `apiserver/.config.env`:

```env
NODE_ENV=development
API_VERSION=v1
PORT=8010
PORT_DEV=8010
PORT_TEST=8011
PORT_PROD=8010

DB_USER=postgres
DB_PASS=mypassword
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sampledb
DB_SSL=false

JWT_VERIFY_SECRET=dev-verify-secret-change-me
JWT_VERIFY_EXPIRY=1d
JWT_SESSION_SECRET=dev-session-secret-change-me
JWT_SESSION_EXPIRY=1d
JWT_REFRESH_SECRET=dev-refresh-secret-change-me
JWT_REFRESH_EXPIRY=30d
SESSION_ENCRYPT_SECRET=dev-session-encrypt-change-me
SESSION_ALGORITHM=aes-192-cbc
PASSWORD_HASH_CYCLE=10
SESSION_COOKIE_NAME=__sample_session

CLIENT_URL_DEV=http://localhost:3000
IMAGES_DIR=images
```

> `.config.env` is git-ignored. Never commit it. `example.env` is the safe template.

### 4.2 Start PostgreSQL (fastest path: Docker)

```bash
docker run -d --name skills-pg \
  -e POSTGRES_PASSWORD=mypassword \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=sampledb \
  -p 5432:5432 \
  -v skills-pg-data:/var/lib/postgresql/data \
  postgres:15-alpine

docker logs -f skills-pg     # wait for "database system is ready to accept connections"
```

### 4.3 Install and run

```bash
# API
cd apiserver
npm ci
npm start            # NOTE: apiserver/package.json has no start script; use:
node index.js

# in a second terminal
cd client
npm ci
npm start            # React dev server on http://localhost:3000
```

If `npm start` fails in `apiserver`, that is expected: the `start` script lives in the **root** `package.json` (`concurrently`). Two valid options:

```bash
# Option A - from repo root (runs API + client together)
npm ci
npm start

# Option B - explicit
cd apiserver && node index.js
cd client && npm start
```

### 4.4 Seed data

```bash
cd apiserver
node dev-data/seed.js
```

`seed.js` calls `sync({ force: true })` — **it drops and recreates tables**. Only ever run it against a local database. Seeded roles: `user`, `admin`, `superAdmin`. Seeded users have password `123456` and `isVerified: true`.

### 4.5 Verify with curl

```bash
curl.exe -i http://localhost:8010/healthz
curl.exe -i http://localhost:8010/readyz
curl.exe http://localhost:8010/metrics | Select-Object -First 20
```

Register and log in:

```bash
# register (verification link is printed in the API console)
curl.exe -X POST http://localhost:8010/api/v1/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"firstName\":\"Test\",\"lastName\":\"User\",\"email\":\"test@example.com\",\"password\":\"Passw0rd!\",\"passwordConfirm\":\"Passw0rd!\"}"

# open the printed verification URL in a browser, then log in
curl.exe -i -c cookies.txt -X POST http://localhost:8010/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"Passw0rd!\"}"

# use the cookie
curl.exe -b cookies.txt http://localhost:8010/api/v1/skills
```

PowerShell users: `^` is cmd.exe line continuation. In PowerShell use backtick `` ` `` or put the command on one line.

### 4.6 Break it: database is down

1. `docker stop skills-pg`
2. Call `/healthz` → **200** (process is alive).
3. Call `/readyz` → **503** with `database: disconnected`.
4. Call `/api/v1/skills` → **500** after the pool times out.
5. `docker start skills-pg`, call `/readyz` again → **200**.

**What you just learned:** liveness should not depend on a downstream dependency; readiness should. If you swap them, one database restart turns into a full outage and a restart storm.

### 4.7 Level 2 checklist

- [ ] I ran the API and client locally.
- [ ] I registered, verified and logged in with curl.
- [ ] I reproduced the DB-down failure and explained the probe behaviour.
- [ ] I know where `.config.env` comes from and why it is ignored.

---

## 5. Level 3 — Tests, coverage and quality gates

**Goal:** understand what CI will run, and be able to run it locally before pushing.

### 5.1 Backend tests

```bash
cd apiserver
npm test                 # all Jest tests
npm run test:unit        # only __tests__/unit
npm run test:integration # only __tests__/integration
npm run test:coverage    # with coverage
```

`apiserver/jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./__tests__/setup.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'utils/**/*.js', 'services/**/*.js', 'controllers/**/*.js', 'middleware/**/*.js',
    '!node_modules/**',
  ],
  coverageThreshold: {
    global: { branches: 50, functions: 50, lines: 50, statements: 50 },
  },
};
```

Read `__tests__/setup.js` — it sets every env var **before** modules load. That is why tests do not need `.config.env`. It is also why test secrets are harmless strings.

Test suites present:

| Suite | What it proves |
| :--- | :--- |
| `unit/health.test.js` | `/healthz`, `/readyz`, `/metrics` contracts |
| `unit/controllers/skillController.test.js` | ownership + CRUD logic |
| `unit/services/authService.test.js` | register/login/session logic |
| `unit/utils/appError.test.js` | error shape |
| `unit/utils/catchAsync.test.js` | async error propagation |
| `unit/utils/jwt.test.js` | sign/verify/decode |
| `unit/utils/session.test.js` | encrypt/decrypt round-trip |
| `integration/auth.integration.test.js` | HTTP-level auth flow with `supertest` |

> `coverageThreshold` at 50% means `npm run test:coverage` **fails** below 50%. That is a quality gate, not a suggestion. Raising it over time (60 → 70 → 80) is a realistic senior task.

### 5.2 Frontend tests

```bash
cd client
npm test                  # react-scripts test, CI mode
npm run test:coverage
```

### 5.3 SonarQube configuration

`sonar-project.properties`:

```properties
sonar.projectKey=no
sonar.projectName=Node React Postgres
sonar.projectVersion=1.0

sonar.sources=apiserver,client/src
sonar.tests=apiserver/__tests__,client/src/__tests__
sonar.exclusions=**/node_modules/**,**/build/**,**/coverage/**,**/*.module.css
sonar.javascript.lcov.reportPaths=client/coverage/lcov.info,apiserver/coverage/lcov.info
sonar.test.inclusions=**/*.test.js,**/*.test.jsx
sonar.sourceEncoding=UTF-8
sonar.javascript.node.maxspace=4096
```

`sonar.projectKey=no` is a placeholder — it must match a real project in SonarCloud/SonarQube. This is one of the first things to fix if you fork the repo.

### 5.4 Why tests are a DevOps topic

- A pipeline without tests is just a delivery mechanism for bugs.
- Coverage thresholds turn "quality" into an enforceable number.
- Unit tests give fast feedback (seconds); integration tests catch wiring bugs; E2E (Cypress in `client/cypress/`) catches user-visible flows.
- The **test pyramid**: many unit, fewer integration, very few E2E.

### 5.5 Level 3 checklist

- [ ] `npm test` passes in both `apiserver` and `client`.
- [ ] I can read the coverage report (`coverage/lcov-report/index.html`).
- [ ] I can explain the difference between unit, integration and E2E tests here.
- [ ] I know what `coverageThreshold` does when it is not met.

---

## 6. Level 4 — Docker: build production images

**Goal:** explain every line of both Dockerfiles, build them, inspect them, and understand image size, layers, non-root users and health checks.

### 6.1 The backend Dockerfile, line by line

```dockerfile
# apiserver/Dockerfile
FROM node:18-bullseye-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:18-bullseye-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8010
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .
RUN mkdir -p /app/images && chown -R node:node /app/images
USER node
EXPOSE 8010
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:8010/healthz', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["node", "index.js"]
```

| Line | Why it exists | What breaks if removed |
| :--- | :--- | :--- |
| `AS deps` / `AS runtime` | multi-stage build | dev dependencies and npm cache ship to prod → bigger, more vulnerable image |
| `COPY package*.json ./` before source | layer caching | every code change reinstalls all packages (slow CI) |
| `npm ci --omit=dev` | deterministic, production-only | `npm install` may drift; devDeps add CVEs |
| `COPY --from=deps` | reuse installed modules | you would reinstall in runtime stage |
| `COPY --chown=node:node` | files owned by non-root user | `USER node` cannot write uploads |
| `RUN mkdir -p /app/images` | upload directory | `multer`/`sharp` fail on profile upload |
| `USER node` | non-root (UID 1000) | container runs as root → CIS/K8s `runAsNonRoot` violation |
| `EXPOSE 8010` | documentation only | nothing breaks, but tooling loses metadata |
| `HEALTHCHECK` | Docker-level health | Compose `depends_on: condition: service_healthy` cannot work |
| `CMD ["node","index.js"]` | exec form → PID 1 receives `SIGTERM` | shell form would swallow signals and break graceful shutdown |

**Critical detail:** `.config.env` is listed in `apiserver/.dockerignore`, so it is **not** in the build context. If it leaked into the image, every secret would be in an image layer forever. This is the single most important security property of this Dockerfile.

### 6.2 The frontend Dockerfile

```dockerfile
# client/Dockerfile
FROM node:18-bullseye-slim AS Builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.29-alpine
COPY --from=Builder /app/build /usr/share/nginx/html
RUN rm -rf /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/nginx-health || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

Why this is the right shape:

- React is compiled to **static files** at build time. There is no Node runtime in production.
- The runtime image is `nginx:alpine` (~50 MB) instead of a Node image (~200 MB+).
- `nginx -g "daemon off;"` keeps NGINX in the foreground so the container stays alive and receives signals.
- The build is **immutable**: the same image can be deployed anywhere; environment differences are injected at runtime.

### 6.3 Build, inspect, run

```bash
# build both
docker build -t skills-apiserver:local ./apiserver
docker build -t skills-client:local ./client

# size + layers
docker images | Select-String skills
docker history skills-apiserver:local

# run the API against your local Postgres
docker run --rm -p 8010:8010 \
  -e NODE_ENV=production \
  -e API_VERSION=v1 \
  -e PORT=8010 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_USER=postgres \
  -e DB_PASS=mypassword \
  -e DB_NAME=sampledb \
  -e DB_SSL=false \
  -e JWT_VERIFY_SECRET=dev-verify \
  -e JWT_SESSION_SECRET=dev-session \
  -e JWT_REFRESH_SECRET=dev-refresh \
  -e SESSION_ENCRYPT_SECRET=dev-encrypt \
  -e SESSION_ALGORITHM=aes-192-cbc \
  -e SESSION_COOKIE_NAME=__sample_session \
  -e PASSWORD_HASH_CYCLE=10 \
  skills-apiserver:local

curl.exe http://localhost:8010/healthz
```

On Windows, `host.docker.internal` resolves to the host. On Linux add `--add-host=host.docker.internal:host-gateway`.

### 6.4 Prove the security properties yourself

```bash
# 1. confirm non-root
docker run --rm skills-apiserver:local id
#    expected: uid=1000(node) gid=1000(node)

# 2. confirm no secrets in the image
docker run --rm skills-apiserver:local sh -c "ls -la /app | grep -i env || echo 'no env files'"

# 3. confirm no dev dependencies
docker run --rm skills-apiserver:local sh -c "ls node_modules | grep -E '^(jest|supertest)$' || echo 'no dev deps'"

# 4. scan it
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy:latest image --severity HIGH,CRITICAL skills-apiserver:local
```

### 6.5 Image best practices to be able to defend

| Practice | This repo | Why |
| :--- | :--- | :--- |
| Multi-stage build | yes | smaller attack surface |
| Pin base image tag | `node:18-bullseye-slim`, `nginx:1.29-alpine` | reproducibility; pinning by digest is even better |
| Non-root user | yes (API); NGINX master runs as root | NGINX needs root to bind 80 unless you use `nginx-unprivileged` |
| `.dockerignore` | yes | context size + secret leakage prevention |
| `HEALTHCHECK` | yes | Compose and orchestrators can act on it |
| Immutable tags in ECR | yes (`IMMUTABLE`) | prevents tag overwrite; forces SHA tags |
| No secrets in layers | yes | verified above |
| One process per container | yes | horizontal scaling, independent lifecycle |

### 6.6 Level 4 checklist

- [ ] I built both images and know their approximate sizes.
- [ ] I proved the container runs as UID 1000.
- [ ] I proved `.config.env` is not in the image.
- [ ] I can explain why the frontend image has no Node.js.

---

## 7. Level 5 — Docker Compose + local observability

**Goal:** run the entire system — database, API, frontend, Prometheus, Grafana — with one command, and understand the networking.

### 7.1 Read the Compose file as a system design

```yaml
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: mypassword
      POSTGRES_USER: postgres
      POSTGRES_DB: sampledb
    volumes:
      - dbdata:/var/lib/postgresql/data
    networks: [backend-net]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d sampledb"]
      interval: 10s
      timeout: 5s
      retries: 5

  apiserver:
    build: ./apiserver
    image: sahil9079/js-apiserver:v1.1.0
    ports: ["8010:8010"]
    depends_on:
      db:
        condition: service_healthy
    networks: [backend-net, frontend-net, monitoring-net]
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://127.0.0.1:8010/healthz', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"]

  client:
    build: ./client
    image: sahil9079/js-client:v1.1.0
    ports: ["80:80"]
    depends_on:
      apiserver:
        condition: service_healthy
    networks: [frontend-net]

  prometheus:
    image: prom/prometheus:v2.54.1
    ports: ["9090:9090"]
    volumes:
      - ./deploy/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./deploy/prometheus/alerts.yml:/etc/prometheus/alerts.yml:ro
    networks: [monitoring-net]

  grafana:
    image: grafana/grafana:11.2.0
    ports: ["3001:3000"]
    networks: [monitoring-net]

networks:
  frontend-net:
  backend-net:
  monitoring-net:
```

Why the three networks matter:

```
frontend-net : client  <-> apiserver
backend-net  : apiserver <-> db
monitoring-net: apiserver <-> prometheus <-> grafana
```

- `db` is **not** reachable from `client`. Blast radius is reduced.
- Prometheus can scrape the API but cannot reach the DB.
- This is the local rehearsal of the AWS VPC tiers (public / private app / private DB).

Other important details:

- `depends_on: condition: service_healthy` is why healthchecks exist. Compose waits for Postgres to accept connections and for the API to answer `/healthz` before starting the next service.
- Named volumes (`dbdata`, `prometheus_data`, `grafana_data`) survive `docker compose down`. `docker compose down -v` deletes them — be careful.
- `build:` + `image:` together means "build it, tag it with this name". Useful for reproducing the registry layout locally.
- Compose reads `apiserver/.config.env` if present (`env_file` with `required: false`) but the explicit `environment:` block overrides it. That is why the DB host is `db`, not `localhost`.

### 7.2 Run it

```bash
docker compose config          # validate + render
docker compose up --build -d
docker compose ps
docker compose logs -f apiserver
```

Verify:

```bash
curl.exe -i http://localhost:8010/healthz
curl.exe -i http://localhost:8010/readyz
curl.exe -i http://localhost/nginx-health
curl.exe -i http://localhost/api/v1/auth/check-auth     # 401 is correct (not logged in)
```

Open:
- app: `http://localhost`
- Prometheus: `http://localhost:9090/targets` (the `skills-apiserver` target must be UP)
- Grafana: `http://localhost:3001` (`admin` / `adminpassword`) → dashboard "Skills Platform"

### 7.3 Prove the dependency chain

```bash
docker compose stop db
docker compose ps                # apiserver stays "Up" but becomes unhealthy? check:
curl.exe -i http://localhost:8010/healthz   # 200
curl.exe -i http://localhost:8010/readyz    # 503
docker compose start db
```

Then try the reverse: `docker compose stop apiserver` and watch the client's `/api/` calls fail with **502 Bad Gateway** from NGINX. That 502 is the single most common production symptom; Section 14 drills it.

### 7.4 Level 5 checklist

- [ ] The whole stack starts with one command.
- [ ] Prometheus target is UP and I can query `http_requests_total`.
- [ ] I can explain why there are three networks.
- [ ] I reproduced the 503-on-readiness behaviour.

---

## 8. Level 6 — Kubernetes on your laptop

**Goal:** deploy the same stack to a real cluster, debug it, scale it, and understand every manifest.

### 8.1 Why Kubernetes after Compose

Compose answers "run these containers on one machine". Kubernetes answers "run these containers across many machines, restart them, route traffic to healthy ones, scale them, and roll out new versions without downtime". The concepts map directly:

| Docker Compose | Kubernetes |
| :--- | :--- |
| `service:` block | `Deployment` + `Service` |
| `ports:` | `containerPort` + `Service.port` / `targetPort` |
| `environment:` | `ConfigMap` + `Secret` (`envFrom`) |
| `volumes:` | `PersistentVolumeClaim` |
| `depends_on` | readiness probes + retries (no ordering) |
| `healthcheck` | `livenessProbe` / `readinessProbe` / `startupProbe` |
| `networks:` | `NetworkPolicy` (not configured in this repo) |
| `restart: unless-stopped` | `restartPolicy: Always` (default) |

### 8.2 Create a local cluster

```bash
# Option A: kind (recommended, fast)
kind create cluster --name skills --image kindest/node:v1.31.0

# Option B: minikube
minikube start --cpus=4 --memory=6g --kubernetes-version=v1.31.0

kubectl cluster-info
kubectl get nodes
```

### 8.3 Manifest reading order (memorise it)

1. `namespace.yaml` — the boundary everything lives in.
2. `configmap.yaml` — non-secret configuration.
3. `secret.yaml` — local-only secrets (or `external-secret.yaml` for AWS).
4. `serviceaccount.yaml` — the identity Pods use for AWS (IRSA).
5. `rbac.yaml` — what that identity may do inside the cluster.
6. `dbpvc.yaml` → `dbdep.yaml` → `dbsrc.yaml` — local database (skip in AWS; RDS replaces it).
7. `apidep.yaml` → `apisrc.yaml` — backend.
8. `clientdep.yaml` → `clientsrc.yaml` — frontend.
9. `ingress.yaml` — external entry point.
10. `hpa.yaml` — autoscaling.
11. `pdb.yaml` — disruption budget.
12. `kustomization.yaml` + `overlays/*` — composition per environment.

### 8.4 Namespace, ConfigMap and Secret

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: node-react-app
```

```yaml
# k8s/configmap.yaml (excerpt)
apiVersion: v1
kind: ConfigMap
metadata:
  name: configmap
  namespace: node-react-app
data:
  NODE_ENV: "production"
  PORT: "8010"
  API_VERSION: "v1"
  DB_HOST: "postgres-service"
  DB_PORT: "5432"
  DB_NAME: "sampledb"
  DB_SSL: "false"
  JWT_VERIFY_EXPIRY: "1d"
  JWT_SESSION_EXPIRY: "1d"
  JWT_REFRESH_EXPIRY: "30d"
  SESSION_ALGORITHM: "aes-192-cbc"
  SESSION_COOKIE_NAME: "__sample_session"
  PASSWORD_HASH_CYCLE: "10"
```

```yaml
# k8s/secret.yaml (LOCAL ONLY — the file says so itself)
apiVersion: v1
kind: Secret
metadata:
  name: my-secret
  namespace: node-react-app
type: Opaque
stringData:
  DB_USER: "postgres"
  DB_PASS: "mypassword"
  JWT_VERIFY_SECRET: "L6xOeIB5b1X7CnkXGRpCvaAJvFbHvS3a"
  JWT_SESSION_SECRET: "uGXbqsLwLb4gsGcqgtFgcrT3TGRMjchZ"
  JWT_REFRESH_SECRET: "1DVSMbLa6VzoiIYa7EwNLyb6QQX7Mr0B"
  SESSION_ENCRYPT_SECRET: "7EwNLyb6QQX7Mr0B"
```

> **Senior warning:** these secrets are committed in git. They are labelled "local placeholder", but they are still valid-looking keys. In production the `production` overlay uses `external-secret.yaml` and does **not** include `secret.yaml`. If you fork this, rotate these values and keep them out of git.

**ConfigMap vs Secret:** a Secret is only base64-encoded, not encrypted, in etcd unless you enable encryption at rest. The real protection is RBAC + not committing them + external secret stores.

### 8.5 The API Deployment, explained

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: apiserver
  namespace: node-react-app
spec:
  replicas: 2
  revisionHistoryLimit: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: apiserver
  template:
    metadata:
      labels:
        app: apiserver
        tier: backend
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8010"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: skills-app-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        runAsGroup: 1000
        fsGroup: 1000
      containers:
        - name: apiserver
          image: sahil9079/js-apiserver:v1.1.0
          imagePullPolicy: IfNotPresent
          ports:
            - name: apiserver-port
              containerPort: 8010
          envFrom:
            - configMapRef:
                name: configmap
            - secretRef:
                name: my-secret
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          startupProbe:
            httpGet: { path: /healthz, port: apiserver-port }
            failureThreshold: 12
            periodSeconds: 5
          livenessProbe:
            httpGet: { path: /healthz, port: apiserver-port }
            initialDelaySeconds: 10
            periodSeconds: 15
            timeoutSeconds: 3
            failureThreshold: 3
          readinessProbe:
            httpGet: { path: /readyz, port: apiserver-port }
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 3
```

Every field has a reason:

| Field | Meaning | Consequence if wrong |
| :--- | :--- | :--- |
| `replicas: 2` | two Pods | 1 replica = downtime during rollout |
| `maxUnavailable: 0`, `maxSurge: 1` | add a new Pod before removing an old one | `maxUnavailable: 1` with 2 replicas reduces capacity during deploys |
| `selector.matchLabels` | how the ReplicaSet owns Pods | must match `template.labels` or the Deployment is rejected |
| `revisionHistoryLimit: 5` | keep 5 old ReplicaSets | `kubectl rollout undo` needs history |
| `annotations prometheus.io/*` | scrape hints | metrics never collected |
| `runAsNonRoot` + `runAsUser: 1000` | matches `USER node` in the image | Pod fails with `CreateContainerConfigError` if the image runs as root |
| `requests` | scheduling guarantee | too high → Pending Pods; too low → noisy neighbour |
| `limits` | hard ceiling | memory over limit → **OOMKilled** |
| `startupProbe` | 12 × 5s = 60s to boot | slow boot would otherwise be killed by liveness |
| `livenessProbe` | restarts the container | pointing at `/readyz` causes restart storms during DB outages |
| `readinessProbe` | removes Pod from Service endpoints | pointing at `/healthz` sends traffic to a Pod that cannot reach the DB |

**Probe design rule:** startup → "has it finished booting?"; liveness → "is it permanently stuck?"; readiness → "can it serve traffic *right now*?".

### 8.6 The client Deployment

```yaml
spec:
  replicas: 2
  template:
    spec:
      serviceAccountName: skills-app-sa
      containers:
        - name: client-server
          image: sahil9079/js-client:v1.1.0
          ports:
            - name: client-port
              containerPort: 80
          resources:
            requests: { cpu: "50m", memory: "64Mi" }
            limits:   { cpu: "250m", memory: "256Mi" }
          livenessProbe:
            httpGet: { path: /nginx-health, port: client-port }
          readinessProbe:
            httpGet: { path: /nginx-health, port: client-port }
```

Note the Deployment is named `my-app-deployment` and the container `client-server`, but the label is `app: client-app`. Names are historical; the **labels** are what connect Deployments to Services. A senior always checks labels first when a Service has no endpoints.

### 8.7 Services, and the `apiserver` alias trick

```yaml
# k8s/apisrc.yaml
apiVersion: v1
kind: Service
metadata:
  name: apiserver-service
spec:
  type: ClusterIP
  selector: { app: apiserver }
  ports:
    - protocol: TCP
      port: 8010
      targetPort: apiserver-port
```

```yaml
# k8s/apisrc.yaml also defines this alias
apiVersion: v1
kind: Service
metadata:
  name: apiserver
spec:
  type: ClusterIP
  selector: { app: apiserver }
  ports:
    - port: 8010
      targetPort: apiserver-port
```

Why: `client/nginx.conf` hardcodes `proxy_pass http://apiserver:8010`. NGINX resolves upstream names at **startup**. In Compose, `apiserver` exists. In Kubernetes, without this alias, the client Pod crashes with:

```
nginx: [emerg] host not found in upstream "apiserver" in /etc/nginx/conf.d/default.conf:17
```

This is a great example of a **local-vs-cluster parity bug**. The "proper" fixes are (a) this alias, (b) a `ConfigMap`-driven `nginx.conf` template, or (c) `resolver` + variable in `proxy_pass`. The repo chose (a), which is simple and works.

`type: ClusterIP` for the client is also correct: the ALB Ingress exposes it, so no `NodePort`/`LoadBalancer` is needed.

### 8.8 Ingress: how the ALB gets created

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: skills-platform-ingress
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/group.name: skills-platform-alb
    alb.ingress.kubernetes.io/healthcheck-path: /healthz
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}]'
spec:
  ingressClassName: alb
  rules:
    - http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service: { name: apiserver-service, port: { number: 8010 } }
          - path: /
            pathType: Prefix
            backend:
              service: { name: client-service, port: { number: 80 } }
```

Key ideas:

- `ingressClassName: alb` requires the **AWS Load Balancer Controller** to be installed in the cluster. Without it, the Ingress exists but no ALB is created (`kubectl describe ingress` shows no address).
- `target-type: ip` registers **Pod IPs** directly (works with the VPC CNI), avoiding an extra NodePort hop.
- `group.name` merges multiple Ingresses into one ALB (cost saving).
- Path order matters: `/api` is more specific than `/`, and ALB evaluates by longest prefix.
- For HTTPS you uncomment the certificate/listen-ports/ssl-redirect annotations (shown commented in the file).

### 8.9 Autoscaling and disruption

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: apiserver-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: apiserver
  minReplicas: 2
  maxReplicas: 6
  metrics:
    - type: Resource
      resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } }
    - type: Resource
      resource: { name: memory, target: { type: Utilization, averageUtilization: 80 } }
```

HPA needs `metrics-server`. On kind:

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl patch deployment metrics-server -n kube-system --type=json \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
kubectl top pods -n node-react-app
```

**Why memory-based HPA is risky:** Node.js does not return memory to the OS promptly, so memory utilisation stays high and HPA scales up without relief. CPU is the safer primary signal; memory should be an alert, not an autoscaling trigger, for this workload.

```yaml
# pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: apiserver-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels: { app: apiserver }
```

PDB protects against **voluntary** disruptions: node drains, cluster upgrades. With `minAvailable: 1` and 2 replicas, a drain evicts one Pod at a time. It does **not** protect against crashes (that is what replicas and probes are for).

### 8.10 RBAC and ServiceAccount

```yaml
# k8s/serviceaccount.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: skills-app-sa
  namespace: node-react-app
  annotations:
    eks.amazonaws.com/role-arn: "arn:aws:iam::REPLACE_AWS_ACCOUNT_ID:role/skills-lab-workload-irsa-role"
automountServiceAccountToken: false
```

```yaml
# k8s/rbac.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: skills-app-readonly-role
rules:
  - apiGroups: [""]
    resources: ["configmaps", "pods", "services"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: skills-app-readonly-binding
subjects:
  - kind: ServiceAccount
    name: skills-app-sa
    namespace: node-react-app
roleRef:
  kind: Role
  name: skills-app-readonly-role
  apiGroup: rbac.authorization.k8s.io
```

Three things to know:

1. **The app does not need Kubernetes API access at all.** Granting read-only pods/configmaps is unnecessary privilege. A senior would delete this RoleBinding or scope it to a real need.
2. `automountServiceAccountToken: false` is good hygiene — the app does not call the API.
3. But the AWS annotation **conflicts** with that setting in older IRSA setups: the AWS SDK reads the projected token, not the legacy mounted one. The modern path is **EKS Pod Identity** (Section 10.6), which does not need the annotation.

### 8.11 Local database vs RDS

`k8s/dbdep.yaml` runs `postgres:15-alpine` with a PVC:

```yaml
volumes:
  - name: db-storage
    persistentVolumeClaim:
      claimName: db-pvc
```

```yaml
# k8s/dbpvc.yaml — NOTE: the indentation in the committed file is invalid YAML
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: db-pvc
  namespace: node-react-app
  labels:
    app: postgres-db
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 3Gi
  storageClassName: standard
```

> **Real bug in this repo:** the committed `k8s/dbpvc.yaml` has `labels` indented one level too deep, and `kubectl kustomize k8s` fails with `MalformedYAMLError: yaml: line 6: mapping values are not allowed in this context`. The corrected version is shown above. This is your first legitimate pull request (Section 19).

The local DB is for laptop learning only. In AWS, RDS replaces it, which is why the `lab`/`production` overlays **do not include** `dbdep.yaml`, `dbsrc.yaml` or `dbpvc.yaml`.

### 8.12 Kustomize: one base, many environments

`k8s/kustomization.yaml`:

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: node-react-app
resources:
  - namespace.yaml
  - serviceaccount.yaml
  - rbac.yaml
  - configmap.yaml
  - secret.yaml
  - dbpvc.yaml
  - dbdep.yaml
  - dbsrc.yaml
  - apidep.yaml
  - apisrc.yaml
  - clientdep.yaml
  - clientsrc.yaml
  - ingress.yaml
  - hpa.yaml
  - pdb.yaml
```

`k8s/overlays/lab/kustomization.yaml`:

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: node-react-app
resources:
  - ../../namespace.yaml
  - ../../serviceaccount.yaml
  - ../../rbac.yaml
  - ../../configmap.yaml
  - ../../secret.yaml
  - ../../apidep.yaml
  - ../../apisrc.yaml
  - ../../clientdep.yaml
  - ../../clientsrc.yaml
  - ../../ingress.yaml
  - ../../hpa.yaml
  - ../../pdb.yaml
patches:
  - target: { kind: ConfigMap, name: configmap }
    patch: |-
      - op: replace
        path: /data/DB_HOST
        value: "skills-lab-postgres.REPLACE_RDS_ID.ap-south-1.rds.amazonaws.com"
      - op: replace
        path: /data/DB_SSL
        value: "true"
  - target: { kind: Deployment, name: apiserver }
    patch: |-
      - op: replace
        path: /spec/replicas
        value: 1
```

`production` is the same idea but includes `external-secret.yaml` instead of `secret.yaml`, uses 3 API replicas and 2 client replicas, and points at the prod RDS endpoint.

Render without applying (your most-used command):

```bash
kubectl kustomize k8s/overlays/lab | Select-Object -First 80
```

> **Second real bug:** from the `lab` overlay directory, Kustomize refuses `../../` paths by default (`security; file ... is not in or below ...`). Render with:
> ```bash
> kubectl kustomize --load-restrictor LoadRestrictionsNone k8s/overlays/lab
> ```
> A cleaner fix is to make the overlay reference the base (`resources: [../..]`) and patch by name. That is a good PR.

### 8.13 Deploy to kind (step by step)

> **Before you start:** the committed `k8s/dbpvc.yaml` is invalid YAML (Section 8.11), so `kubectl apply -k k8s` fails until you fix it on your branch. Fix it first — that is part of the exercise.

```bash
# 1. build images and load them into the cluster (kind cannot pull from your local Docker daemon)
docker build -t skills-apiserver:local ./apiserver
docker build -t skills-client:local ./client
kind load docker-image skills-apiserver:local --name skills
kind load docker-image skills-client:local --name skills

# 2. apply the base (it includes the in-cluster Postgres)
kubectl apply -k k8s

# 3. watch it come up
kubectl get pods -n node-react-app -w

# 4. if you built local images, point the Deployments at them
kubectl set image deployment/apiserver apiserver=skills-apiserver:local -n node-react-app
kubectl set image deployment/my-app-deployment client-server=skills-client:local -n node-react-app

# 5. port-forward instead of an Ingress (no AWS controller locally)
kubectl port-forward -n node-react-app svc/apiserver-service 8010:8010
kubectl port-forward -n node-react-app svc/client-service 8080:80
```

Then open `http://localhost:8080`. The client's `/api/` calls will fail unless you also port-forward and use a different proxy; the simplest local check is to hit the API directly on `8010`.

### 8.14 The kubectl debugging ladder (learn this order)

```bash
kubectl get pods -n node-react-app
kubectl describe pod <pod> -n node-react-app      # Events at the bottom are gold
kubectl logs <pod> -n node-react-app
kubectl logs <pod> -n node-react-app --previous   # crashed container's last logs
kubectl exec -it <pod> -n node-react-app -- sh
kubectl get events -n node-react-app --sort-by=.lastTimestamp
kubectl get endpoints -n node-react-app           # empty endpoints = label mismatch
kubectl top pods -n node-react-app                # needs metrics-server
```

Mapping symptoms to causes:

| Symptom | First thing to check |
| :--- | :--- |
| `ImagePullBackOff` | image name/tag, registry auth, `imagePullSecrets` |
| `CrashLoopBackOff` | `kubectl logs --previous`, env vars, DB reachability |
| `OOMKilled` (exit 137) | memory limit vs actual usage, Node heap |
| `Pending` | resource requests vs node capacity, PVC binding |
| `Running` but not Ready | readiness probe path/port, DB connection |
| Service has no endpoints | selector vs Pod labels |
| `host not found in upstream` | the `apiserver` Service alias |
| Ingress has no address | AWS LB Controller missing / IAM |

### 8.15 Level 6 checklist

- [ ] I deployed the base manifests to kind/minikube.
- [ ] I found and fixed the `dbpvc.yaml` YAML error.
- [ ] I can explain `maxUnavailable: 0` and the three probes.
- [ ] I can explain why the `apiserver` Service alias exists.
- [ ] I can debug a `CrashLoopBackOff` from logs and events.

---

## 9. Level 7 — Terraform: build AWS from zero

**Goal:** understand and execute the infrastructure in `infra/`, safely, with remote state and cost awareness.

### 9.1 The mental model

Terraform is a **desired-state engine**, not a scripting tool:

```
.tf files  --plan-->  "here is what I want"   ----+
                                                  +--> diff --> apply --> AWS
terraform.tfstate --read--> "here is what exists" +
```

If state is lost, Terraform loses the mapping between code and real resources. That is why state lives in S3 with versioning and locking.

### 9.2 Module layout

```
infra/
├── bootstrap/main.tf          # S3 bucket for remote state (run ONCE)
├── modules/
│   ├── network/main.tf        # VPC, subnets, IGW, NAT, route tables, security groups
│   ├── ecr/main.tf            # image repositories + lifecycle policy
│   ├── eks/main.tf            # cluster, IAM roles, managed node group
│   ├── rds/main.tf            # PostgreSQL + Secrets Manager secret
│   └── iam/main.tf            # GitHub OIDC role + workload (IRSA) role
└── envs/lab/main.tf           # wires the modules together for one environment
```

Rule: **modules are reusable, environments are concrete**. You never edit a module to change one environment; you pass different variables or patch with overlays.

### 9.3 Bootstrap: create the state bucket first

```hcl
# infra/bootstrap/main.tf (core resources)
resource "aws_s3_bucket" "tfstate" {
  bucket = var.state_bucket_name
  lifecycle { prevent_destroy = true }
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket                  = aws_s3_bucket.tfstate.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

Why each one matters:

- **Versioning** lets you recover a corrupted/rolled-back state file.
- **Encryption** protects resource metadata and any sensitive values stored in state.
- **Public access block** — state often contains passwords. A public bucket is a breach.
- **`prevent_destroy`** stops an accidental `terraform destroy` from deleting the bucket that stores your state (a chicken-and-egg disaster).

Run it:

```bash
cd infra/bootstrap
terraform init
terraform plan -var="state_bucket_name=skills-tfstate-<your-unique-suffix>"
terraform apply -var="state_bucket_name=skills-tfstate-<your-unique-suffix>"
```

Then uncomment the backend in `infra/envs/lab/main.tf`:

```hcl
terraform {
  backend "s3" {
    bucket       = "skills-tfstate-<your-unique-suffix>"
    key          = "skills-platform/lab/terraform.tfstate"
    region       = "ap-south-1"
    encrypt      = true
    use_lockfile = true
  }
}
```

`use_lockfile = true` is the modern replacement for a DynamoDB lock table (Terraform ≥ 1.10). It uses S3 conditional writes to prevent two engineers applying at once.

```bash
cd infra/envs/lab
terraform init -migrate-state
```

### 9.4 Network module: the actual AWS topology

```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr          # 10.0.0.0/16
  enable_dns_support   = true
  enable_dns_hostnames = true
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.azs[count.index]
  map_public_ip_on_launch = true
  tags = {
    "kubernetes.io/role/elb"                    = "1"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
}

resource "aws_subnet" "private_app" {
  count             = length(var.private_app_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_app_subnet_cidrs[count.index]
  availability_zone = var.azs[count.index]
  tags = {
    "kubernetes.io/role/internal-elb"           = "1"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
}

resource "aws_subnet" "private_db" {
  count             = length(var.private_db_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_db_subnet_cidrs[count.index]
  availability_zone = var.azs[count.index]
}
```

Address plan:

```
VPC 10.0.0.0/16
├── public     10.0.1.0/24  (ap-south-1a)   ALB, NAT gateway
├── public     10.0.2.0/24  (ap-south-1b)
├── private-app 10.0.11.0/24 (ap-south-1a)  EKS nodes/pods
├── private-app 10.0.12.0/24 (ap-south-1b)
├── private-db  10.0.21.0/24 (ap-south-1a)  RDS
└── private-db  10.0.22.0/24 (ap-south-1b)
```

**Why the subnet tags matter:** the AWS Load Balancer Controller and the EKS cloud provider read `kubernetes.io/role/elb` and `kubernetes.io/cluster/<name>` to decide where to place load balancers. Without them, the Ingress never gets an ALB.

NAT gateways:

```hcl
resource "aws_eip" "nat" {
  count  = var.single_nat_gateway ? 1 : length(var.azs)
  domain = "vpc"
}

resource "aws_nat_gateway" "nat" {
  count         = var.single_nat_gateway ? 1 : length(var.azs)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  depends_on    = [aws_internet_gateway.igw]
}
```

Cost/HA trade-off you must be able to explain:

- `single_nat_gateway = true` → ~$32/mo for one NAT + data processing. If AZ-a fails, private subnets in AZ-b lose egress.
- `false` → one NAT per AZ, HA, roughly double the cost.
- Lab uses `true`; production should use `false`.

Security groups form a **chain**:

```
Internet --80/443--> [alb-sg] --80/8010--> [eks-workloads-sg] --5432--> [rds-sg]
```

```hcl
resource "aws_security_group" "rds" {
  name   = "${var.project_name}-${var.environment}-rds-sg"
  vpc_id = aws_vpc.main.id
  ingress {
    description     = "PostgreSQL 5432 from EKS workloads only"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_workloads.id]
  }
}
```

Note there is **no egress rule** on `rds-sg`; AWS's default when you define no egress is deny-all. For a database that is correct. Also note RDS has no `cidr_blocks` ingress at all — only a security-group reference. That is true least privilege.

> **Gap to be aware of:** `eks_workloads_sg` is created by Terraform, but the EKS managed node group does not attach it explicitly (`aws_eks_node_group` has no `vpc_config.security_group_ids` in this module). The node group gets the cluster security group by default. In a real environment you would attach `eks_workloads_sg` to the nodes (or use Security Groups for Pods) so the RDS rule actually matches. Flag it, understand it, fix it on a branch.

### 9.5 ECR module: immutable images + lifecycle

```hcl
resource "aws_ecr_repository" "repos" {
  for_each             = toset(var.repositories)
  name                 = each.value
  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration { scan_on_push = true }
  encryption_configuration { encryption_type = "AES256" }
}

resource "aws_ecr_lifecycle_policy" "cleanup" {
  for_each   = aws_ecr_repository.repos
  repository = each.value.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep only the last 15 immutable tagged images to control ECR storage cost"
      selection    = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 15 }
      action       = { type = "expire" }
    }]
  })
}
```

- `IMMUTABLE` means you cannot overwrite `v1.1.0`; you must push a new tag. Combined with `github.sha` tags, every deploy is traceable to a commit.
- `scan_on_push` runs a basic CVE scan automatically.
- Lifecycle policy controls storage cost — ECR charges per GB-month.

### 9.6 EKS module

```hcl
resource "aws_eks_cluster" "main" {
  name     = var.cluster_name
  role_arn = aws_iam_role.eks_cluster.arn
  version  = var.kubernetes_version       # 1.31
  vpc_config {
    subnet_ids              = var.private_app_subnet_ids
    endpoint_private_access = true
    endpoint_public_access  = true
  }
  enabled_cluster_log_types = ["api", "audit", "authenticator"]
  depends_on = [aws_iam_role_policy_attachment.eks_cluster_policy]
}

resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.cluster_name}-node-group"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = var.private_app_subnet_ids
  instance_types  = var.node_instance_types     # t3.medium
  scaling_config {
    desired_size = 2
    min_size     = 1
    max_size     = 3
  }
  update_config { max_unavailable = 1 }
}
```

Explanations:

- **Control plane vs data plane.** EKS manages the control plane (API server, etcd). The node group is the data plane where your Pods run.
- `endpoint_public_access = true` makes learning easy but is a security trade-off. Production should use `false` + VPN/bastion, or a CIDR allowlist (`public_access_cidrs`).
- `enabled_cluster_log_types` ships control-plane logs to CloudWatch. `audit` logs are essential for compliance and incident forensics.
- `max_unavailable = 1` means node upgrades drain one node at a time — slow but safe.
- Three IAM policies are required on the node role: `AmazonEKSWorkerNodePolicy`, `AmazonEKS_CNI_Policy`, `AmazonEC2ContainerRegistryReadOnly`. Missing ECR read → `ImagePullBackOff`.

### 9.7 RDS module

```hcl
resource "aws_db_instance" "postgres" {
  identifier              = "${var.project_name}-${var.environment}-postgres"
  engine                  = "postgres"
  engine_version          = "15"
  instance_class          = var.instance_class        # db.t4g.micro
  allocated_storage       = 20
  max_allocated_storage   = 50
  storage_type            = "gp3"
  storage_encrypted       = true
  db_name                 = var.db_name
  username                = var.db_username
  password                = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.rds.name
  vpc_security_group_ids  = [var.rds_sg_id]
  publicly_accessible     = false
  multi_az                = var.multi_az
  backup_retention_period = 7
  deletion_protection     = false
  skip_final_snapshot     = var.skip_final_snapshot
}
```

| Setting | Lab | Production | Why |
| :--- | :--- | :--- | :--- |
| `publicly_accessible` | false | false | never expose a database to the internet |
| `multi_az` | false | **true** | synchronous standby + automatic failover |
| `backup_retention_period` | 7 | 7-35 | point-in-time recovery window |
| `deletion_protection` | false | **true** | prevents accidental destroy |
| `skip_final_snapshot` | true | **false** | you want a snapshot before deletion |
| `storage_encrypted` | true | true | encryption at rest |
| `max_allocated_storage` | 50 | sized | storage autoscaling headroom |

Secrets Manager:

```hcl
resource "aws_secretsmanager_secret" "app_credentials" {
  name                    = "prod/node-react-app/credentials"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "app_credentials" {
  secret_id = aws_secretsmanager_secret.app_credentials.id
  secret_string = jsonencode({
    DB_USER                = var.db_username
    DB_PASS                = var.db_password
    JWT_VERIFY_SECRET      = "replace-in-aws-secrets-manager-jwt-verify"
    JWT_SESSION_SECRET     = "replace-in-aws-secrets-manager-jwt-session"
    JWT_REFRESH_SECRET     = "replace-in-aws-secrets-manager-jwt-refresh"
    SESSION_ENCRYPT_SECRET = "replace-in-aws-secrets-manager-session-enc"
  })
}
```

**Important:** the Terraform state now contains the DB password and the secret JSON. That is exactly why the state bucket must be private and encrypted. For higher maturity, generate passwords with `random_password` and never write them to `tfvars`.

> **Bug worth noticing:** `recovery_window_in_days = 0` allows immediate deletion. It is convenient for lab teardown but dangerous in production (no undo). Also, the secret name is hardcoded to `prod/...` even in the lab environment. A senior parameterises it as `"${var.environment}/node-react-app/credentials"`.

### 9.8 IAM module: OIDC instead of access keys

```hcl
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

resource "aws_iam_role" "github_actions_deploy" {
  name = "${var.project_name}-${var.environment}-github-oidc-deploy-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.github.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:ref:refs/heads/main"
        }
      }
    }]
  })
}
```

Why this is the modern standard:

- **No long-lived AWS access keys** in GitHub secrets. Nothing to leak, rotate, or accidentally commit.
- GitHub issues a short-lived OIDC JWT; AWS STS exchanges it for temporary credentials.
- The `sub` condition restricts *which repository and branch* can assume the role. Without it, any GitHub repo could try.
- The role policy is least-privilege: ECR auth/push/pull for `skills-*` repos, plus `eks:DescribeCluster`.

> **Gap:** the role has `eks:DescribeCluster` but the workflow also runs `kubectl apply`, `set image`, `rollout status` and `rollout undo`. Those require **Kubernetes** permissions, which come from the EKS `aws-auth` ConfigMap / EKS access entries, not IAM alone. In practice you must map this role into the cluster (access entry with `AmazonEKSClusterAdminPolicy` or a scoped policy). Without that, the deploy job fails at `kubectl` with `error: You must be logged in to the server (Unauthorized)`. This is one of the most common real EKS+OIDC failures — know it.

### 9.9 Apply the lab environment

```bash
cd infra/envs/lab
terraform init
terraform fmt -check
terraform validate
terraform plan -out=tfplan
terraform apply tfplan
```

Set the DB password without writing it to a file:

```bash
$env:TF_VAR_db_password = "Use-A-Strong-Password-123!"
terraform apply
```

Or:

```powershell
Copy-Item terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars (git-ignored)
terraform apply
```

Expected outputs:

```
vpc_id                        = "vpc-..."
ecr_repository_urls           = { skills-apiserver = "...", skills-client = "..." }
eks_cluster_name              = "skills-lab-eks"
rds_private_endpoint          = "skills-lab-postgres....rds.amazonaws.com"
github_actions_oidc_role_arn  = "arn:aws:iam::...:role/skills-lab-github-oidc-deploy-role"
```

Cost warning (ap-south-1, approximate): EKS control plane ~$73/mo, 2 × t3.medium nodes ~$60/mo, NAT ~$32/mo, RDS db.t4g.micro ~$13/mo, ALB ~$18/mo, plus storage/data. **A running lab is roughly $150-200/month.** Destroy it when you are done (Section 14.7 and `AWS_COST_OPTIMIZATION_AND_CLEANUP.md`).

### 9.10 Terraform habits of a senior

```bash
terraform fmt -recursive      # formatting
terraform validate            # syntax + provider schema
terraform plan -out=tfplan    # always save the plan
terraform show tfplan         # review before applying
terraform apply tfplan        # apply exactly what you reviewed
terraform state list          # what is managed
terraform state show <addr>   # attributes of one resource
terraform plan -refresh-only  # detect drift without changing anything
terraform import <addr> <id>  # adopt an existing resource
```

Rules:

1. Never run `apply` without reading the plan. Look for `-/+` (replace) — replacement of RDS or EKS means data loss/downtime.
2. Never edit state by hand. Use `terraform state mv/rm`.
3. Commit `.terraform.lock.hcl` (this repo git-ignores it — debatable; most teams commit it for provider pinning).
4. One state per environment.
5. Tag everything (the `default_tags` block does this).

### 9.11 Level 7 checklist

- [ ] I created the S3 state bucket and migrated the lab env to remote state.
- [ ] I ran `fmt`, `validate`, `plan` and read the plan.
- [ ] I can explain public vs private-app vs private-db subnets.
- [ ] I can explain why OIDC is better than access keys.
- [ ] I know the approximate monthly cost and how to destroy everything.

---

## 10. Level 8 — Deploy to Amazon EKS

**Goal:** go from "Terraform finished" to "the app is reachable through an ALB".

### 10.1 Prerequisites

```bash
# 1. correct AWS identity
aws sts get-caller-identity
# 2. region
aws configure get region      # expect ap-south-1
# 3. kubeconfig
aws eks update-kubeconfig --region ap-south-1 --name skills-lab-eks
kubectl config current-context
kubectl get nodes
```

If `kubectl get nodes` returns `Unauthorized`, your IAM principal is not mapped into the cluster. Fix with an EKS **access entry**:

```bash
aws eks create-access-entry \
  --cluster-name skills-lab-eks \
  --principal-arn arn:aws:iam::<ACCOUNT_ID>:role/<YOUR_ROLE> \
  --type STANDARD

aws eks associate-access-policy \
  --cluster-name skills-lab-eks \
  --principal-arn arn:aws:iam::<ACCOUNT_ID>:role/<YOUR_ROLE> \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
  --access-scope type=cluster
```

### 10.2 Install the AWS Load Balancer Controller

The Ingress in this repo does nothing until the controller exists.

```bash
# 1. IAM policy for the controller
curl -O https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json
aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam_policy.json

# 2. IRSA service account (replace ACCOUNT_ID and VPC_ID / cluster name)
eksctl create iamserviceaccount \
  --cluster=skills-lab-eks \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --attach-policy-arn=arn:aws:iam::<ACCOUNT_ID>:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve

# 3. Helm install
helm repo add eks https://aws.github.io/eks-charts
helm repo update
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=skills-lab-eks \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region=ap-south-1 \
  --set vpcId=<VPC_ID>
```

Verify:

```bash
kubectl get deployment -n kube-system aws-load-balancer-controller
kubectl logs -n kube-system deployment/aws-load-balancer-controller | Select-Object -First 20
```

### 10.3 Install metrics-server (for HPA)

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl get apiservice v1beta1.metrics.k8s.io
kubectl top nodes
```

On EKS, metrics-server usually works without the `--kubelet-insecure-tls` patch (that is a kind-specific hack).

### 10.4 Install External Secrets Operator (production overlay)

The `production` overlay uses `external-secret.yaml`, which requires ESO and a service account that can read Secrets Manager.

```bash
helm repo add external-secrets https://charts.external-secrets.io
helm repo update
helm install external-secrets external-secrets/external-secrets \
  -n external-secrets --create-namespace
```

Then create the auth service account referenced by `ClusterSecretStore`:

```yaml
# external-secrets-sa.yaml (you create this)
apiVersion: v1
kind: ServiceAccount
metadata:
  name: external-secrets-sa
  namespace: external-secrets
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::<ACCOUNT_ID>:role/skills-lab-workload-irsa-role
```

```bash
kubectl apply -f external-secrets-sa.yaml
kubectl get clustersecretstore aws-secretsmanager
kubectl get externalsecret -n node-react-app
kubectl get secret my-secret -n node-react-app
```

### 10.5 Prepare the RDS endpoint in the overlay

```bash
terraform -chdir=infra/envs/lab output rds_private_endpoint
```

Edit `k8s/overlays/lab/kustomization.yaml` and replace `REPLACE_RDS_ID` with the real endpoint. Do this on your branch. Then render:

```bash
kubectl kustomize --load-restrictor LoadRestrictionsNone k8s/overlays/lab | Select-String "DB_HOST" -Context 0,1
```

### 10.6 Pod identity vs IRSA (know both)

| | IRSA (annotation) | EKS Pod Identity |
| :--- | :--- | :--- |
| How | `eks.amazonaws.com/role-arn` on the ServiceAccount | EKS Pod Identity association |
| Trust policy | OIDC provider federated | `pods.eks.amazonaws.com` |
| Rotation | token projected by webhook | agent handles it |
| Current repo | annotation + `pods.eks.amazonaws.com` trust (mixed) | recommended |

The repo's `iam/main.tf` trust policy already uses `pods.eks.amazonaws.com`, which is the **Pod Identity** trust model, while `serviceaccount.yaml` uses the **IRSA** annotation. That mismatch is a real configuration bug: pick one. For new clusters, Pod Identity is simpler.

```bash
# Pod Identity path
aws eks create-pod-identity-association \
  --cluster-name skills-lab-eks \
  --namespace node-react-app \
  --service-account skills-app-sa \
  --role-arn arn:aws:iam::<ACCOUNT_ID>:role/skills-lab-workload-irsa-role
```

### 10.7 Deploy

```bash
kubectl apply -k k8s/overlays/lab
kubectl get pods,svc,ingress,hpa,pdb -n node-react-app
kubectl rollout status deployment/apiserver -n node-react-app
kubectl rollout status deployment/my-app-deployment -n node-react-app
```

Watch the ALB being created:

```bash
kubectl get ingress -n node-react-app -w
# ADDRESS appears after ~2-3 minutes
```

Test:

```bash
$ALB = kubectl get ingress skills-platform-ingress -n node-react-app -o jsonpath="{.status.loadBalancer.ingress[0].hostname}"
curl.exe -i "http://$ALB/healthz"
curl.exe -i "http://$ALB/nginx-health"
```

### 10.8 Level 8 checklist

- [ ] I can run `aws sts get-caller-identity` and `kubectl get nodes` without errors.
- [ ] The LB controller is running and the Ingress has an ALB address.
- [ ] I deployed the lab overlay and the Pods are Ready.
- [ ] I can explain IRSA vs Pod Identity and the mismatch in this repo.
- [ ] I know how to roll back (`kubectl rollout undo`).

---

## 11. Level 9 — CI/CD with GitHub Actions + AWS OIDC

**Goal:** read both workflows, understand every gate, and reproduce the pipeline locally.

### 11.1 Two workflows, two jobs

| Workflow | Trigger | Purpose |
| :--- | :--- | :--- |
| `main.yaml` | push/PR to `main`, manual | CI: tests, coverage, Sonar, audit, Trivy, image build |
| `deploy-lab.yml` | manual (`workflow_dispatch`) | CD: OIDC → ECR push → EKS rollout → smoke + auto-rollback |

Why manual CD for a lab: cost and safety. A senior would add an approval `environment` and a real promotion path (lab → production).

### 11.2 CI workflow, job by job

```yaml
name: CI - Build, Test, SonarQube & Trivy DevSecOps Gate
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
  workflow_dispatch:

permissions:
  contents: read

jobs:
  testing:
    strategy:
      matrix:
        service: [apiserver, client]
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"
          cache-dependency-path: ${{ matrix.service }}/package-lock.json
      - run: npm ci
        working-directory: ${{ matrix.service }}
      - run: npm test -- --coverage --watchAll=false
        working-directory: ${{ matrix.service }}
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-${{ matrix.service }}
          path: ${{ matrix.service }}/coverage/
```

Key ideas:

- **Matrix** runs the same job for both services in parallel. Adding a service later is one line.
- **`cache: npm` + `cache-dependency-path`** is per-service; using the wrong path makes the cache useless.
- **`npm ci`** guarantees lockfile fidelity.
- **Coverage artifacts** are passed to the Sonar job, so the scanner does not need to re-run tests.
- `permissions: contents: read` is least privilege for CI.

Sonar job:

```yaml
  sonarqube:
    needs: testing
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/download-artifact@v4
        with: { name: coverage-apiserver, path: apiserver/coverage }
      - uses: actions/download-artifact@v4
        with: { name: coverage-client, path: client/coverage }
      - uses: SonarSource/sonarqube-scan-action@v5.2.0
        if: ${{ env.SONAR_TOKEN != '' }}
```

`fetch-depth: 0` is required for accurate "new code" analysis and blame. `if: env.SONAR_TOKEN != ''` makes the job skip gracefully on forks without secrets.

Security job:

```yaml
  security_and_containers:
    needs: testing
    steps:
      - run: |
          cd apiserver && npm audit --json > npm-audit-apiserver.json || true
          cd ../client && npm audit --json > npm-audit-client.json || true
      - uses: aquasecurity/trivy-action@0.28.0
        with:
          scan-type: "fs"
          scan-ref: "."
          scanners: "vuln,secret,misconfig"
          exit-code: "0"
      - run: |
          docker build -t skills-apiserver:${{ github.sha }} ./apiserver
          docker build -t skills-client:${{ github.sha }} ./client
      - uses: aquasecurity/trivy-action@0.28.0
        with:
          image-ref: "skills-apiserver:${{ github.sha }}"
          exit-code: "0"
          severity: "CRITICAL,HIGH"
```

**The most important DevOps lesson in this repo:** `exit-code: "0"` means the scans **report but never block**. A real DevSecOps gate uses `exit-code: "1"` with a documented exception list. Understanding this difference is exactly the fresher-vs-senior gap. Start with `0` to see the findings, then tighten to `1` once the backlog is clean.

### 11.3 CD workflow, step by step

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [lab, production]

permissions:
  id-token: write      # REQUIRED for OIDC
  contents: read

env:
  AWS_REGION: ap-south-1
  EKS_CLUSTER_NAME: skills-lab-eks
  K8S_NAMESPACE: node-react-app

jobs:
  deploy_eks:
    environment: ${{ inputs.environment || 'lab' }}
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_OIDC_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
      - run: aws sts get-caller-identity
      - uses: aws-actions/amazon-ecr-login@v2
        id: login-ecr
      - run: |
          REGISTRY=${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG=${{ github.sha }}
          docker build -t $REGISTRY/skills-apiserver:$IMAGE_TAG ./apiserver
          docker push $REGISTRY/skills-apiserver:$IMAGE_TAG
          docker build -t $REGISTRY/skills-client:$IMAGE_TAG ./client
          docker push $REGISTRY/skills-client:$IMAGE_TAG
      - run: |
          aws eks update-kubeconfig --region ${{ env.AWS_REGION }} --name ${{ env.EKS_CLUSTER_NAME }}
          kubectl apply -k k8s/overlays/${{ inputs.environment || 'lab' }}
          kubectl set image deployment/apiserver apiserver=$REGISTRY/skills-apiserver:$IMAGE_TAG -n ${{ env.K8S_NAMESPACE }}
          kubectl set image deployment/my-app-deployment client-server=$REGISTRY/skills-client:$IMAGE_TAG -n ${{ env.K8S_NAMESPACE }}
      - run: |
          kubectl rollout status deployment/apiserver -n ${{ env.K8S_NAMESPACE }} --timeout=180s || \
            (kubectl rollout undo deployment/apiserver -n ${{ env.K8S_NAMESPACE }} && exit 1)
```

Senior notes:

- `id-token: write` is mandatory. Without it, OIDC fails with "Could not load credentials".
- `github.sha` as the tag gives **immutable, traceable** deploys: the image in production maps to a commit.
- `kubectl set image` is imperative, but combined with the declarative `apply -k` it works because `set image` patches the live Deployment and the next `apply` would revert it. A cleaner approach is `kustomize edit set image` before apply, so the manifest and the cluster agree.
- **Auto-rollback** on failed rollout is the single most valuable reliability feature here.
- **Missing:** a real smoke test after rollout. The workflow waits for readiness but does not call `/healthz`, `/readyz` or login. Add `scripts/smoke-test.sh`.
- **Missing:** `concurrency` to prevent two deploys racing.

### 11.4 Required GitHub configuration

Secrets:

| Name | Value |
| :--- | :--- |
| `SONAR_TOKEN` | SonarCloud/SonarQube token |
| `AWS_OIDC_ROLE_ARN` | `terraform output github_actions_oidc_role_arn` |

Environments: create `lab` and `production` under **Settings → Environments**. Add protection rules (required reviewers) for `production`.

### 11.5 Reproduce CI locally

```bash
# tests + coverage
cd apiserver && npm ci && npm run test:coverage
cd ../client && npm ci && npm run test:coverage

# audits
npm audit --json > ../npm-audit-apiserver.json || true

# images
docker build -t skills-apiserver:ci ./apiserver
docker build -t skills-client:ci ./client

# trivy (Docker)
docker run --rm -v "$PWD:/work" aquasec/trivy:latest fs --scanners vuln,secret,misconfig /work
```

### 11.6 Level 9 checklist

- [ ] I can explain why `id-token: write` is needed.
- [ ] I can explain the difference between `npm ci` and `npm install` in CI.
- [ ] I know which scans are blocking and which are advisory.
- [ ] I know where the OIDC role ARN comes from.
- [ ] I can name three improvements to the CD workflow.

---

## 12. Level 10 — Observability and SRE

**Goal:** move from "it is up" to "I can prove it is healthy, and I know when it is not".

### 12.1 The three pillars, in this repo

| Pillar | Implementation here | Where |
| :--- | :--- | :--- |
| Metrics | `/metrics` Prometheus text format | `apiserver/metrics.js` |
| Logs | stdout (`console.log`, morgan in dev) | container logs → CloudWatch (EKS) |
| Traces | **not implemented** | gap; would be OpenTelemetry |

A senior knows the gap. "We have metrics and logs, no distributed tracing" is an honest and strong interview answer, followed by "here is how I would add it".

### 12.2 Prometheus configuration

```yaml
# deploy/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alerts.yml"

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: "skills-apiserver"
    metrics_path: "/metrics"
    static_configs:
      - targets: ["apiserver:8010"]
        labels:
          service: "apiserver"
          namespace: "node-react-app"
          environment: "local-compose"
```

- `scrape_interval: 15s` = 4 samples/minute per time series. Lower = more resolution and more cost.
- `evaluation_interval` controls how often alert rules run.
- In Kubernetes, `prometheus.io/scrape` annotations are used by the Prometheus Helm chart; with the plain Prometheus Operator you would use a `ServiceMonitor` instead.

### 12.3 Alert rules

```yaml
# deploy/prometheus/alerts.yml
groups:
  - name: skills-platform-golden-signal-alerts
    rules:
      - alert: ApiTargetDown
        expr: up{job="skills-apiserver"} == 0
        for: 1m
        labels: { severity: critical, service: apiserver }
        annotations:
          summary: "Skills API Server target is DOWN"

      - alert: HighHttp5xxErrorRate
        expr: |
          sum(rate(http_requests_total{status_code=~"5.."}[5m]))
          /
          clamp_min(sum(rate(http_requests_total[5m])), 1) > 0.05
        for: 2m
        labels: { severity: critical }

      - alert: HighApiLatencyP95
        expr: histogram_quantile(0.95,
                sum by (le) (rate(http_request_duration_seconds_bucket[5m]))) > 0.5
        for: 3m
        labels: { severity: warning }

      - alert: HighNodeHeapMemoryUsage
        expr: nodejs_heap_used_bytes > 400000000
        for: 5m
        labels: { severity: warning }
```

Explain each expression, because interviewers ask:

- `up == 0` — Prometheus could not scrape. This is a *symptom of the monitoring path*, not necessarily of the app.
- `rate(...[5m])` — per-second rate over 5 minutes. `clamp_min(..., 1)` avoids divide-by-zero when there is no traffic.
- `histogram_quantile(0.95, sum by (le) (...))` — p95 latency. You must aggregate by `le` only, otherwise the quantile is computed per series and then averaged (wrong).
- `for: 2m` — the condition must hold continuously; prevents flapping.
- Alert on **symptoms** (error rate, latency) more than causes (CPU). Cause alerts are for capacity planning.

### 12.4 Grafana provisioning

```yaml
# deploy/grafana/provisioning/datasources/prometheus.yml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
```

```yaml
# deploy/grafana/provisioning/dashboards/dashboards.yml
apiVersion: 1
providers:
  - name: "Skills Platform Dashboards"
    orgId: 1
    folder: "Skills Platform"
    type: file
    disableDeletion: false
    editable: true
    options:
      path: /var/lib/grafana/dashboards
```

Provisioning as code means dashboards are reproducible and reviewable. A dashboard clicked together by hand is lost when the container dies.

### 12.5 PromQL you should be able to write from memory

```promql
# requests per second by route
sum by (route) (rate(http_requests_total[5m]))

# 5xx error ratio
sum(rate(http_requests_total{status_code=~"5.."}[5m]))
  / sum(rate(http_requests_total[5m]))

# p95 latency
histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))

# p99 latency
histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))

# request rate by status class
sum by (status_code) (rate(http_requests_total[5m]))

# heap usage in MB
nodejs_heap_used_bytes / 1024 / 1024

# is the target up?
up{job="skills-apiserver"}
```

### 12.6 SLI / SLO / error budget (senior language)

- **SLI** (indicator): what you measure. Example: proportion of successful HTTP requests.
- **SLO** (objective): the target. Example: 99.9% of requests succeed over 30 days.
- **Error budget**: 100% − SLO = 0.1% ≈ 43 minutes/month of allowed failure.
- **SLA**: a contract with a customer, usually looser than the internal SLO.

A concrete SLO for this app:

```
SLI: successful_requests / total_requests   (status < 500)
SLO: 99.9% over a rolling 30 days
Error budget: 0.1% = ~43 min/month
Burn-rate alert: 14.4x over 1h (2% budget in 1h) -> page
```

### 12.7 CloudWatch (AWS side)

What you would monitor, and why:

| Source | Metric | Alert |
| :--- | :--- | :--- |
| ALB | `HTTPCode_Target_5XX_Count`, `TargetResponseTime`, `UnHealthyHostCount` | 5xx spike, p95 > 1s, any unhealthy target |
| EKS | control-plane logs (`api`, `audit`, `authenticator`) | audit anomalies |
| RDS | `CPUUtilization`, `DatabaseConnections`, `FreeStorageSpace`, `ReadLatency` | connections near max, disk < 20% |
| EC2/nodes | `node_filesystem_avail_bytes`, `node_memory_*` | disk pressure, memory pressure |

```bash
# quick RDS check
aws rds describe-db-instances \
  --query "DBInstances[*].[DBInstanceIdentifier,DBInstanceStatus,Endpoint.Address]" \
  --output table

# ALB target health
aws elbv2 describe-target-health --target-group-arn <arn>
```

### 12.8 Load testing with k6

```javascript
// apiserver/k6-tests/login.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const baseUrl = __ENV.API_URL || 'http://localhost:8010';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m',  target: 50 },
    { duration: '30s', target: 0  },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  const payload = JSON.stringify({ email: `user${__VU}@test.com`, password: 'password123' });
  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post(`${baseUrl}/api/v1/auth/login`, payload, params);
  check(res, {
    'status is 200 or 400': (r) => r.status === 200 || r.status === 400,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });
  sleep(1);
}
```

Run it:

```bash
k6 run apiserver/k6-tests/login.js
k6 run -e API_URL=http://<alb-hostname> apiserver/k6-tests/login.js
```

Read the output: `http_req_duration p(95)`, `http_req_failed rate`, `http_reqs` (throughput), `vus`. If a threshold fails, k6 exits non-zero — usable as a CI gate.

> **Honest limitation:** `login.js` sends fake users and accepts `400`, so it measures *bcrypt + error path* more than a real user journey. A better test logs in once, stores the cookie, then exercises `/skills`. That is a good improvement task.

### 12.9 Level 10 checklist

- [ ] I can query `http_requests_total` and compute an error ratio.
- [ ] I can explain p95 vs average and why p95 matters.
- [ ] I can explain SLI/SLO/error budget with numbers.
- [ ] I ran k6 and read the summary.
- [ ] I know the three pillars and which one is missing here.

---

## 13. Level 11 — DevSecOps and hardening

**Goal:** treat security as a pipeline stage and a design property, not a checklist at the end.

### 13.1 The security layers in this repo

| Layer | Control | Where |
| :--- | :--- | :--- |
| Code | SonarQube, tests | `main.yaml` |
| Dependencies | `npm audit`, Trivy fs | `main.yaml` |
| Secrets in repo | Trivy secret scanner, `.gitignore`, `.dockerignore` | CI |
| Container | non-root, minimal base, Trivy image scan, ECR `scan_on_push` | Dockerfiles, `ecr` module |
| Supply chain | immutable SHA tags, `IMMUTABLE` ECR | `ecr` module, CD |
| Cloud identity | OIDC (no static keys), least-privilege IAM | `iam` module |
| Network | 3-tier subnets, SG chain, private RDS | `network`, `rds` |
| Runtime | `runAsNonRoot`, no token automount, RBAC | `k8s/` |
| Secrets at runtime | AWS Secrets Manager → ExternalSecret | `rds`, `external-secret.yaml` |
| Transport | `DB_SSL=true` for RDS, TLS at ALB (optional) | overlays, ingress |

### 13.2 Hardening tasks you can actually do

1. **Tighten the gates.** Change Trivy `exit-code: "0"` → `"1"` for `CRITICAL` only. Fix the findings, then raise to `HIGH`.
2. **Pin images by digest.** `node:18-bullseye-slim@sha256:...` removes tag-mutability risk.
3. **Add a `securityContext` to the client Deployment.** It currently has none:
   ```yaml
   securityContext:
     runAsNonRoot: true
     runAsUser: 101          # nginx user in the alpine image
     allowPrivilegeEscalation: false
     readOnlyRootFilesystem: true
     capabilities:
       drop: ["ALL"]
   ```
   `readOnlyRootFilesystem` requires mounting emptyDir volumes for `/var/cache/nginx`, `/var/run`, `/tmp`.
4. **Add `NetworkPolicy`.** Default-deny ingress, then allow `client → apiserver:8010` and `apiserver → RDS:5432`.
5. **Remove the unused `RoleBinding`.** The app does not need Kubernetes API access.
6. **Rotate the committed local secrets.** Even "placeholder" values should not be reused.
7. **Add `seccompProfile: RuntimeDefault`.**
8. **Set `terminationGracePeriodSeconds`** slightly above the app's shutdown time.
9. **Add `concurrency` to the CD workflow.**
10. **Enable EKS secrets encryption with KMS** and audit logging to CloudWatch (audit logs are enabled; encryption at rest is not configured in the module).

### 13.3 Example: a proper NetworkPolicy set

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: node-react-app
spec:
  podSelector: {}
  policyTypes: [Ingress]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-client-to-apiserver
  namespace: node-react-app
spec:
  podSelector:
    matchLabels: { app: apiserver }
  policyTypes: [Ingress]
  ingress:
    - from:
        - podSelector:
            matchLabels: { app: client-app }
      ports:
        - protocol: TCP
          port: 8010
```

> Caveat: with `target-type: ip`, the ALB talks **directly to Pod IPs**, so a default-deny would also block the ALB unless you allow the VPC CIDR. Always test in lab first.

### 13.4 Secret scanning and why it matters here

```bash
docker run --rm -v "$PWD:/work" aquasec/trivy:latest fs --scanners secret /work
```

The repo contains real-looking JWT secrets in `k8s/secret.yaml` and `docker-compose.yaml`. A scanner will flag them. The correct response is **not** to delete the files (they are needed for local runs) but to:
1. label them clearly as local-only (already done in comments),
2. ensure production uses ExternalSecrets (already done),
3. rotate any value that was ever used in a real environment,
4. add a pre-commit hook or CI check that blocks new secrets.

### 13.5 Level 11 checklist

- [ ] I ran Trivy and can explain each finding category.
- [ ] I know which gates are advisory vs blocking.
- [ ] I can write a default-deny NetworkPolicy.
- [ ] I can explain OIDC, least privilege and immutable tags in one breath.

---

## 14. Level 12 — Break-and-fix drills (the senior-maker)

Reading teaches concepts. Breaking things teaches engineering. Do each drill on your branch, observe, fix, then write three lines about what you learned.

### Drill 1 — API cannot reach the database

**Cause it:**

```bash
docker compose exec apiserver sh -c "nc -zv db 5432" || echo "cannot reach db"
# or in Kubernetes:
kubectl exec -it deploy/apiserver -n node-react-app -- sh -c "nc -zv <rds-endpoint> 5432"
```

Break it by setting `DB_HOST=wrong-host` (Compose) or patching the ConfigMap (K8s), then restart the Pod.

**Symptoms:** `/healthz` = 200, `/readyz` = 503, API calls = 500 after a timeout, logs show `unable to connect`.

**Diagnose in this order:**
1. Is the host resolvable? `nslookup <host>` / `getent hosts <host>`.
2. Is the port reachable? `nc -zv host 5432`.
3. Are credentials correct? Try `psql` from a Pod.
4. Is the security group allowing the source? `aws ec2 describe-security-groups`.
5. Is RDS in a private subnet with the right route table? (It should not need internet.)

**Fix:** correct the host/credentials/SG. Then confirm `/readyz` returns 200 **without restarting the app** — that proves readiness is a live check.

### Drill 2 — Frontend shows 502 Bad Gateway

**Cause it:** `docker compose stop apiserver` (or scale the Deployment to 0).

**Why 502:** NGINX is the reverse proxy. It cannot connect to the upstream, so it returns 502. The browser sees a gateway error, not an API error.

**Diagnose:**
1. `docker compose ps` / `kubectl get pods`.
2. `kubectl get endpoints apiserver -n node-react-app` — empty means no Ready Pods.
3. `kubectl logs deploy/apiserver` — is it crashing?
4. `kubectl describe pod` — `OOMKilled`? `ImagePullBackOff`?

**Fix:** restart/scale the API. If it is `CrashLoopBackOff`, read `--previous` logs.

### Drill 3 — CrashLoopBackOff after a config change

**Cause it:** patch the Deployment with a missing env var, e.g. remove `SESSION_ENCRYPT_SECRET` from the Secret.

**Symptom:**

```
$ kubectl get pods
apiserver-xxxx   0/1   CrashLoopBackOff   6   3m
```

**Diagnose:**

```bash
kubectl logs deploy/apiserver -n node-react-app --previous
kubectl describe pod -n node-react-app -l app=apiserver
```

`utils/session.js` calls `scryptSync(process.env.SESSION_ENCRYPT_SECRET || 'default...')` so it will not crash on a missing secret — it will silently use a weak default. That is worse than crashing. A senior adds a startup validation:

```javascript
// add to index.js, before app.listen
const required = ['DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME',
                  'JWT_SESSION_SECRET', 'SESSION_ENCRYPT_SECRET', 'SESSION_COOKIE_NAME'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);   // fail fast, let Kubernetes restart / alert
}
```

This is a **12-factor** principle: fail fast on bad config, never run with silent defaults.

### Drill 4 — OOMKilled

**Cause it:** lower the memory limit to `64Mi` and run the k6 login test.

```bash
kubectl set resources deployment/apiserver -n node-react-app \
  --limits=memory=64Mi --requests=memory=32Mi
```

**Symptom:** `kubectl describe pod` shows `Last State: Terminated, Reason: OOMKilled, Exit Code: 137`. `kubectl top pod` shows memory climbing to the limit.

**Why Node.js OOMs:** V8 heap grows; the default old-space limit is far above 64Mi. Set `--max-old-space-size` to ~75% of the container limit:

```yaml
env:
  - name: NODE_OPTIONS
    value: "--max-old-space-size=384"
```

**Fix:** restore `512Mi`, add the `NODE_OPTIONS` headroom, and add a memory alert (the repo already has `HighNodeHeapMemoryUsage`).

### Drill 5 — Readiness probe fails, no traffic

**Cause it:** point readiness at `/readyz` while the DB is down (this is *correct* behaviour). Or change the port to the wrong one (this is a *bug*).

**Diagnose:**

```bash
kubectl describe pod <pod> | Select-String -Pattern "Readiness|Unhealthy"
kubectl exec -it <pod> -- wget -qO- http://127.0.0.1:8010/readyz
kubectl get endpoints <service> -n node-react-app
```

**Lesson:** a failing readiness probe removes the Pod from the Service but does **not** restart it. A failing liveness probe restarts it. Confusing the two causes either traffic to broken Pods or restart storms.

### Drill 6 — ImagePullBackOff in EKS

**Cause it:** change the image tag to one that does not exist.

```bash
kubectl set image deployment/apiserver apiserver=<registry>/skills-apiserver:does-not-exist -n node-react-app
```

**Diagnose:**

```bash
kubectl describe pod <pod> | Select-String -Pattern "Failed|Error|pull"
aws ecr describe-images --repository-name skills-apiserver --region ap-south-1
```

Common causes: wrong tag, ECR in a different region, node role missing `AmazonEC2ContainerRegistryReadOnly`, or the node cannot reach ECR (no NAT / VPC endpoints).

**Fix:** push the right tag or roll back.

### Drill 7 — Zero-downtime rollout

```bash
kubectl set image deployment/apiserver apiserver=skills-apiserver:v2 -n node-react-app
kubectl rollout status deployment/apiserver -n node-react-app
kubectl rollout history deployment/apiserver -n node-react-app
kubectl rollout undo deployment/apiserver -n node-react-app
```

Run `while ($true) { curl.exe -s -o NUL -w "%{http_code}`n" http://<alb>/healthz; Start-Sleep -Milliseconds 300 }` in another terminal during the rollout. You should see only `200`. If you see `502`/`503`, your probes, `maxUnavailable`, or `terminationGracePeriodSeconds` are wrong.

### Drill 8 — Terraform drift

```bash
# manually change something in the console (e.g. add a tag to a subnet)
terraform -chdir=infra/envs/lab plan -refresh-only
terraform -chdir=infra/envs/lab plan
```

You will see the real resource differs from state. Decide: import it into code, or revert it in the console. **Never** let manual console changes accumulate — that is how "works in prod but not in Terraform" happens.

### Drill 9 — Simulated incident (capstone)

Do this with a timer. 20 minutes.

1. Apply the lab overlay.
2. Break one thing **without telling yourself what**: scale the API to 0, corrupt the Secret, remove the readiness probe, change the RDS SG, or set an impossible resource request.
3. Detect it (dashboards, `kubectl get`, alerts).
4. Diagnose it using only commands (no code reading).
5. Fix it.
6. Write a 5-line blameless post-mortem: timeline, impact, root cause, detection, prevention.

If you can do this calmly, you are operating at a mid/senior level.

### 14.7 Destroy everything (do not skip)

```bash
# 1. delete Kubernetes resources first (removes the ALB so Terraform does not hang)
kubectl delete -k k8s/overlays/lab --ignore-not-found

# 2. destroy the infrastructure
terraform -chdir=infra/envs/lab destroy

# 3. audit for leftover billable resources
bash scripts/post-destroy-check.sh ap-south-1
```

The AWS LB Controller creates ALBs **outside** Terraform. If you destroy Terraform first, the VPC deletion hangs on the ALB and its ENIs. Always delete the Ingress first. `scripts/post-destroy-check.sh` checks EKS, EC2, ALB/NLB, NAT, EIPs, RDS, snapshots and EBS.

See `AWS_COST_OPTIMIZATION_AND_CLEANUP.md` for the full FinOps procedure.

---

## 15. Senior topics: scaling, HA, DR, incidents

### 15.1 Scaling

| Dimension | Mechanism here | Next step |
| :--- | :--- | :--- |
| Pods | HPA on CPU/memory (2-6) | custom metrics (RPS/queue depth), KEDA |
| Nodes | EKS managed node group (1-3) | Karpenter / Cluster Autoscaler |
| Database | vertical (`db.t4g.micro` → larger) | read replicas, connection pooling (PgBouncer/RDS Proxy) |
| Cache | none | Redis/ElastiCache for sessions and hot reads |
| Static assets | NGINX | CloudFront + S3 |

**The scaling bottleneck here is the database connection pool, not CPU.** Every Pod opens its own Sequelize pool. 6 API Pods × default pool (5) = 30 connections; `db.t4g.micro` has a low `max_connections`. A senior adds **RDS Proxy** or **PgBouncer** before scaling past a handful of replicas. This is the single best "senior answer" for this project.

### 15.2 High availability

```
AZ-a: node 1 + Pod A + RDS primary
AZ-b: node 2 + Pod B + RDS standby (multi_az = true)
```

Requirements for real HA:
- ≥2 replicas of each Deployment (yes)
- Pod anti-affinity so replicas land in different AZs (**missing**)
- `topologySpreadConstraints` (**missing**)
- Multi-AZ RDS (**false in lab**)
- PDB (yes)
- Multi-AZ NAT (single in lab)

```yaml
# example: spread API replicas across AZs
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: ScheduleAnyway
    labelSelector:
      matchLabels: { app: apiserver }
```

### 15.3 Disaster recovery

| Metric | Meaning | This project |
| :--- | :--- | :--- |
| **RTO** | how long until service is back | ~15-30 min with Terraform + redeploy |
| **RPO** | how much data you can lose | up to 5 min (RDS PITR with 7-day retention) |

DR plan you can describe:

1. **Backup:** RDS automated backups (7 days) + manual snapshot before risky changes.
2. **Restore:** `aws rds restore-db-instance-to-point-in-time`.
3. **Recreate infra:** `terraform apply` from code (this is the real DR superpower — infrastructure is reproducible).
4. **Redeploy:** CD workflow with a known-good SHA.
5. **Verify:** smoke tests + `/readyz`.

Test it at least once. An untested backup is a hope, not a backup.

### 15.4 Incident runbook template

```
INCIDENT: <one line>
SEVERITY: P1 / P2 / P3
IMPACT: <who and what>
DETECTED BY: <alert / user / dashboard>
TIMELINE (UTC):
  12:00 alert fired
  12:02 acknowledged
  12:05 hypothesis 1 ...
  12:15 mitigation applied
  12:20 service restored
ROOT CAUSE: <technical, specific>
CONTRIBUTING FACTORS: <process, monitoring, config>
PREVENTION: <ticket 1, ticket 2, alert 1>
```

Write one for each drill you do. Being able to show three real post-mortems from your own lab is worth more in an interview than any certificate.

### 15.5 Questions a senior asks about this architecture

1. Why not run Postgres in the cluster? (Managed backups, patching, failover, no stateful ops burden.)
2. Why one ALB instead of a `LoadBalancer` Service per app? (Cost, single TLS cert, path routing.)
3. Why immutable SHA tags? (Traceability, no "latest" ambiguity, safe rollback.)
4. Why OIDC instead of IAM users? (No long-lived keys.)
5. What happens if the DB is down for 10 minutes? (Readiness removes Pods; liveness keeps them alive; requests fail with 500; HPA does not help; the real fix is connection retry with backoff + circuit breaking.)
6. How do you deploy a schema change safely? (Expand/contract migrations, backward-compatible columns, run as a Job before the rollout.)
7. How do you know a deploy is good? (Probes + smoke tests + error-rate/latency SLO check + auto-rollback.)
8. What is your blast radius if one node dies? (With 2 replicas + PDB, no user impact; without anti-affinity, possibly both replicas on one node.)
9. How much does this cost per month, and what would you cut first? (NAT and idle nodes; single NAT in lab; scheduled scaling.)
10. What would you change before 1M users? (RDS Proxy, caching, CDN, async jobs, tracing, multi-region read replicas.)

---

## 16. The 90-day plan

Three hours a day, six days a week. Adjust, but keep the order.

### Weeks 1-2 — Application literacy

| Day | Task |
| :--- | :--- |
| 1 | Read Section 1 and 2. Draw the architecture by hand. |
| 2 | Read `index.js`, `app.js`, `api.js`. Write the middleware order from memory. |
| 3 | Read routes + controllers. Map every endpoint. |
| 4 | Read `authService.js`, `session.js`, `jwt.js`, `isLoggedIn.js`. Draw the login flow. |
| 5 | Read models. Draw the ER diagram. |
| 6 | Run the app locally with Docker Postgres. Register, verify, login with curl. |
| 7 | Review + write a 1-page summary. |

### Weeks 3-4 — Tests and Docker

| Day | Task |
| :--- | :--- |
| 8 | Run all tests, read the Jest config, read 3 test files. |
| 9 | Write one new unit test yourself (e.g. `normalizeRoute`). |
| 10 | Read both Dockerfiles. Explain every line. |
| 11 | Build both images. Prove non-root and no secrets. |
| 12 | Compare image sizes. Try `node:18-alpine` and check whether native modules (`sharp`) still work. |
| 13 | Read `docker-compose.yaml`. Draw the network diagram. |
| 14 | Run the full stack. Check Prometheus targets and Grafana. |

### Weeks 5-6 — Kubernetes

| Day | Task |
| :--- | :--- |
| 15 | Install kind. Create a cluster. |
| 16 | Read every manifest in the order from Section 8.3. |
| 17 | Deploy the base. Fix `dbpvc.yaml`. |
| 18 | Debug a deliberately broken Pod (Drill 3). |
| 19 | Study probes. Change liveness to `/readyz` and observe the restart storm. |
| 20 | Study HPA + PDB. Install metrics-server and scale under load. |
| 21 | Study Kustomize. Render both overlays. Fix the load restrictor. |

### Weeks 7-9 — AWS and Terraform

| Day | Task |
| :--- | :--- |
| 22 | Install AWS CLI + Terraform. Create a **non-root** IAM user for learning. |
| 23 | Read all Terraform modules. Draw the VPC. |
| 24 | Bootstrap the S3 state bucket. |
| 25 | `terraform plan` the lab. Read every resource. Estimate cost. |
| 26 | `terraform apply`. Watch the EKS console. |
| 27 | `aws eks update-kubeconfig`, install LB controller + metrics-server. |
| 28 | Deploy the lab overlay. Get the ALB address. |
| 29 | Break and fix: SG, RDS endpoint, image tag. |
| 30 | **Destroy everything.** Run the post-destroy audit. |
| 31-35 | Repeat the apply/deploy/destroy cycle until it is boring. Boring is mastery. |

### Weeks 10-11 — CI/CD and observability

| Day | Task |
| :--- | :--- |
| 36 | Read both workflows line by line. |
| 37 | Fork the repo, set `SONAR_TOKEN`, run CI. |
| 38 | Set up OIDC role + `AWS_OIDC_ROLE_ARN`. Run CD. |
| 39 | Make a bad deploy. Watch auto-rollback. |
| 40 | Tighten Trivy to `exit-code: 1`. Fix what breaks. |
| 41 | Build a Grafana panel from scratch using PromQL. |
| 42 | Write an SLO + burn-rate alert. |

### Weeks 12-13 — Senior polish

| Day | Task |
| :--- | :--- |
| 43-45 | Do all 9 drills. Write 9 post-mortems. |
| 46 | Implement NetworkPolicy + client securityContext. |
| 47 | Add startup env validation (Drill 3). |
| 48 | Add `topologySpreadConstraints` + anti-affinity. |
| 49 | Write the DR plan and test a PITR restore. |
| 50-52 | Mock interviews. Record yourself. Watch the recording. |
| 53-54 | Update `README.md` with your improvements and open PRs. |

### Weeks 55-90 — Depth

Pick **two** and go deep:

- **Kubernetes:** CKA/CKS preparation, operators, Karpenter, Gateway API.
- **Terraform:** Terragrunt, module testing (`terratest`), policy-as-code (OPA/Checkov).
- **Observability:** OpenTelemetry, Tempo/Jaeger, Prometheus Operator, SLO tooling (Sloth).
- **Security:** supply-chain (cosign, SBOM, SLSA), Vault, OPA Gatekeeper.
- **Platform engineering:** Backstage, golden paths, internal developer platform.

---

## 17. Interview bank mapped to this repo

Answer in **three layers**: definition → how it appears here → trade-off.

| Question | Where to look | Strong answer sketch |
| :--- | :--- | :--- |
| Difference between liveness and readiness? | `app.js`, `apidep.yaml` | Liveness = restart; readiness = traffic. `/healthz` vs `/readyz`. Pointing liveness at the DB causes restart storms. |
| What happens when a Pod is deleted? | `index.js`, `apidep.yaml` | `SIGTERM` → graceful shutdown → `terminationGracePeriodSeconds` → `SIGKILL`. `maxUnavailable: 0` keeps capacity. |
| How does the frontend talk to the backend? | `nginx.conf`, `ingress.yaml` | Same origin; NGINX proxies `/api/`; ALB routes `/api` to the API service. |
| Why multi-stage Docker builds? | Dockerfiles | Smaller image, no dev deps, no build tools, smaller attack surface. |
| Why `npm ci`? | Dockerfiles, CI | Deterministic, lockfile-exact, fails on drift. |
| How do you manage secrets? | `secret.yaml`, `external-secret.yaml`, `iam` | Local Secret for dev; Secrets Manager + ESO + IRSA/Pod Identity in AWS; never in git or image layers. |
| Explain OIDC in CI. | `iam/main.tf`, `deploy-lab.yml` | GitHub issues short-lived JWT; STS trusts the provider; `sub` restricts repo/branch; no static keys. |
| What is IRSA? | `serviceaccount.yaml`, `iam` | IAM Roles for Service Accounts; Pod gets AWS permissions via a projected token; least privilege per workload. |
| Terraform state — why remote? | `infra/bootstrap` | Shared, locked, versioned, encrypted; local state causes conflicts and loss. |
| What is drift? | Section 14 Drill 8 | Real infra differs from state; detect with `plan -refresh-only`; fix by codifying or reverting. |
| Why immutable image tags? | `ecr` module | Traceability to a commit; prevents silent overwrite; safe rollback. |
| How do you roll back? | CD workflow | `kubectl rollout undo`; keep `revisionHistoryLimit`; auto-rollback on failed rollout status. |
| How do you scale this app? | Section 15.1 | HPA for Pods, Karpenter for nodes, **RDS Proxy** for connections — the real bottleneck. |
| Explain a 502 you have seen. | Drill 2 | NGINX upstream unavailable → 502; empty endpoints, crash loop, or wrong port. |
| Explain an OOMKilled. | Drill 4 | Exit 137, limit exceeded, V8 heap, `NODE_OPTIONS` headroom. |
| What are the golden signals? | `metrics.js` | Latency, traffic, errors, saturation. |
| What is cardinality explosion? | `normalizeRoute` | Unbounded label values (raw URLs/IDs) blow up Prometheus memory. |
| How would you secure this cluster? | Section 13 | Non-root, read-only FS, NetworkPolicy, no token automount, minimal RBAC, private endpoint, audit logs, KMS encryption. |
| What is your biggest risk here? | Whole repo | Committed local secrets + `sync()` schema management + advisory-only security gates + no tracing. |
| What would you fix first? | Section 19 | Broken `dbpvc.yaml`, invalid overlay paths, secrets hygiene, real smoke test in CD, blocking scans. |

### 17.1 The 60-second project pitch

> "It's a three-tier skills management app — React served by NGINX, an Express API, and PostgreSQL. I containerized both services with multi-stage builds and non-root users, ran them with Compose including Prometheus and Grafana, and deployed them to EKS with Kustomize overlays for lab and production. The infrastructure is modular Terraform: a three-tier VPC with public, private-app and private-DB subnets, a single NAT in lab for cost, EKS with managed nodes, private RDS with encryption and backups, ECR with immutable tags, and GitHub OIDC so there are no static AWS keys. CI runs Jest with a 50% coverage gate, SonarQube, npm audit and Trivy. CD builds a SHA-tagged image, pushes to ECR, rolls out with Kustomize and auto-rolls back on failed readiness. Observability is a zero-dependency `/metrics` endpoint with golden-signal alerts. The biggest lesson was separating liveness from readiness — otherwise a database blip restarts every Pod."

---

## 18. Command cheat sheet

### Git

```bash
git checkout -b feature/my-change
git status
git diff
git add -p
git commit -m "feat: add startup env validation"
git push -u origin feature/my-change
git log --oneline --graph -15
```

### Docker

```bash
docker build -t app:tag ./dir
docker run --rm -it app:tag sh
docker ps -a
docker logs -f <id>
docker exec -it <id> sh
docker inspect <id>
docker stats
docker system df
docker system prune -af      # destructive: removes unused images
```

### Compose

```bash
docker compose config
docker compose up --build -d
docker compose ps
docker compose logs -f apiserver
docker compose exec apiserver sh
docker compose stop db
docker compose down            # keeps volumes
docker compose down -v         # DELETES volumes/data
```

### Kubernetes

```bash
kubectl config current-context
kubectl get pods,svc,deploy,ingress,hpa,pdb -n node-react-app
kubectl describe pod <pod> -n node-react-app
kubectl logs <pod> -n node-react-app --tail=100 -f
kubectl logs <pod> -n node-react-app --previous
kubectl exec -it <pod> -n node-react-app -- sh
kubectl get events -n node-react-app --sort-by=.lastTimestamp
kubectl get endpoints -n node-react-app
kubectl top pods -n node-react-app
kubectl rollout status deploy/apiserver -n node-react-app
kubectl rollout history deploy/apiserver -n node-react-app
kubectl rollout undo deploy/apiserver -n node-react-app
kubectl scale deploy/apiserver --replicas=0 -n node-react-app
kubectl apply -k k8s/overlays/lab
kubectl kustomize --load-restrictor LoadRestrictionsNone k8s/overlays/lab
kubectl port-forward -n node-react-app svc/apiserver-service 8010:8010
kubectl delete -k k8s/overlays/lab
```

### Terraform

```bash
terraform fmt -recursive
terraform validate
terraform init
terraform init -migrate-state
terraform plan -out=tfplan
terraform show tfplan
terraform apply tfplan
terraform plan -refresh-only
terraform state list
terraform state show <address>
terraform output
terraform destroy
```

### AWS

```bash
aws sts get-caller-identity
aws configure get region
aws eks list-clusters --region ap-south-1
aws eks update-kubeconfig --region ap-south-1 --name skills-lab-eks
aws ecr describe-repositories --region ap-south-1
aws ecr describe-images --repository-name skills-apiserver --region ap-south-1
aws rds describe-db-instances --query "DBInstances[*].[DBInstanceIdentifier,DBInstanceStatus,Endpoint.Address]" --output table
aws elbv2 describe-load-balancers --query "LoadBalancers[*].[LoadBalancerName,State.Code]" --output table
aws ec2 describe-nat-gateways --filter "Name=state,Values=available"
aws ec2 describe-addresses
aws logs describe-log-groups --log-group-name-prefix /aws/eks
```

### PromQL

```promql
sum(rate(http_requests_total[5m]))
sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))
up{job="skills-apiserver"}
nodejs_heap_used_bytes / 1024 / 1024
```

---

## 19. Known issues a senior would flag (and fix)

These are real, observed in this repository. Each one is a legitimate PR and a great interview story.

| # | Issue | Where | Why it matters | Suggested fix |
| :- | :--- | :--- | :--- | :--- |
| 1 | Invalid YAML indentation in `dbpvc.yaml` | `k8s/dbpvc.yaml` | `kubectl kustomize k8s` fails | re-indent `labels` under `metadata` |
| 2 | Overlays use `../../` paths | `k8s/overlays/*` | Kustomize refuses paths outside the overlay dir, so both local render **and the CD workflow's `kubectl apply -k`** fail unless `LoadRestrictionsNone` is passed | reference the base as a resource (`resources: [../..]`) |
| 3 | Local secrets committed | `k8s/secret.yaml`, `docker-compose.yaml` | credential leakage / scanner noise | rotate, keep dev-only, document, add pre-commit scan |
| 4 | Trivy gates never fail the build | `.github/workflows/main.yaml` | "security theatre" | `exit-code: 1` for CRITICAL first |
| 5 | No smoke test after CD rollout | `.github/workflows/deploy-lab.yml` | a "successful" deploy can still be broken | run `scripts/smoke-test.sh` against the ALB |
| 6 | `passwordConfirm` stored in DB | `models/sampledb/user.js` | unnecessary credential exposure | `Sequelize.VIRTUAL` + validate |
| 7 | Fixed AES IV | `utils/session.js` | deterministic ciphertext | random IV per encryption, store alongside |
| 8 | `JWT_SESSION_EXPIRY` string math | `services/authService.js` | `12h` silently becomes 12 days | use a duration parser |
| 9 | `sync({ force: false })` at boot | `index.js` | no schema versioning | migrations via `umzug` + Kubernetes Job |
| 10 | `AppError` args swapped in unused middleware | `middleware/athorizeOnly.js` | wrong status/message if enabled | `new AppError(403, '...')` |
| 11 | HPA on memory | `k8s/hpa.yaml` | Node.js rarely releases memory → scale-up without relief | CPU as primary; memory as alert |
| 12 | No anti-affinity / topology spread | `k8s/apidep.yaml`, `clientdep.yaml` | both replicas can land on one node/AZ | add `topologySpreadConstraints` |
| 13 | RBAC grants unused access | `k8s/rbac.yaml` | unnecessary privilege | remove RoleBinding |
| 14 | IRSA annotation vs Pod Identity trust mismatch | `serviceaccount.yaml`, `iam/main.tf` | auth may silently fail | choose one model |
| 15 | `eks_workloads_sg` not attached to nodes | `infra/modules/eks` | RDS SG rule may not match node traffic | attach SG to node group |
| 16 | Hardcoded `prod/...` secret name in lab | `infra/modules/rds` | environment collision | parameterise by `var.environment` |
| 17 | `deletion_protection = false` | `infra/modules/rds` | accidental data loss | true in production |
| 18 | No `concurrency` in CD | `.github/workflows/deploy-lab.yml` | two deploys can race | add `concurrency: group` |
| 19 | `cors()` wide open | `app.js` | permissive in prod | restrict origin |
| 20 | No tracing | whole app | hard to debug distributed latency | OpenTelemetry |

**How to turn these into a portfolio:** one branch per fix, one PR per fix, with a before/after and a one-paragraph rationale. Ten merged PRs beat any certificate on a resume.

---

## 20. Existing docs and how they fit together

This repo already has a lot of documentation. Do not read it all at once; use this map.

| File | What it is | When to read it |
| :--- | :--- | :--- |
| `README.md` | Project overview, architecture diagram, phase checklist, quick start | Day 1 |
| `ARCHITECTURE.md` | ADR-style deep dive, request flows, decisions | after Section 3 |
| `HOW_TO_READ_AND_MASTER_THIS_PROJECT.md` | Reading order + milestones + drills (Hinglish) | in parallel with this guide |
| `DEVOPS_IMPLEMENTATION_GUIDE.md` | Very long phased implementation manual + dictionary + runbooks | as a reference, per phase |
| `AWS_COST_OPTIMIZATION_AND_CLEANUP.md` | FinOps, pause and teardown procedures | before your first `apply` |
| `KUBERNETES_DEEP_DIVE.md` | Kubernetes concepts applied to this repo | during Section 8 |
| `docs/adr/ADR-001-...md` | Architecture decision record | after Section 9 |
| `docs/devops-interview-preparation/00-LEARNING-ROADMAP.md` | 15-file interview curriculum | after Section 16 |
| `docs/devops-interview-preparation/10-PRODUCTION-TROUBLESHOOTING.md` | Incident scenarios | with Section 14 |
| `docs/devops-interview-preparation/11-REAL-WORLD-SCENARIO-QUESTIONS.md` | 60 scenario questions | interview prep |
| `interview-notes/` | Fundamentals + incident playbooks + advanced topics | revision |
| `docs/BASELINE_VALIDATION.md`, `docs/CODE_REVIEW_REPORT.md`, `docs/COMPLETE_REPOSITORY_REVIEW.md` | Existing audits | after you form your own opinion |

> **Study tip:** form your own opinion **before** reading the review docs. Then compare. That is how you build judgement rather than memorising someone else's conclusions.

### 20.1 Your weekly proof-of-work

Every week, produce one artifact:

- Week 1: hand-drawn architecture + request-flow diagram.
- Week 2: a working local stack + curl transcript.
- Week 3: test report + one new test.
- Week 4: two Docker images + Trivy report.
- Week 5: kind deployment screenshots + `kubectl describe` of a failure.
- Week 6: Kustomize render diff between lab and production.
- Week 7: `terraform plan` output + cost estimate.
- Week 8: ALB hostname + smoke test output.
- Week 9: teardown audit output (all empty).
- Week 10: green CI run + auto-rollback demo.
- Week 11: Grafana dashboard screenshot + SLO definition.
- Week 12: 9 post-mortems.
- Week 13: 10 merged PRs.

Put them in a `portfolio/` folder (create it yourself) or a blog. In interviews, artifacts beat adjectives.

---

## Final: the fresher → senior checklist

**Fresher (can run it)**
- [ ] Explain the three tiers and every port.
- [ ] Run the app locally and with Compose.
- [ ] Run the tests and read coverage.
- [ ] Read a stack trace and find the failing line.

**Junior (can ship it)**
- [ ] Write and explain a multi-stage Dockerfile.
- [ ] Deploy to Kubernetes and debug `CrashLoopBackOff`, `ImagePullBackOff`, `OOMKilled`.
- [ ] Explain probes, resources, HPA, PDB.
- [ ] Read a CI log and fix a failing pipeline.

**Mid (can operate it)**
- [ ] Build AWS infrastructure with Terraform modules.
- [ ] Deploy to EKS through an ALB with a private RDS.
- [ ] Diagnose 502/503/500 from logs, metrics and endpoints.
- [ ] Write PromQL for rate, error ratio and p95.
- [ ] Do a zero-downtime rollout and a rollback.

**Senior (can own it)**
- [ ] Design the network, IAM and secret flow with least privilege.
- [ ] Explain every trade-off: cost vs HA, single vs multi NAT, sync vs migrations, CPU vs memory HPA.
- [ ] Build a CI/CD pipeline with real gates and automatic rollback.
- [ ] Define SLOs, error budgets and actionable alerts.
- [ ] Lead an incident, write a blameless post-mortem, and fix the system so it cannot recur.
- [ ] Review someone else's PR and find the 20 issues in Section 19.

---

*You now have the map. The only thing left is the work — and the work is the point.*

