# Project Deep Dive: Real Troubleshooting Stories & Interview Scripts

> **Core Focus:** Practical stories and authentic scripts for answering difficult behavioral and technical interview questions.

---

## 1. Top Real Troubleshooting Stories

### Story 1: Debugging Jest 25 Incompatibility with Modern Node Modules
* **The Problem:** Unit tests failed during test suite execution with `Cannot find module 'node:fs'` and syntax errors when importing `sharp` and `formidable`.
* **Investigation:** Researched the failure and discovered that Jest v25 did not support the modern Node.js `node:` URI protocol prefix introduced in newer package releases.
* **Resolution:** Upgraded the test harness to **Jest v29** (`jest@^29.7.0`), updated Babel configurations, and resolved native module compatibility with `supertest@6` and `uuid@9`.
* **Interview Insight:** *"I learned that when modern dependencies update their protocol resolution, upgrading the testing framework is cleaner than hacking node_modules or mocking core Node APIs."*

---

### Story 2: SonarQube Authentication & Docker Volume Persistence
* **The Problem:** Local SonarQube Scanner kept failing with `Not Authorized` despite generating fresh authentication tokens in the SonarQube web UI.
* **Investigation:** Found that the local SonarQube Docker container was executed without persistent volume mounts. Every time the container was restarted, its internal database wiped, invalidating all previously generated API tokens.
* **Resolution:** Re-created the container with dedicated Docker named volumes:
  ```bash
  docker run -d --name sonarqube -p 9000:9000 \
    -v sonarqube_data:/opt/sonarqube/data \
    -v sonarqube_extensions:/opt/sonarqube/extensions \
    sonarqube:lts-community
  ```

---

## 2. Professional & Honest Interview Scripts

### Q: "Did you manage this project in a live company production environment?"
> **Recommended Answer:**  
> *"I built this as a comprehensive, production-grade project where I designed the complete DevOps lifecycle from scratch. While it ran in a dedicated cloud staging/sandbox environment rather than a live multi-tenant commercial system, I strictly followed enterprise best practices—including multi-stage container optimization, non-root users, Kubernetes secrets separation, health probes, and automated CI/CD quality gates. In a large-scale commercial setup, I would expand on this by adding Amazon RDS Multi-AZ, Karpenter autoscaling, and Prometheus/Grafana observability."*
