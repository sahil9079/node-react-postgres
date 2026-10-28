# 01 — The Big Picture

## 1. A simple story

Think of a restaurant.

- The **menu** is the React website.
- The **waiter** is NGINX (it takes your request and passes it to the kitchen).
- The **kitchen** is the Node.js/Express API.
- The **fridge** is PostgreSQL.
- The **restaurant manager** is Kubernetes (keeps workers running).
- The **building** is AWS + Terraform (the land, walls and electricity).

You order food (click a button). The waiter writes it down (HTTP request). The kitchen checks the fridge (SQL query). The food comes back (HTTP response). You never walk into the fridge yourself.

That is a **3-tier application**:

```
Tier 1: Presentation  -> React + NGINX
Tier 2: Logic         -> Node.js + Express
Tier 3: Data          -> PostgreSQL
```

## 2. What happens when you log in

Follow the numbers:

```
1. Browser: POST /api/v1/auth/login  { email, password }
2. NGINX:  sees /api/ and forwards to http://apiserver:8010
3. Express: cookieParser -> cors -> helmet -> json -> router
4. authController.login -> authService.loginUser
5. Database: SELECT user JOIN role WHERE email = ...
6. bcrypt: compares the typed password with the stored hash
7. JWT: signs { id, role } with JWT_SESSION_SECRET, valid 1 day
8. AES: encrypts that JWT with SESSION_ENCRYPT_SECRET
9. Response: Set-Cookie: __sample_session=<encrypted>; HttpOnly
10. Browser stores the cookie automatically
```

On the next request:

```
cookie -> isLoggedIn middleware -> decrypt -> verify JWT -> load user -> allow
```

**Important:** the browser never sends a password again. The cookie is the proof.

## 3. What happens when you open the skills page

```
1. Browser: GET /              -> NGINX returns index.html
2. React Router shows /skills
3. React: GET /api/v1/skills   (browser adds the cookie)
4. ALB/NGINX forwards to apiserver:8010
5. isLoggedIn validates the cookie
6. skillController.getAllSkills runs
7. Sequelize: SELECT * FROM skills
8. JSON response -> React table
```

## 4. The four environments

The same app runs in four places. Only the "where" changes.

| Environment | Frontend | API | Database | How it starts |
| :--- | :--- | :--- | :--- | :--- |
| **Laptop dev** | `localhost:3000` | `localhost:8010` | `localhost:5432` | `npm start` |
| **Docker Compose** | `localhost:80` | `localhost:8010` | `db:5432` | `docker compose up` |
| **Local Kubernetes** | `client-service:80` | `apiserver-service:8010` | `postgres-service:5432` | `kubectl apply -k k8s` |
| **AWS EKS** | ALB / `client-service` | ALB / `apiserver-service` | private RDS | Terraform + CD |

## 5. Production architecture (plain words)

```
User
  |
  v
Route 53 (DNS: turns a name into an IP)
  |
  v
ALB (Application Load Balancer: the front door)
  |  /api/*                         |  /*
  v                                 v
apiserver Pods (2-6)            client Pods (2-4)
  |
  v
Private RDS PostgreSQL (no public access)
```

Around it:

- **ECR** stores Docker images.
- **EKS** runs the Pods.
- **Secrets Manager** stores passwords.
- **CloudWatch** stores logs and AWS metrics.
- **Prometheus + Grafana** show app metrics.
- **GitHub Actions** tests, builds and deploys.

## 6. Why there are so many files

Each folder answers one question:

| Folder | Question |
| :--- | :--- |
| `apiserver/` | What does the backend do? |
| `client/` | What does the user see? |
| `k8s/` | How does it run on Kubernetes? |
| `infra/` | How is AWS created? |
| `deploy/` | How is it monitored? |
| `.github/workflows/` | How is it tested and deployed? |
| `scripts/` | What checks can we run? |
| `docs/` | What did we write down? |

## 7. The most important DevOps idea: separate "alive" from "ready"

- **Alive** (`/healthz`): the Node.js process is running.
- **Ready** (`/readyz`): the API can also reach the database.

Why separate?

```
Database goes down for 20 seconds.

If liveness used /readyz:
  every Pod fails -> Kubernetes restarts every Pod -> restart storm -> big outage

If liveness uses /healthz and readiness uses /readyz:
  Pods stay alive -> they are removed from traffic -> database recovers -> Pods become ready again
```

This one design choice prevents many real outages. Remember it forever.

## 8. Draw this now

On paper, draw:

```
Browser -> ALB -> ( /api -> API Pods -> RDS )
               -> ( /   -> Client Pods )
```

Then add:

- Prometheus arrow to API.
- ECR arrow to EKS.
- GitHub Actions arrow to ECR and EKS.

If you can draw it from memory, you understand the project.
