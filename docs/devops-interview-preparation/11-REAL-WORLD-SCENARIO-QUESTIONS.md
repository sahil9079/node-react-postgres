# 11 — 60 Real-World Scenario-Based DevOps Questions (`11-REAL-WORLD-SCENARIO-QUESTIONS.md`)

> **Phase 17 — 60 Distinct Scenario-Based Questions (4 Levels × 15 Scenarios)**  
> **Mock-Interview Layout Rule:** Questions & Hints are presented first in each level so you can attempt the answer yourself. Complete diagnostic solutions (`Triage Order -> Commands -> Root Cause -> Safe Fix -> Sample Answer -> Common Wrong Approaches`) are provided in the Answer Key section immediately following each level's question bank.

---

## LEVEL 1 — Beginner / Fresher Scenarios (Scenarios 01–15)

### Level 1 Questions & Hints (Attempt Before Reading Solutions Below)

- **S-01 (`Port Conflict EADDRINUSE`)**: You start `apiserver` locally (`node index.js`), and it immediately crashes with `Error: listen EADDRINUSE: address already in use :::8010`.
  - *Competency*: Linux/OS ports & process management. *Hint*: Check which PID holds TCP port `8010`.
- **S-02 (`Permission Denied on Profile Image Upload`)**: A user uploads a profile photo (`POST /api/v1/users/profile`), and `apiserver` returns HTTP `500` with `EACCES: permission denied, open '/app/images/profile/...'`.
  - *Competency*: Linux filesystem ownership & non-root containers. *Hint*: Compare `USER node` (`UID 1000`) with directory ownership of `/app/images`.
- **S-03 (`Environment File Missing Locally`)**: A fresher clones the repository, runs `cd apiserver && node index.js`, and Sequelize fails to connect to PostgreSQL (`connect ECONNREFUSED 127.0.0.1:5432` with `undefined` database).
  - *Competency*: Env configuration & `.gitignore`. *Hint*: Look at `apiserver/index.js` line 2 (`dotenv.config({ path: './.config.env' })`).
- **S-04 (`NGINX 404 on React Page Refresh`)**: Opening `http://localhost/` works, clicking `/signin` works, but pressing `F5` (browser refresh) on `http://localhost/signin` would return `404 Not Found` on a default NGINX server.
  - *Competency*: SPA routing vs static file serving. *Hint*: Check `try_files` in `client/nginx.conf`.
- **S-05 (`Git Rejects Push — Non-Fast-Forward`)**: You try `git push origin main` and get `! [rejected] main -> main (fetch first)`.
  - *Competency*: Git collaboration workflow. *Hint*: Remote has commits you don't have locally; never blind `git push --force` on `main`.
- **S-06 (`Container Exits Immediately With Code 0`)**: Someone runs `docker run -d node:18-alpine` without a command, and `docker ps` shows nothing running.
  - *Competency*: Container `PID 1` lifecycle. *Hint*: A container lives only as long as its foreground `PID 1` process runs.
- **S-07 (`Cannot Connect to Container on 127.0.0.1`)**: An Express app listens on `app.listen(8010, '127.0.0.1')` inside Docker. `docker compose exec apiserver wget 127.0.0.1:8010/healthz` works, but `curl http://localhost:8010/healthz` from the host fails with `Empty reply from server / Connection reset`.
  - *Competency*: Container network namespaces & loopback binding. *Hint*: `127.0.0.1` inside a container is isolated to that container's network namespace.
- **S-08 (`Accidentally Staged .config.env`)**: Before committing, `git status` shows `new file: apiserver/.config.env` in green.
  - *Competency*: Git staging & secret hygiene. *Hint*: Unstage without deleting the local file (`git rm --cached`).
- **S-09 (`npm ci Fails in CI Pipeline`)**: A developer added a package with `npm install lodash` and updated `package.json`, but didn't commit `package-lock.json`. GitHub Actions fails on `npm ci`.
  - *Competency*: Deterministic dependency management. *Hint*: `npm ci` requires `package.json` and `package-lock.json` to match.
- **S-10 (`HTTP 401 vs HTTP 403 in RBAC`)**: A logged-in regular user (`role: user`) tries to access an admin-only endpoint guarded by `authorizeOnly('admin')` (`apiserver/middleware/athorizeOnly.js`) and gets `403 Forbidden`.
  - *Competency*: HTTP semantics (`Authentication` vs `Authorization`). *Hint*: Distinguish `isLoggedIn.js` (`401`) from `athorizeOnly.js` (`403`).
- **S-11 (`Disk Space Full on Build Server — No Space Left on Device`)**: Docker builds start failing with `write /var/lib/docker/...: no space left on device`.
  - *Competency*: Linux disk triage & Docker storage cleanup. *Hint*: Compare `df -h`, `df -i`, and `docker system df`.
- **S-12 (`DNS Resolution Fails Inside Container`)**: `apiserver` cannot resolve `db` hostname (`getaddrinfo ENOTFOUND db`).
  - *Competency*: Docker networks & internal DNS. *Hint*: Default `bridge` network vs user-defined bridge (`backend-net`).
