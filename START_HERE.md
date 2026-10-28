# START HERE

This repository has a lot of files. Do not read them in alphabetical order. Read them in this order:

## 1. Learn the project (easy language)

Open **[`docs/easy-guide/README.md`](docs/easy-guide/README.md)**.

It contains 14 short files in the correct order:

```
00-START-HERE
01-BIG-PICTURE
02-GLOSSARY
03-FILE-MAP
04-BACKEND
05-FRONTEND
06-DOCKER-COMPOSE
07-KUBERNETES
08-TERRAFORM-AWS
09-CICD
10-MONITORING-SECURITY
11-RUN-TEST-DEBUG
12-CLEANUP-AND-ORDER
13-STUDY-PLAN
```

## 2. Then read the project summary

- [`README.md`](README.md) — what the project is and how to start
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — why it is designed this way

## 3. Then go deeper (optional)

- [`DEVOPS_FRESHER_TO_SENIOR_BUILD_GUIDE.md`](DEVOPS_FRESHER_TO_SENIOR_BUILD_GUIDE.md) — full course
- [`HOW_TO_READ_AND_MASTER_THIS_PROJECT.md`](HOW_TO_READ_AND_MASTER_THIS_PROJECT.md) — reading order + drills
- [`KUBERNETES_DEEP_DIVE.md`](KUBERNETES_DEEP_DIVE.md) — Kubernetes detail
- [`DEVOPS_IMPLEMENTATION_GUIDE.md`](DEVOPS_IMPLEMENTATION_GUIDE.md) — long reference manual
- [`AWS_COST_OPTIMIZATION_AND_CLEANUP.md`](AWS_COST_OPTIMIZATION_AND_CLEANUP.md) — cost and safe teardown

## 4. First commands

```bash
copy apiserver\example.env apiserver\.config.env
docker compose up --build -d
curl.exe http://localhost:8010/healthz
curl.exe http://localhost:8010/readyz
```

Then open `http://localhost`.

## 5. The one-sentence summary

React (browser) talks to Node.js/Express (API) which talks to PostgreSQL (data); Docker packages it, Kubernetes runs it, Terraform creates AWS, GitHub Actions tests and deploys it, and Prometheus/Grafana watch it.
