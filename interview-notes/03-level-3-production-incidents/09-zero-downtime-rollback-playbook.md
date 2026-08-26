# Level 3: Production Playbook — Zero-Downtime Rollback & Deployment Recovery

> **Incident Severity:** Emergency Response  
> **Topic Scope:** Live rollback procedures, revision history inspection, rollbacks with database migrations, verifying cluster recovery.

---

## 1. The Emergency Rollback Runbook

When a broken build bypasses testing and reaches production, execute the following commands in sequence:

```bash
# 1. View recent deployment rollout history and revision IDs
kubectl rollout history deployment/apiserver -n node-react-app

# 2. Inspect the spec of the previous revision
kubectl rollout history deployment/apiserver -n node-react-app --revision=2

# 3. Immediately trigger rollback to the previous revision (Revision N-1)
kubectl rollout undo deployment/apiserver -n node-react-app

# 4. Or rollback to a specific known-good revision
kubectl rollout undo deployment/apiserver -n node-react-app --to-revision=2

# 5. Monitor the progress of the rolling replacement
kubectl rollout status deployment/apiserver -n node-react-app

# 6. Verify all pods are running and ready
kubectl get pods -n node-react-app -l app=apiserver
```

---

## 2. Handling Rollbacks with Database Schema Changes

### The Golden Rule of Database Migrations:
> **"All database migrations MUST be backward-compatible (Expand and Contract pattern)."**

* **The Problem:** If version `v1.2.0` immediately renames or deletes a database column that `v1.1.0` depends on, rolling back `v1.2.0` code will crash `v1.1.0`!
* **The Safe 3-Step Migration Strategy:**
  1. **Phase 1 (Expand):** Add the new column `new_col` alongside `old_col` as nullable. Deploy code `v1.2.0` that writes to both columns.
  2. **Phase 2 (Backfill):** Backfill historical data from `old_col` to `new_col`.
  3. **Phase 3 (Contract):** Deploy code `v1.3.0` reading only `new_col`. Later, run a cleanup migration dropping `old_col`.
* This ensures that rolling back at any stage does not break database integrity.