- **S-13 (`CRLF Line Endings Break Shell Script`)**: Running `./scripts/smoke-test.sh` in Linux/WSL fails with `/bin/bash^M: bad interpreter`.
  - *Competency*: Cross-platform Windows/Linux line endings (`CRLF` vs `LF`). *Hint*: Check `sed -i 's/\r$//'` or `.gitattributes`.
- **S-14 (`PostgreSQL Container Loses All Data After Restart`)**: A junior engineer runs `docker compose down -v` at the end of the day, and the next morning all registered users in `sampledb` are gone.
  - *Competency*: Docker volumes & persistence. *Hint*: Understand `-v` (`--volumes`) flag impact on `dbdata`.
- **S-15 (`High CPU From Nodemon Watching node_modules`)**: Local CPU spikes to 100% when running the development server.
  - *Competency*: Process inspection (`top`/`htop`) & file watchers. *Hint*: Inspect process args and file watcher exclusions.

### Level 1 Diagnostic Solutions & Sample Interview Answers
- **S-01 Solution**: Run `lsof -i :8010` (Linux) or `netstat -ano | findstr :8010` (Windows) to identify the PID using port `8010` (often an orphaned Node process or running Docker container), then stop that process (`kill -15 <PID>` or `docker compose stop apiserver`). *Wrong approach*: Changing the application port in source code without checking why port `8010` is occupied.
- **S-02 Solution**: Inspect container user (`docker compose exec apiserver id` $\to$ `uid=1000(node)`) and folder permissions (`ls -ld /app/images`). Fix in `apiserver/Dockerfile` before switching to `USER node`: `RUN mkdir -p /app/images/profile && chown -R node:node /app`. *Wrong approach*: Running the container as `USER root` in production.
- **S-03 Solution**: Copy `apiserver/example.env` to `apiserver/.config.env` (`cp apiserver/example.env apiserver/.config.env`) and verify `DB_HOST`, `DB_USER`, `DB_PASS`, and `DB_NAME`.
- **S-04 Solution**: In `client/nginx.conf`, `location / { try_files $uri $uri/ /index.html; }` tells NGINX to fall back to `/index.html` whenever a route like `/signin` doesn't match a physical file on disk, allowing React Router to render the route.
- **S-05 Solution**: Run `git fetch origin` and `git pull --rebase origin main`, resolve any merge conflicts, run `npm test`, and push cleanly. *Wrong approach*: Running `git push --force` on `main`.
- **S-06 Solution**: Containers exit when `PID 1` finishes. `node:18-alpine` without a script exits immediately when stdin closes. In `apiserver/Dockerfile`, `CMD ["node", "index.js"]` keeps the HTTP server event loop running in the foreground.
- **S-07 Solution**: Bind Express to `0.0.0.0` (all interfaces, default in `app.listen(PORT)`) instead of `127.0.0.1` so packets arriving via the container's `eth0` bridge interface are accepted.
- **S-08 Solution**: Run `git rm --cached apiserver/.config.env` to remove it from the Git index while keeping it on disk, and verify `.config.env` is in `.gitignore`.
- **S-09 Solution**: Run `npm install` locally to sync `package-lock.json`, commit both `package.json` and `package-lock.json`, and push. Never replace `npm ci` with `npm install` in CI pipelines.
- **S-10 Solution**: `401 Unauthorized` (unauthenticated) means the request has no valid session cookie (`isLoggedIn.js`). `403 Forbidden` (unauthorized) means the user's identity is known, but their role (`req.role`) is not in the allowed list (`athorizeOnly.js`).
- **S-11 Solution**: Run `df -h` (block usage), `df -i` (inode exhaustion), and `docker system df`. Clean unused build cache and dangling images with `docker builder prune -f` and `docker image prune -f`.
- **S-12 Solution**: Inspect `docker network inspect node-react-postgres_backend-net`. Ensure both `apiserver` and `db` are attached to the user-defined bridge network `backend-net` in `docker-compose.yaml`.
- **S-13 Solution**: Convert `CRLF` to `LF` using `dos2unix scripts/*.sh` or `sed -i 's/\r$//' scripts/*.sh` and enforce `* text=auto eol=lf` in `.gitattributes`.
- **S-14 Solution**: `docker compose down -v` deletes named volumes (`dbdata`). Use `docker compose stop` or `docker compose down` (without `-v`) to preserve PostgreSQL data across restarts.
- **S-15 Solution**: Check `top`/`ps aux`, verify file watcher limits (`fs.inotify.max_user_watches`), and use production `node index.js` inside containers instead of `nodemon`.

---

## LEVEL 2 — Junior DevOps Engineer Scenarios (Scenarios 16–30)

### Level 2 Questions & Hints (Attempt Before Reading Solutions Below)

- **S-16 (`NGINX /api/ Trailing-Slash 404 Bug`)**: Frontend calls `POST /api/v1/auth/login`, NGINX forwards it to `apiserver`, and `apiserver` returns `404 Cannot POST /v1/auth/login`.
  - *Hint*: Compare `proxy_pass http://apiserver:8010/;` vs `proxy_pass http://apiserver:8010;` in `client/nginx.conf`.
- **S-17 (`apiserver Starts Before PostgreSQL Is Ready in Docker Compose`)**: On `docker compose up`, `apiserver` logs `SequelizeConnectionRefusedError: connect ECONNREFUSED` because Postgres is still initializing `/var/lib/postgresql/data`.
  - *Hint*: Check `depends_on` with `condition: service_healthy` and `pg_isready`.
