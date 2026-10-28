# 02 — Glossary (Every Technical Word, In Plain Language)

Use this page like a dictionary. Each word has:

- **Simple meaning** — one line.
- **In this project** — where you see it.

---

## Part A — Web and application words

| Word | Simple meaning | In this project |
| :--- | :--- | :--- |
| **API** | A set of URLs a program can call to get or change data. | `apiserver/`, base path `/api/v1` |
| **REST** | A style of API that uses HTTP verbs (`GET`, `POST`, `PATCH`, `DELETE`). | `routes/*.js` |
| **HTTP** | The language browsers and servers use to talk. | Every request |
| **HTTPS** | HTTP with encryption (TLS). | ALB can terminate TLS |
| **Request** | A message asking the server to do something. | `GET /api/v1/skills` |
| **Response** | The server's answer. | JSON + status code |
| **Status code** | A number that says what happened. | `200` ok, `201` created, `400` bad input, `401` not logged in, `403` forbidden, `404` not found, `500` server error, `502` bad gateway, `503` not ready |
| **JSON** | A text format for data: `{"name":"value"}`. | All API responses |
| **Endpoint** | One API URL, for example `/api/v1/skills`. | `api.js`, `routes/` |
| **Route** | The code that handles one endpoint. | `routes/skillRoutes.js` |
| **Controller** | A function that handles a request and sends a response. | `controllers/` |
| **Service** | A file that holds business logic, away from HTTP details. | `services/authService.js` |
| **Middleware** | A function that runs before the controller. | `middleware/`, `app.js` |
| **Model** | A code description of a database table. | `models/sampledb/` |
| **ORM** | A tool that turns JavaScript objects into SQL queries. | Sequelize |
| **Migration** | A versioned change to the database structure. | Not used here; `sync()` is used instead |
| **Seed** | Insert starting data (roles, demo users). | `dev-data/seed.js` |
| **Environment variable** | A setting passed from outside the code. | `process.env.PORT`, `DB_HOST` |
| **Port** | A number that identifies one service on a machine. | `8010`, `80`, `5432` |
| **localhost** | "This same machine". | `localhost:8010` |
| **DNS** | Turns a name (`example.com`) into an IP address. | Route 53 in AWS |
| **Reverse proxy** | A server that receives a request and forwards it to another server. | NGINX, ALB |
| **CORS** | Browser rule about which websites may call the API. | `app.use(cors())` |
| **Cookie** | A small piece of data the browser stores and sends back. | `__sample_session` |
| **Session** | The logged-in state of a user. | Encrypted JWT cookie |
| **JWT** | A signed token with data inside. | `utils/jwt.js` |
| **Hash** | A one-way scramble; you cannot reverse it. | `bcryptjs` for passwords |
| **bcrypt** | A safe password hashing algorithm. | `PASSWORD_HASH_CYCLE=10` |
| **Encryption** | A two-way scramble; you can decrypt with the key. | `utils/session.js` |
| **AES** | A common encryption algorithm. | `aes-192-cbc` |
| **IV** | A starting value for encryption. Should be random. | Fixed zero IV here (a weakness) |
| **Secret** | A password/key that must stay private. | `JWT_SESSION_SECRET` |
| **RBAC** | Role-based access control: who may do what. | `athorizeOnly.js`, Kubernetes `rbac.yaml` |
| **Idempotent** | Running it twice gives the same result. | `terraform apply` |
| **Health check** | A small URL that says "I am alive". | `/healthz` |
| **Readiness check** | A small URL that says "I can serve traffic". | `/readyz` |
| **Graceful shutdown** | Finish current work before exiting. | `SIGTERM` handler in `index.js` |
| **SPA** | Single Page Application: one HTML file, JavaScript changes the page. | React app + `try_files` |
| **CDN** | A network of servers that serves files close to users. | Not used; possible next step |

---

## Part B — Docker and Compose words

