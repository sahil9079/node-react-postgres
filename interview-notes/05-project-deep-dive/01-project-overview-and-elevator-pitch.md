# Project Deep Dive: Overview & Elevator Pitch

> **Core Focus:** Introducing your project, stating your responsibilities clearly, and answering general architectural questions.

---

## 1. 60-Second Elevator Pitch (Memorize This)

> *"I engineered the complete DevOps lifecycle for a 3-tier Skills Management platform built with React, Express, and PostgreSQL. I containerized the services using Docker with multi-stage builds—reducing the frontend image from 1.2 GB to 23 MB—orchestrated local development with Docker Compose health checks, and wrote 10 Kubernetes manifests to deploy the application on AWS EKS with isolated namespaces, ConfigMap/Secret separation, and AWS Load Balancers. I also built a GitHub Actions CI/CD pipeline enforcing a 50% Jest test coverage gate, SonarQube code quality analysis, and Trivy container vulnerability scanning."*

---

## 2. Architecture at a Glance

```
Browser
  │
  ├── / (static files)
  └── /api/ (REST API calls)
       │
       ▼
┌──────────────────────────────┐
│ client pod — Nginx 1.29      │
│  /  → /usr/share/nginx/html  │   ← Serves compiled React SPA build (~23MB)
│  /api/ → proxy_pass apiserver│   ← Reverse proxies API requests
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ apiserver pod — Node 18 Slim │
│ JWT Auth · Skills CRUD       │   ← Port 8010, non-root user 'USER node'
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ postgres pod — PostgreSQL 15 │
│ Port 5432 · 3Gi EBS gp3 PVC  │   ← Persistent storage surviving pod restarts
└──────────────────────────────┘
```

---

## 3. Technology Stack Breakdown

| Layer | Technologies Used | Key DevOps Advantage |
| :--- | :--- | :--- |
| **Frontend** | React 17, Ant Design, React Router 6, Axios | Built via multi-stage Docker into pure static files served by Alpine Nginx. |
| **Backend** | Express 4, Sequelize ORM, JWT, bcryptjs, Sharp | Runs on `node:18-slim` with non-root user `node` (UID 1000) for security hardening. |
| **Database** | PostgreSQL 15 (Alpine) | Mounts an AWS EBS PersistentVolume via `dbpvc.yaml`. |
| **Orchestration** | Kubernetes (EKS) & Docker Compose | 10 manifests covering Namespace, ConfigMap, Secret, PVC, Deployments, and Services. |
| **CI/CD** | GitHub Actions | Parallel matrix testing, SonarQube analysis, Trivy security scanning. |
| **Testing** | Jest 29 + Supertest (62 total tests) | Enforces 50% minimum code coverage threshold in `jest.config.js`. |