- **S-18 (`500MB Backend Docker Image Bloated with DevDependencies`)**: Your `apiserver` image is huge and Trivy reports vulnerabilities in `jest` and `@babel/core`.
  - *Hint*: Multi-stage build + `npm ci --omit=dev`.
- **S-19 (`Secret Leaked Inside Docker Image Layer`)**: Even though `.config.env` is in `.gitignore`, running `docker history` or `docker run --rm apiserver cat .config.env` reveals local secrets inside the built image.
  - *Hint*: `.gitignore` does not apply to `docker build`; check `apiserver/.dockerignore`.
- **S-20 (`Docker Layer Cache Invalidated on Every Code Edit`)**: Changing a single comment in `apiserver/app.js` causes `docker build` to re-run `npm ci` from scratch every time.
  - *Hint*: Order of `COPY package*.json ./` vs `COPY . .` in `Dockerfile`.
- **S-21 (`Prometheus Target DOWN: Get "http://apiserver:8010/metrics": dial tcp: lookup apiserver`)**: Prometheus UI (`/targets`) shows `apiserver` state as `DOWN` with DNS lookup failure.
  - *Hint*: Check which Docker Compose networks `prometheus` and `apiserver` belong to (`monitoring-net`).
- **S-22 (`Grafana Dashboard Shows "No Data" After Container Restart`)**: Grafana starts up on `:3001`, you open the Node API dashboard, and panels say `Datasource prometheus was not found` or show no metrics.
  - *Hint*: Check `deploy/grafana/provisioning/datasources/prometheus.yml` UID (`uid: prometheus`) matching `deploy/grafana/dashboards/node-api.json`.
- **S-23 (`GitHub Actions SonarQube Job Shows 0.0% Test Coverage`)**: Jest runs `--coverage` in the `testing` job and passes `68%`, but the `sonarqube` job reports `0.0%` coverage.
  - *Hint*: Compare `upload-artifact` / `download-artifact` paths with `sonar.javascript.lcov.reportPaths` in `sonar-project.properties` (`F-02`).
- **S-24 (`Trivy Action Fails with Invalid Input Parameter`)**: GitHub Actions fails on the Trivy step because `vulnerabitlity-type` was misspelled in `.github/workflows/main.yaml`.
  - *Hint*: Check action parameter schema (`vuln-type: "os,library"`).
- **S-25 (`Terraform Init Fails on Backend Configuration`)**: A developer runs `terraform init` in `infra/envs/lab` before running `infra/bootstrap`, and gets `Error: Failed to get existing workspaces: S3 bucket does not exist`.
  - *Hint*: Chicken-and-egg bootstrap sequence (`infra/bootstrap` first, or `terraform init -backend=false` for local validation).
- **S-26 (`Terraform State Lock Error After Interrupted Run`)**: Your laptop loses Wi-Fi during `terraform plan`, and the next run says `Error: Error acquiring the state lock`.
  - *Hint*: Verify no teammate/CI job is running first, then inspect Lock ID (`terraform force-unlock <LOCK_ID>`).
- **S-27 (`AWS ECR Push Fails with 403 / No Basic Auth Credentials`)**: Running `docker push <account>.dkr.ecr.ap-south-1.amazonaws.com/skills-apiserver:sha` fails with `no basic auth credentials`.
  - *Hint*: ECR login token (`aws ecr get-login-password | docker login`) expires every 12 hours.
- **S-28 (`ECR Push Rejected: TagAlreadyExistsException`)**: Re-running a build attempts to push `skills-apiserver:v1.0.0` and ECR rejects it with `ImageTagAlreadyExistsException`.
  - *Hint*: `image_tag_mutability = "IMMUTABLE"` in `infra/modules/ecr/main.tf` requires unique tags (`${{ github.sha }}`).
- **S-29 (`React Client Cannot Send Session Cookie on Cross-Origin Request`)**: In local split-port testing (`localhost:3000` $\to$ `localhost:8010`), login succeeds (`200 OK`) but subsequent `/api/v1/auth/check-auth` calls have no cookie.
  - *Hint*: Check CORS `credentials: true` (`apiserver/app.js`), cookie `SameSite` (`authService.js`), and NGINX single-origin reverse proxy.
- **S-30 (`Container Healthcheck Always Unhealthy Despite App Running`)**: `docker compose ps` shows `client (unhealthy)` because `curl -f http://localhost/nginx-health` was used in `HEALTHCHECK`, and `curl` is not installed in `nginx:1.27-alpine`.
  - *Hint*: Use `wget -qO- http://127.0.0.1:80/nginx-health || exit 1` in Alpine images.