| Word | Simple meaning | In this project |
| :--- | :--- | :--- |
| **Image** | A read-only package with the app and everything it needs. | `apiserver/Dockerfile` |
| **Container** | A running copy of an image. | `docker compose ps` |
| **Dockerfile** | The recipe to build an image. | Both `Dockerfile`s |
| **Layer** | One step in an image; layers are cached. | Each `RUN`/`COPY` |
| **Multi-stage build** | Build in one stage, copy only what is needed to a smaller stage. | Both Dockerfiles |
| **Base image** | The starting image, e.g. `node:18-bullseye-slim`. | `FROM ...` line |
| **`npm ci`** | Install exactly the versions in `package-lock.json`. | Dockerfiles and CI |
| **Non-root user** | The container does not run as the admin user. | `USER node` |
| **`.dockerignore`** | Files Docker should not send into the build. | Blocks `.config.env` |
| **Volume** | Storage that survives container deletion. | `dbdata`, `prometheus_data` |
| **Bind mount** | A folder from your machine inside the container. | `./deploy/prometheus:/etc/prometheus` |
| **Network** | A private connection between containers. | `frontend-net`, `backend-net`, `monitoring-net` |
| **Healthcheck** | Docker's own "is it healthy?" test. | `pg_isready`, `/healthz` |
| **`depends_on`** | Start order between services. | API waits for DB |
| **Registry** | A place to store images. | Amazon ECR |
| **Tag** | A label for an image version. | `v1.1.0`, `github.sha` |
| **Immutable tag** | A tag that cannot be overwritten. | ECR setting |

---

## Part C — Kubernetes words

| Word | Simple meaning | In this project |
| :--- | :--- | :--- |
| **Cluster** | A group of machines managed by Kubernetes. | `skills-lab-eks` |
| **Node** | One machine (virtual or real) in the cluster. | EKS node group |
| **Pod** | The smallest unit: one or more containers. | `kubectl get pods` |
| **Deployment** | Keeps N copies of a Pod running and updates them safely. | `apidep.yaml`, `clientdep.yaml` |
| **Replica** | One copy of a Pod. | `replicas: 2` |
| **Service** | A stable name and IP in front of Pods. | `apiserver-service`, `client-service` |
| **ClusterIP** | A Service reachable only inside the cluster. | All services here |
| **Ingress** | Rules for letting outside traffic in. | `ingress.yaml` (ALB) |
| **Namespace** | A folder for cluster resources. | `node-react-app` |
| **ConfigMap** | Non-secret configuration. | `configmap.yaml` |
| **Secret** | Secret configuration (base64, not encryption). | `secret.yaml` |
| **ServiceAccount** | The identity a Pod uses. | `skills-app-sa` |
| **RBAC** | Who can do what inside Kubernetes. | `rbac.yaml` |
| **Probe** | A test Kubernetes runs on a container. | liveness/readiness/startup |
| **Liveness probe** | If it fails, restart the container. | `/healthz` |
| **Readiness probe** | If it fails, stop sending traffic. | `/readyz` |
| **Startup probe** | Gives a slow app time to boot before liveness starts. | 12 × 5s |
| **Resource request** | CPU/memory the scheduler reserves. | `cpu: 100m`, `memory: 128Mi` |
| **Resource limit** | Maximum CPU/memory allowed. | `cpu: 500m`, `memory: 512Mi` |
| **OOMKilled** | The container used more memory than its limit. | Exit code 137 |
| **HPA** | Horizontal Pod Autoscaler: adds/removes Pods. | `hpa.yaml` |
| **PDB** | Pod Disruption Budget: minimum Pods during maintenance. | `pdb.yaml` |
| **Rolling update** | Replace Pods one by one, no downtime. | `maxUnavailable: 0` |
| **Rollback** | Go back to the previous version. | `kubectl rollout undo` |
| **Kustomize** | Builds manifests from a base + per-environment patches. | `k8s/overlays/*` |
| **Overlay** | Environment-specific changes on top of a base. | `lab`, `production` |
| **Metrics Server** | Provides CPU/memory numbers for HPA and `kubectl top`. | Must be installed |
| **Ingress Controller** | The software that turns an Ingress into a real load balancer. | AWS Load Balancer Controller |
| **ALB Ingress** | An Ingress that creates an AWS Application Load Balancer. | `ingress.yaml` |
| **IRSA** | IAM Roles for Service Accounts: AWS permissions for a Pod. | `serviceaccount.yaml` |
| **Pod Identity** | A newer way to give Pods AWS permissions. | IAM trust uses this |
| **Namespace quota** | A limit on resources per namespace. | Not used |

