# Level 3: Incident Scenario — HTTP 500 & Backend Crash Triage

> **Incident Severity:** P0 / Critical  
> **Symptom:** Users receive HTTP 500 (Internal Server Error) on API endpoints.

---

## 1. Step-by-Step Triage Workflow

```
[HTTP 500 Alert Fired]
       │
       ▼
1. Check Blast Radius ──► Are all endpoints 500 or only specific routes (/api/v1/auth/login)?
       │
       ▼
2. Check API Pod Logs ──► kubectl logs -l app=apiserver -n node-react-app --tail=100
       │
       ├──► Uncaught Exception / Null Pointer? ──► Rollback deployment (kubectl rollout undo)
       │
       └──► DB Connection Refused? ─────────────► Check PostgreSQL Pod & Service Health
```

---

## 2. Real Investigation Commands

### Step 1: Check Ingress and Backend Pod Health
```bash
# 1. Check if backend pods are healthy or crashing
kubectl get pods -n node-react-app -l app=apiserver -o wide

# 2. Tail live error logs across all API pods
kubectl logs -l app=apiserver -n node-react-app --tail=200 --prefix | grep -iE "error|exception|unhandled"
```

### Step 2: Common Project Root Causes & Diagnoses
* **Sequelize Database Disconnect:**
  * *Log signature:* `SequelizeConnectionRefusedError: connect ECONNREFUSED 10.100.24.12:5432`
  * *Action:* Check if the PostgreSQL pod is alive:
    ```bash
    kubectl get pods -n node-react-app -l app=postgres-db
    kubectl describe pod -l app=postgres-db -n node-react-app
    ```
* **Missing Environment Secret:**
  * *Log signature:* `JsonWebTokenError: secret or public key must be provided`
  * *Action:* Check if `JWT_SECRET` is missing in `k8s/secret.yaml`.
* **Database Schema Migration Failure:**
  * *Log signature:* `SequelizeDatabaseError: column "user_role" does not exist`
  * *Action:* Code was deployed before database migration ran.

---

## 3. Mitigation & Recovery Playbook
1. If the error began immediately after a release:
   ```bash
   kubectl rollout undo deployment/apiserver -n node-react-app
   kubectl rollout status deployment/apiserver -n node-react-app
   ```
2. Verify traffic health:
   ```bash
   curl -Iv http://<ALB_DNS>/api/v1/skills
   ```