### Level 2 Diagnostic Solutions & Sample Interview Answers
- **S-16 Solution**: In NGINX, adding a trailing slash to `proxy_pass http://apiserver:8010/;` inside `location /api/` strips `/api/` from the URI. Removing the trailing slash (`proxy_pass http://apiserver:8010;`) preserves the full `/api/v1/auth/login` path.
- **S-17 Solution**: Configure a `healthcheck` on `db` (`pg_isready -U postgres -d sampledb`) and set `depends_on: db: condition: service_healthy` on `apiserver` in `docker-compose.yaml`.
- **S-18 Solution**: Use a 2-stage Dockerfile (`apiserver/Dockerfile`) with `RUN npm ci --omit=dev` in Stage 1 and copy only production `node_modules` into Stage 2.
- **S-19 Solution**: Add `.config.env` and `*.env*` to `apiserver/.dockerignore` so the Docker CLI excludes local secret files from the build context before sending it to the daemon.
- **S-20 Solution**: Copy `package.json` and `package-lock.json` first, run `npm ci --omit=dev`, and only then run `COPY . .`.
- **S-21 Solution**: Attach both `apiserver` and `prometheus` to `monitoring-net` in `docker-compose.yaml` so Docker's embedded DNS resolves `apiserver:8010`.
- **S-22 Solution**: Ensure `uid: prometheus` is explicitly set in `deploy/grafana/provisioning/datasources/prometheus.yml` so dashboard panels referencing `"uid": "prometheus"` bind automatically on startup.
- **S-23 Solution**: Download `coverage-apiserver` to `path: apiserver/coverage` and `coverage-client` to `path: client/coverage` in `.github/workflows/main.yaml` to match `sonar-project.properties` (`F-02`).
- **S-24 Solution**: Use `vuln-type: "os,library"` in `aquasecurity/trivy-action@0.28.0`.
- **S-25 Solution**: Provision the S3 state bucket via `infra/bootstrap` first, or use `terraform init -backend=false` for local syntax validation without AWS credentials.
- **S-26 Solution**: Confirm in GitHub Actions and with teammates that no `terraform` process is active, verify the `.tflock` metadata in S3, and run `terraform force-unlock <LOCK_ID>`.
- **S-27 Solution**: Authenticate Docker to ECR (`aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.ap-south-1.amazonaws.com`) or use `aws-actions/amazon-ecr-login@v2`.
- **S-28 Solution**: Our ECR repositories enforce `IMMUTABLE` tags (`infra/modules/ecr/main.tf`) to prevent supply-chain tag tampering. Tag every build with the immutable Git commit SHA (`${{ github.sha }}`).
- **S-29 Solution**: Serving both `/*` and `/api/*` through a single origin (NGINX on port `80` locally, or AWS ALB Ingress in EKS) eliminates cross-origin cookie blocking entirely.
- **S-30 Solution**: `nginx:1.27-alpine` includes `BusyBox wget`, not `curl`. Using `wget -qO- http://127.0.0.1:80/nginx-health || exit 1` in `client/Dockerfile` and `docker-compose.yaml` works reliably.

---

## LEVEL 3 — Intermediate DevOps Engineer Scenarios (Scenarios 31–45)

### Level 3 Questions & Hints (Attempt Before Reading Solutions Below)

- **S-31 (`Deployment Succeeds in CI, But Users Receive HTTP 503 From AWS ALB`)**: `deploy-lab.yml` pushes the image, `kubectl apply` succeeds, pods are created, but hitting the ALB DNS URL returns `503 Service Temporarily Unavailable`.
  - *Hint*: Trace ALB Target Group health $\to$ Service selector (`app: apiserver`) $\to$ Pod `/readyz` probe.
- **S-32 (`client Pod in Kubernetes Enters CrashLoopBackOff Immediately`)**: `apiserver` Pods are `Running 1/1`, but `my-app-deployment` (`client`) Pods crash every 10 seconds with `Exit Code 1`.
  - *Hint*: Inspect `kubectl logs -l app=client-app --previous` (`host not found in upstream "apiserver"`, Finding `F-01`).
- **S-33 (`apiserver Pod Stuck in CreateContainerConfigError`)**: `kubectl get pods -n node-react-app` shows `CreateContainerConfigError` on `apiserver`.
  - *Hint*: `kubectl describe pod` $\to$ missing `ConfigMap` (`configmap`) or `Secret` (`my-secret` / `ExternalSecret` sync failure).
- **S-34 (`Kubernetes Pod Cannot Connect to Private Amazon RDS PostgreSQL`)**: `apiserver` `/readyz` returns `503` with `SequelizeConnectionTimedOutError` or `self-signed certificate in certificate chain`.
  - *Hint*: Distinguish TCP timeout (`rds-sg` / Subnet route) from TLS rejection (`DB_SSL=true` in `apiserver/models/index.js`).
- **S-35 (`GitHub Actions Workflow Fails AWS OIDC Authentication`)**: `deploy-lab.yml` fails on `Configure AWS Credentials via GitHub OIDC` with `AccessDenied: Not authorized to perform sts:AssumeRoleWithWebIdentity`.
  - *Hint*: Check the IAM Role trust policy `sub` condition (`repo:sahil9079/node-react-postgres:ref:refs/heads/main`) in `infra/modules/iam/main.tf`.
- **S-36 (`EKS Pod Stuck in Pending State`)**: Scaling `apiserver` to 6 replicas leaves 2 Pods stuck in `Pending`.
  - *Hint*: Run `kubectl describe pod` $\to$ `0/2 nodes are available: Insufficient cpu / memory` or `maxPods` ENI IP limit on `t3.medium`.