---

## Part D — Cloud and Terraform words

| Word | Simple meaning | In this project |
| :--- | :--- | :--- |
| **IaC** | Infrastructure as Code: create servers from files. | `infra/` |
| **Terraform** | The IaC tool used here. | `.tf` files |
| **Provider** | A plugin that talks to a cloud (AWS). | `hashicorp/aws` |
| **Module** | A reusable group of Terraform resources. | `infra/modules/*` |
| **Root module** | The environment that calls modules. | `infra/envs/lab` |
| **State** | Terraform's memory of what it created. | `terraform.tfstate` |
| **Remote state** | State stored in the cloud (S3), not on a laptop. | `infra/bootstrap` |
| **State lock** | Prevents two people applying at once. | `use_lockfile = true` |
| **Plan** | A preview of changes. | `terraform plan` |
| **Apply** | Actually make the changes. | `terraform apply` |
| **Destroy** | Delete everything Terraform manages. | `terraform destroy` |
| **Drift** | Real infrastructure differs from state. | `plan -refresh-only` |
| **VPC** | Your private network in AWS. | `10.0.0.0/16` |
| **Subnet** | A smaller network range inside a VPC. | public, private-app, private-db |
| **CIDR** | A way to write an IP range, e.g. `10.0.1.0/24`. | All subnet ranges |
| **Availability Zone (AZ)** | One data centre in a region. | `ap-south-1a`, `ap-south-1b` |
| **Internet Gateway** | The door from the VPC to the internet. | `aws_internet_gateway` |
| **NAT Gateway** | Lets private subnets go out, but not in. | `aws_nat_gateway` |
| **Route table** | Rules for where network traffic goes. | `aws_route_table` |
| **Security group** | A virtual firewall for AWS resources. | `alb-sg`, `eks-workloads-sg`, `rds-sg` |
| **ECR** | Elastic Container Registry: stores Docker images. | `infra/modules/ecr` |
| **EKS** | Elastic Kubernetes Service: managed Kubernetes. | `infra/modules/eks` |
| **RDS** | Relational Database Service: managed PostgreSQL. | `infra/modules/rds` |
| **IAM** | Identity and Access Management: users, roles, permissions. | `infra/modules/iam` |
| **Role** | A set of permissions that can be assumed. | `github_actions_deploy` |
| **Policy** | A document listing allowed actions. | `github_ecr_eks` |
| **OIDC** | A trust protocol that lets GitHub get temporary AWS credentials. | CD workflow |
| **Secrets Manager** | AWS service that stores secrets. | `prod/node-react-app/credentials` |
| **External Secrets Operator** | Copies AWS secrets into Kubernetes Secrets. | `external-secret.yaml` |
| **CloudWatch** | AWS logs and metrics service. | EKS/RDS/ALB monitoring |
| **Route 53** | AWS DNS service. | Optional custom domain |
| **ACM** | AWS Certificate Manager (TLS certificates). | For HTTPS on ALB |

---

## Part E — CI/CD and reliability words

