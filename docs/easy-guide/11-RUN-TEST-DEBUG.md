# 11 — Run, Test and Debug (Commands)

## 1. Before you start

You need:

```bash
node -v          # 18 or newer
npm -v
docker --version
kubectl version --client
terraform version
aws --version
```

On Windows, use **Git Bash** or **WSL** for `.sh` scripts. In PowerShell use `curl.exe`, not `curl`.

Always work on a branch:

```bash
git checkout -b learning/my-name
```

## 2. Run locally without Docker

```bash
# 1. environment file
copy apiserver\example.env apiserver\.config.env

# 2. database
docker run -d --name skills-pg \
  -e POSTGRES_PASSWORD=mypassword \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=sampledb \
  -p 5432:5432 \
  postgres:15-alpine

# 3. backend
cd apiserver
npm ci
node index.js

# 4. frontend (new terminal)
cd client
npm ci
npm start
```

Open `http://localhost:3000`.

## 3. Seed demo data

```bash
cd apiserver
node dev-data/seed.js
```

Warning: this uses `sync({ force: true })`, so it **drops tables**. Local only.

## 4. Run with Docker Compose

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f apiserver
```

| URL | What |
| :--- | :--- |
| `http://localhost` | app |
| `http://localhost:8010/healthz` | liveness |
| `http://localhost:8010/readyz` | readiness |
| `http://localhost:8010/metrics` | metrics |
| `http://localhost:9090` | Prometheus |
| `http://localhost:3001` | Grafana (`admin` / `adminpassword`) |

Stop:

```bash
docker compose down       # keep data
docker compose down -v    # delete data
```

## 5. Run the tests

```bash
cd apiserver
npm test
npm run test:unit
npm run test:integration
npm run test:coverage

cd ../client
npm test
npm run test:coverage
```

Coverage report: open `coverage/lcov-report/index.html`.

## 6. Test the API by hand

```bash
# health
curl.exe -i http://localhost:8010/healthz
curl.exe -i http://localhost:8010/readyz

# register (verification link prints in the API logs)
curl.exe -X POST http://localhost:8010/api/v1/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"firstName\":\"Test\",\"lastName\":\"User\",\"email\":\"test@example.com\",\"password\":\"Passw0rd!\",\"passwordConfirm\":\"Passw0rd!\"}"

# login and save the cookie
curl.exe -i -c cookies.txt -X POST http://localhost:8010/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"Passw0rd!\"}"

# use the cookie
curl.exe -b cookies.txt http://localhost:8010/api/v1/skills
```

## 7. Run on Kubernetes (kind)

```bash
kind create cluster --name skills

docker build -t skills-apiserver:local ./apiserver
docker build -t skills-client:local ./client
kind load docker-image skills-apiserver:local --name skills
kind load docker-image skills-client:local --name skills

kubectl apply -k k8s
kubectl get pods -n node-react-app -w

kubectl set image deployment/apiserver apiserver=skills-apiserver:local -n node-react-app
kubectl set image deployment/my-app-deployment client-server=skills-client:local -n node-react-app

kubectl port-forward -n node-react-app svc/apiserver-service 8010:8010
```

## 8. Deploy to AWS

```bash
# 1. check who you are
aws sts get-caller-identity
bash scripts/aws-preflight.sh ap-south-1

# 2. infrastructure
cd infra/envs/lab
terraform init
terraform plan -out=tfplan
terraform apply tfplan

# 3. cluster
aws eks update-kubeconfig --region ap-south-1 --name skills-lab-eks
kubectl get nodes

# 4. deploy
kubectl apply -k k8s/overlays/lab
kubectl rollout status deployment/apiserver -n node-react-app

# 5. test
bash scripts/smoke-test.sh http://<alb-host> http://<alb-host>
```

## 9. Debug by symptom

### "The website does not open"

```bash
docker compose ps
docker compose logs client
curl.exe -i http://localhost/nginx-health
```

### "502 Bad Gateway"

Meaning: NGINX cannot reach the API.

```bash
docker compose ps
docker compose logs apiserver
kubectl get pods -n node-react-app
kubectl get endpoints -n node-react-app
```

### "503 Service Unavailable"

Meaning: the API is alive but not ready.

```bash
curl.exe -i http://localhost:8010/readyz
docker compose logs db
# check DB_HOST, DB_USER, DB_PASS
```

### "500 Internal Server Error"

Meaning: the API crashed while handling the request.

```bash
docker compose logs apiserver | Select-Object -Last 50
```

### "401 Unauthorized"

Meaning: no valid session.

```bash
# check the cookie
curl.exe -i http://localhost:8010/api/v1/auth/check-auth
# check SESSION_COOKIE_NAME and secrets
```

### "403 Forbidden"

Meaning: logged in, but not allowed. In this app, you are not the owner of the skill.

### Pod `CrashLoopBackOff`

```bash
kubectl logs <pod> -n node-react-app --previous
kubectl describe pod <pod> -n node-react-app
```

### Pod `ImagePullBackOff`

```bash
kubectl describe pod <pod> -n node-react-app
aws ecr describe-images --repository-name skills-apiserver --region ap-south-1
```

### Pod `OOMKilled`

```bash
kubectl describe pod <pod> | Select-String -Pattern "OOMKilled|Exit Code"
kubectl top pod <pod> -n node-react-app
```

Fix: raise memory limit or reduce usage. For Node.js set `NODE_OPTIONS=--max-old-space-size=<75% of limit>`.

### Service has no endpoints

```bash
kubectl get endpoints -n node-react-app
kubectl get pods -n node-react-app --show-labels
```

The Service `selector` and Pod `labels` must match.

## 10. Useful one-liners

```bash
# last 100 log lines
docker compose logs --tail=100 apiserver

# follow logs
kubectl logs -f deploy/apiserver -n node-react-app

# restart a deployment
kubectl rollout restart deploy/apiserver -n node-react-app

# shell inside a pod
kubectl exec -it deploy/apiserver -n node-react-app -- sh

# check DNS from inside
kubectl run tmp --rm -it --image=busybox -- nslookup apiserver-service

# check port from inside
kubectl run tmp --rm -it --image=busybox -- nc -zv apiserver-service 8010
```

## 11. Clean up

```bash
# local
docker compose down -v
kind delete cluster --name skills

# AWS (always delete Kubernetes resources first so the ALB is removed)
kubectl delete -k k8s/overlays/lab --ignore-not-found
terraform -chdir=infra/envs/lab destroy
bash scripts/post-destroy-check.sh ap-south-1
```

## 12. The debugging mindset

1. **What changed?** (deploy, config, secret, network)
2. **What is the smallest failing thing?** (one URL, one Pod, one query)
3. **Is it alive?** (health)
4. **Is it ready?** (dependency)
5. **Can it reach its dependency?** (DNS, port, credentials)
6. **What do the logs say?** (last 50 lines)
7. **Fix one thing, then retest.**

Never change five things at once. You will not know which one worked.