- **S-37 (`AWS Load Balancer Controller Does Not Provision ALB for Ingress`)**: `kubectl get ingress -n node-react-app` shows an empty `ADDRESS` column after 10 minutes.
  - *Hint*: Check `kubectl describe ingress skills-platform-ingress` and VPC public subnet tags (`kubernetes.io/role/elb = 1`).
- **S-38 (`Pod Killed With OOMKilled Exit Code 137`)**: During load testing, `apiserver` restarts and `kubectl describe pod` shows `Last State: Terminated, Reason: OOMKilled, Exit Code: 137`.
  - *Hint*: Node.js heap + `sharp` image buffer exceeded `resources.limits.memory: 512Mi`.
- **S-39 (`Liveness Probe Causes Cascading Pod Restart Storm During Brief DB Glitch`)**: Someone changes `livenessProbe` in `k8s/apidep.yaml` from `/healthz` to `/readyz`. When RDS has a 10-second hiccup, all Pods restart simultaneously.
  - *Hint*: Explain why `livenessProbe` must NEVER check external dependencies like RDS.
- **S-40 (`ExternalSecret Stuck in SecretSyncedError`)**: `kubectl get externalsecret -n node-react-app` shows `SecretSyncedError` and `my-secret` is not created.
  - *Hint*: Check IRSA annotation on ServiceAccount, IAM policy (`secretsmanager:GetSecretValue`), and secret name `prod/node-react-app/credentials` (`F-04`).
- **S-41 (`ImagePullBackOff After Deploying to EKS`)**: `kubectl get pods` shows `ErrImagePull` / `ImagePullBackOff` on `apiserver`.
  - *Hint*: Check image tag existence in ECR, region mismatch, node IAM role (`AmazonEC2ContainerRegistryReadOnly`), or private subnet NAT Gateway connectivity.
- **S-42 (`Kustomize Build Fails With Containment Cycle Error`)**: Running `kubectl kustomize k8s/overlays/lab` fails with `accumulation err='cycle detected: ...'`.
  - *Hint*: Kustomize v5+ prohibits an overlay subdirectory from referencing its parent directory (`../../`) if the parent contains `kustomization.yaml`. Reference specific `../../<file>.yaml` resources instead.
- **S-43 (`Rolling Update Drops Active In-Flight Requests`)**: During a deployment, users experience a brief spike of `502 Bad Gateway` errors for 3 seconds as old Pods terminate.
  - *Hint*: ALB target deregistration delay vs `SIGTERM` graceful shutdown (`apiserver/index.js` lines 38–44) and `preStop` lifecycle hook.
- **S-44 (`HPA Shows <unknown>/70% for CPU Utilization`)**: `kubectl get hpa -n node-react-app` prints `TARGETS: <unknown>/70%` and never scales `apiserver`.
  - *Hint*: Either `metrics-server` is not installed in the cluster, or `resources.requests.cpu` is missing on the container spec.
- **S-45 (`HTTPS Certificate Validation Fails on AWS ALB`)**: Enabling HTTPS on `k8s/ingress.yaml` fails or browsers show `NET::ERR_CERT_AUTHORITY_INVALID`.
  - *Hint*: Check ACM certificate validation status (`ISSUED` in `ap-south-1`), domain CNAME record in Route 53, and `alb.ingress.kubernetes.io/certificate-arn`.