| Word | Simple meaning | In this project |
| :--- | :--- | :--- |
| **CI** | Continuous Integration: test every change automatically. | `.github/workflows/main.yaml` |
| **CD** | Continuous Delivery/Deployment: ship automatically. | `deploy-lab.yml` |
| **Pipeline** | The automated steps from code to running app. | GitHub Actions jobs |
| **Job** | One group of steps in a workflow. | testing, sonarqube, deploy |
| **Step** | One command or action. | `npm ci`, `docker build` |
| **Runner** | The machine that runs a job. | `ubuntu-latest` |
| **Artifact** | A file produced by a job (coverage, report). | `upload-artifact` |
| **Matrix** | Run the same job with different values. | `service: [apiserver, client]` |
| **Coverage** | The percentage of code that tests execute. | 50% gate |
| **Quality gate** | A rule that fails the build if quality is low. | SonarQube, coverage |
| **SCA** | Software Composition Analysis: checks dependencies for CVEs. | `npm audit` |
| **CVE** | A known security vulnerability. | Trivy/npm audit |
| **SBOM** | Software Bill of Materials: a list of everything inside. | Not generated yet |
| **Secret scanning** | Finds passwords/keys accidentally committed. | Trivy `secret` scanner |
| **Metric** | A number measured over time. | `http_requests_total` |
| **Counter** | A metric that only goes up. | total requests |
| **Gauge** | A metric that can go up or down. | memory, uptime |
| **Histogram** | Buckets of measurements used to compute percentiles. | request duration |
| **PromQL** | The query language of Prometheus. | `rate(...[5m])` |
| **Scrape** | Prometheus fetching `/metrics`. | every 15 seconds |
| **Golden Signals** | Latency, traffic, errors, saturation. | `metrics.js` |
| **p95** | 95% of requests are faster than this value. | latency alert |
| **SLI** | Service Level Indicator: what you measure. | success rate |
| **SLO** | Service Level Objective: your target. | 99.9% |
| **SLA** | A contract with a customer. | Not defined here |
| **Error budget** | Allowed failure before you must stop shipping. | 0.1% of a month |
| **Alert** | A rule that notifies a human. | `alerts.yml` |
| **Runbook** | Steps to fix a known problem. | Section 14 of the big guide |
| **Post-mortem** | A blameless write-up after an incident. | Drill output |
| **RTO** | Recovery Time Objective: how fast you must recover. | ~15-30 min |
| **RPO** | Recovery Point Objective: how much data you may lose. | ~5 min |
| **Blue-green** | Two environments; switch traffic. | Not used |
| **Canary** | Send a small % of traffic to the new version. | Not used |
| **FinOps** | Managing cloud cost like a budget. | Cost guide |
| **Idle resource** | Something running but unused. | NAT, EIP, old images |
| **k6** | A load-testing tool. | `apiserver/k6-tests/` |
| **Smoke test** | A quick test that the app basically works. | `scripts/smoke-test.sh` |

---

## Part F — Ten words people confuse

| Pair | Difference |
| :--- | :--- |
| **Image vs container** | Image = recipe; container = cooked dish. |
| **Hash vs encryption** | Hash = one-way; encryption = two-way. |
| **Authentication vs authorization** | Authentication = who are you? Authorization = what may you do? |
| **Liveness vs readiness** | Liveness = alive; readiness = able to serve. |
| **Request vs limit** | Request = reserved; limit = maximum. |
| **Scale up vs scale out** | Up = bigger machine; out = more machines. |
| **CI vs CD** | CI = test; CD = ship. |
| **Backup vs snapshot** | Backup = copy; snapshot = point-in-time image. |
| **SLO vs SLA** | SLO = internal goal; SLA = customer promise. |
| **State vs code** | Code = what you want; state = what Terraform created. |

---

## How to use this glossary

When you meet an unknown word:

1. Search this page.
2. Read the "simple meaning".
3. Find it in the project with the path in the third column.
4. Say it out loud in one sentence.

If you can do that, the word is yours.