### Level 3 Diagnostic Solutions & Sample Interview Answers
- **S-31 Solution**: Check `kubectl get endpoints apiserver-service -n node-react-app`. If `ENDPOINTS` is `<none>`, either the Service selector doesn't match the Pod label (`app: apiserver`) or the Pods are failing `readinessProbe` (`GET /readyz` returning `503` because RDS is unreachable). Inspect `kubectl logs -l app=apiserver -n node-react-app`.
- **S-32 Solution**: `kubectl logs -l app=client-app -n node-react-app --previous` reveals `host not found in upstream "apiserver"`. Because `client/nginx.conf` proxies to `http://apiserver:8010`, Kubernetes must have a `Service` named `apiserver` (`k8s/apisrc.yaml`, fixed in `F-01`).
- **S-33 Solution**: Run `kubectl describe pod -l app=apiserver -n node-react-app`. Look at the `Events` section for `MountVolume` or `configMap "configmap" not found` / `secret "my-secret" not found`. Verify `k8s/configmap.yaml` and `k8s/secret.yaml` (or `ExternalSecret`) are applied in `node-react-app`.
- **S-34 Solution**: If the error is `ETIMEDOUT`, the network packet is blocked by Security Group `rds-sg` (verify inbound TCP `5432` from `eks-nodes-sg`). If the error is `PgError: no pg_hba.conf entry..., SSL off`, set `DB_SSL: "true"` in `k8s/overlays/lab/kustomization.yaml` so `apiserver/models/index.js` enables `dialectOptions.ssl`.
- **S-35 Solution**: Verify (1) `permissions: id-token: write` is present in `.github/workflows/deploy-lab.yml`, (2) the workflow is triggered from `refs/heads/main` matching `infra/modules/iam/main.tf` line 32, and (3) `secrets.AWS_OIDC_ROLE_ARN` matches `terraform output github_actions_oidc_role_arn`.
- **S-36 Solution**: Run `kubectl describe pod <pending-pod> -n node-react-app`. If `Insufficient cpu` or `Too many pods` (on `t3.medium`, AWS VPC CNI supports max 17 pods per node), increase node group `max_size` in `infra/envs/lab/main.tf` or enable Cluster Autoscaler.
- **S-37 Solution**: Run `kubectl logs -n kube-system deployment/aws-load-balancer-controller`. Confirm public subnets have tag `kubernetes.io/role/elb = 1` and `kubernetes.io/cluster/skills-lab-eks = shared` (`infra/modules/network/main.tf`).
- **S-38 Solution**: Monitor `nodejs_heap_used_bytes` and `process_resident_memory_bytes` on `/metrics`. Cap Node V8 heap below the container limit (`NODE_OPTIONS="--max-old-space-size=384"` for a `512Mi` container) and enforce file size limits in `uploadSingleFile.js`.
- **S-39 Solution**: Keep `livenessProbe` on `/healthz` (in-memory check) and `readinessProbe` on `/readyz` (DB check). Liveness restarts deadlocked processes; Readiness gates traffic when downstream dependencies fail.
- **S-40 Solution**: Run `kubectl describe externalsecret my-secret -n node-react-app`. Verify the secret `prod/node-react-app/credentials` exists in `ap-south-1` (`infra/modules/rds/main.tf`) and the ESO/Workload IAM Role has `secretsmanager:GetSecretValue` permission (`F-04`).
- **S-41 Solution**: Run `kubectl describe pod` to read the exact ECR pull error. Verify the `${{ github.sha }}` tag exists in ECR (`aws ecr describe-images`), the EKS worker nodes are in `private_app_subnets` with a working route to the NAT Gateway (`0.0.0.0/0`), and the node role has `AmazonEC2ContainerRegistryReadOnly`.
- **S-42 Solution**: List the individual manifest files (`../../namespace.yaml`, `../../apidep.yaml`, etc.) in `k8s/overlays/{lab,production}/kustomization.yaml` rather than referencing `../../` as a directory.
- **S-43 Solution**: When a Pod terminates, Kubernetes removes its IP from Endpoints and sends `SIGTERM` simultaneously. Because ALB takes a few seconds to stop sending requests to that Pod IP, add a `lifecycle.preStop.exec.command: ["sh", "-c", "sleep 5"]` hook so the Pod waits 5 seconds for ALB deregistration before `index.js` closes the HTTP server.
- **S-44 Solution**: Verify `kubectl get apiservice v1beta1.metrics.k8s.io` is `True` (install `metrics-server` if missing) and verify `resources.requests.cpu: 100m` is defined in `k8s/apidep.yaml`.
- **S-45 Solution**: ACM certificates are regional—the certificate must be issued in `ap-south-1` (Mumbai) for an ALB in `ap-south-1`, DNS CNAME validation records must be present, and `alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'` must be enabled on `k8s/ingress.yaml`.

---

## LEVEL 4 — Advanced ~3+ Years Competency Scenarios (Scenarios 46–60)

### Level 4 Questions & Hints (Attempt Before Reading Solutions Below)

- **S-46 (`Database Connection Pool Exhaustion Under HPA Scale-Out`)**: Traffic spikes 5x, HPA scales `apiserver` replicas up, and suddenly `/readyz` and `/api/v1/skills` fail with `SequelizeConnectionError: remaining connection slots are reserved for non-replication superuser connections`.
  - *Hint*: Multiply `maxReplicas` $\times$ `pool.max` (`apiserver/models/index.js`) against RDS `max_connections`.
- **S-47 (`High p95 Latency on /metrics While CPU and Memory Are Normal (<20%)`)**: Prometheus alerts `APIHighP95Latency` (`>0.5s`), Grafana shows `apiserver` CPU is 12% and Memory is 110Mi, yet API responses take 3 seconds.
  - *Hint*: Why would an I/O-bound Node.js server be slow with low CPU? (DB lock contention, unindexed query, or downstream network wait).
- **S-48 (`Rollback Restores Previous Image SHA, But Production Outage Persists`)**: A bad release breaks `/api/v1/skills`. You run `kubectl rollout undo deployment/apiserver -n node-react-app`, old Pods start, yet `500 Internal Server Error` continues.
  - *Hint*: Stateless code rolled back, but what stateful layer changed? (DB schema change, expired secret, or ConfigMap edit).
- **S-49 (`Release Works in Lab Overlay, Fails in Production Overlay`)**: `k8s/overlays/lab` works with `replicas: 1`, but when deployed to `k8s/overlays/production` (`replicas: 3`), users intermittently get `404 Not Found` on newly uploaded profile images (`apiserver/images/profile`).
  - *Hint*: Local container filesystem (`/app/images`) across 3 stateless Pod replicas behind a load balancer.
- **S-50 (`Terraform Plan Proposes Destructive Replacement (-/+) of Production RDS Instance`)**: A developer changes an attribute on `aws_db_instance.postgres` in `infra/modules/rds/main.tf`, and `terraform plan` shows `# aws_db_instance.postgres must be replaced (-/+ destroy and then create)`.
  - *Hint*: Identify immutable RDS attributes (e.g., `db_name`, `identifier`), `deletion_protection = true`, and safe blue/green or read-replica migration.
- **S-51 (`Unexpected $90 AWS Bill Spike From NAT Gateway Data Processing`)**: Compute sizes haven't changed, but AWS Cost Explorer shows a spike in `EC2-Other` (`NatGateway-Bytes` in `ap-south-1`).
  - *Hint*: Every image pull from ECR and secret read over NAT Gateway costs `$0.059/GB` unless VPC Endpoints (PrivateLink) are used.
- **S-52 (`Prometheus Memory OOM Due to High-Cardinality Metric Labels`)**: If a developer modifies `apiserver/metrics.js` to include raw `req.path` (with user IDs, tokens, and query strings) and `user_email` as Prometheus labels, Prometheus crashes after 48 hours.
  - *Hint*: Explain Time-Series Cardinality Explosion and how `normalizeRoute()` in `apiserver/metrics.js` prevents it.
- **S-53 (`Kubernetes Node Drain During EKS Upgrade Causes 100% API Downtime`)**: During an EKS Managed Node Group AMI update, AWS drains a node and all running `apiserver` Pods are evicted at the same time because both replicas were scheduled on the same EC2 node.
  - *Hint*: Combine `PodDisruptionBudget` (`k8s/pdb.yaml` `minAvailable: 1`) with `podAntiAffinity` / `topologySpreadConstraints` across `ap-south-1a` and `ap-south-1b`.
- **S-54 (`Critical CVE Announced in Alpine libssl / Node Base Image on Friday Evening`)**: Security team flags a Critical `CVE` in `node:18-alpine`. How do you patch, verify, and roll out across `apiserver` and `client` with zero downtime?
  - *Hint*: Base image bump / `apk upgrade --no-cache`, Trivy verification gate (`exit-code: "1"`), immutable SHA build, rolling update (`maxUnavailable: 0`).
- **S-55 (`Availability Zone Outage in ap-south-1a Breaks Outbound Traffic in ap-south-1b`)**: `ap-south-1a` experiences an AWS outage. EKS nodes in `ap-south-1b` stay healthy, but Pods in `ap-south-1b` suddenly cannot reach external APIs.
  - *Hint*: Cross-AZ dependency on a single NAT Gateway (`single_nat_gateway = true` in `ap-south-1a`).
- **S-56 (`Terraform Destroy Hangs for 45 Minutes on aws_vpc.main and aws_subnet.public`)**: You try to tear down the lab using `terraform destroy` directly without deleting Kubernetes resources first.
  - *Hint*: AWS Load Balancer Controller created an out-of-band ALB and ENIs inside the VPC subnets (`Procedure B` in `docs/AWS_COST_OPTIMIZATION_AND_CLEANUP.md`).
- **S-57 (`JWT/Session Cookie Invalidated Across Replicas or After Secret Rotation`)**: Rotating `SESSION_ENCRYPT_SECRET` in AWS Secrets Manager causes all currently logged-in users to be logged out with `401 Unauthorized` (`apiserver/utils/session.js`).
  - *Hint*: Dual-key decryption window (`current_key` + `previous_key`) during secret rotation.
- **S-58 (`Untrusted Fork Pull Request Attempts to Exfiltrate AWS OIDC Credentials in GitHub Actions`)**: An external contributor opens a Pull Request modifying `.github/workflows/main.yaml` to print environment secrets or assume the AWS OIDC role.
  - *Hint*: Why `deploy-lab.yml` is separate from `main.yaml`, guarded by GitHub Environment protection rules and IAM OIDC `sub == ref:refs/heads/main`.
- **S-59 (`Database Corruption at 14:32 UTC — Designing Point-in-Time Recovery (PITR) for RDS`)**: A buggy script deletes rows from the `skills` table in production RDS at `14:32 UTC`. How do you recover to `14:31 UTC` and what are your RTO and RPO?
  - *Hint*: `aws rds restore-db-instance-to-point-in-time` creates a new RDS endpoint; update `DB_HOST` in `ConfigMap` and restart `apiserver`.
- **S-60 (`Defending Why You Used EKS vs ECS/App Runner in a 3+ Year Technical Interview`)**: An interviewer asks: *"Your app has only 2 microservices (`client` and `apiserver`) and 1 PostgreSQL database. Isn't Amazon EKS overkill and expensive (`$73/month` control plane) for this?"*
  - *Hint*: Give a mature, honest architectural answer acknowledging the cost trade-off (`ECS Fargate` vs `EKS`) and why `EKS` was built as a multi-service enterprise reference platform with strict teardown controls.

### Level 4 Diagnostic Solutions & Sample Interview Answers
- **S-46 Solution**: Check CloudWatch `DatabaseConnections` on RDS and `pg_stat_activity`. With `pool.max: 5` (`apiserver/models/index.js`) and `maxReplicas: 6` (`k8s/hpa.yaml`), max connections = `30`. If `maxReplicas` is raised higher, either lower per-pod `pool.max`, introduce **Amazon RDS Proxy / PgBouncer** for connection multiplexing, or scale the RDS instance class.
- **S-47 Solution**: Node.js is single-threaded and asynchronous—waiting on network or database I/O consumes almost 0% CPU while request duration (`http_request_duration_seconds`) skyrockets. Inspect RDS `ReadLatency`/`WriteLatency`, check `pg_stat_activity` for `wait_event_type = 'Lock'`, and add missing PostgreSQL indexes.
- **S-48 Solution**: `kubectl rollout undo` only reverts the container image inside the Deployment pod template; it does NOT revert external state (`RDS` tables, `ConfigMap`, or `Secret`). Inspect recent changes to `k8s/configmap.yaml`, `ExternalSecret`, and PostgreSQL schema (`sampledb`).
- **S-49 Solution**: In `apiserver/controllers/userController.js`, uploaded images are saved to local container disk (`/app/images`). With `replicas: 3`, Pod A writes the file to its local ephemeral overlayfs, and when the user's `GET` request hits Pod B, the file does not exist (`404`). Fix: Store uploaded images in **Amazon S3** (using Pod IRSA permissions) instead of local container storage.
- **S-50 Solution**: Never allow `-/+` replacement on a stateful production RDS instance. Set `deletion_protection = true` and `lifecycle { prevent_destroy = true }` in production Terraform. For changes requiring replacement, use an RDS Read Replica promotion or AWS RDS Blue/Green Deployment.
- **S-51 Solution**: Worker nodes in private subnets pull container images from ECR and fetch secrets from Secrets Manager through the NAT Gateway (`$0.059/GB`). Add **VPC Gateway Endpoint for S3** (free, where ECR image layers are stored) and **VPC Interface Endpoints** for ECR API/DKR and Secrets Manager.
- **S-52 Solution**: Every unique combination of label key-values creates a new time series in Prometheus TSDB. Unbounded labels (`user_id`, raw URLs) cause millions of series and OOM crashes. In `apiserver/metrics.js`, `normalizeRoute()` replaces dynamic UUIDs and numeric IDs with `:id` so label cardinality stays bounded (`< 50` unique routes).
- **S-53 Solution**: A `PodDisruptionBudget` (`minAvailable: 1` in `k8s/pdb.yaml`) prevents voluntary eviction of the last Pod, and `topologySpreadConstraints` (`topologyKey: topology.kubernetes.io/zone`) ensures replicas are distributed across `ap-south-1a` and `ap-south-1b` so a single-node or single-AZ failure never drops availability to 0.
- **S-54 Solution**: Rebuild `apiserver/Dockerfile` and `client/Dockerfile` with `docker build --pull` (and `RUN apk upgrade --no-cache` if needed), run Trivy image scan with `severity: CRITICAL,HIGH` and `exit-code: "1"` to verify 0 Critical CVEs, push the new immutable Git SHA image to ECR, and perform a zero-downtime `RollingUpdate` (`maxUnavailable: 0, maxSurge: 1`).
- **S-55 Solution**: In `infra/envs/lab/main.tf`, `single_nat_gateway = true` places a single NAT Gateway in `ap-south-1a` to save `$43/month` in lab costs. For multi-AZ production resilience, set `single_nat_gateway = false` so each Availability Zone (`ap-south-1a` and `ap-south-1b`) has its own independent NAT Gateway and route table.
- **S-56 Solution**: Terraform does not know about the AWS ALB created dynamically by the Kubernetes AWS Load Balancer Controller. Always run `kubectl delete ingress skills-platform-ingress -n node-react-app` first, wait ~90s for AWS to delete the ALB and release its ENIs, and then run `terraform destroy` (`docs/AWS_COST_OPTIMIZATION_AND_CLEANUP.md`).
- **S-57 Solution**: Support key rotation by accepting a comma-separated keyring (`SESSION_ENCRYPT_KEYS="new_key,old_key"`): always encrypt new cookies with `keys[0]`, and in `decrypt()` attempt `keys[0]` first and fall back to `keys[1]` during the 24-hour `JWT_SESSION_EXPIRY` transition window.
- **S-58 Solution**: (1) `.github/workflows/main.yaml` only has `permissions: contents: read` and no `id-token: write`. (2) `.github/workflows/deploy-lab.yml` only triggers on manual `workflow_dispatch`, uses GitHub Environment protection rules, and the AWS IAM Role trust policy (`infra/modules/iam/main.tf`) strictly requires `token.actions.githubusercontent.com:sub == "repo:sahil9079/node-react-postgres:ref:refs/heads/main"`.
- **S-59 Solution**: Because `backup_retention_period = 7` is enabled in `infra/modules/rds/main.tf`, RDS continuously archives WAL logs to S3 (`RPO ~ 5 minutes`). Run `aws rds restore-db-instance-to-point-in-time --source-db-instance-identifier skills-lab-postgres --target-db-instance-identifier skills-lab-postgres-restored --restore-time 2026-10-18T14:31:00Z`. Once `available` (`RTO ~ 15-20 minutes`), update `DB_HOST` in `k8s/configmap.yaml` and run `kubectl rollout restart deployment/apiserver -n node-react-app`.
- **S-60 Solution**: "For a standalone 2-service application in a small startup, **AWS ECS Fargate** or **AWS App Runner** is much more cost-effective because it avoids the `$73/month` EKS control plane fee and operational overhead. I architected this project on **Amazon EKS** specifically to practice and demonstrate enterprise Kubernetes patterns—such as ALB Ingress path routing, Kustomize overlays, Startup/Liveness/Readiness probe separation, HPA/PDB high availability, and OIDC/IRSA least-privilege security—while using Local Docker Compose for daily work and strict dependency-ordered teardown scripts to keep my AWS lab bill near zero."
