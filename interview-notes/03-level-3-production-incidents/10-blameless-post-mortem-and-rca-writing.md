# Level 3: Blameless Post-Mortem & Root Cause Analysis (RCA) Writing

> **Experience Target:** 3 to 3.5 Years Senior DevOps & Incident Lead  
> **Topic Scope:** The 5 Whys methodology, writing executive post-mortems, actionable preventative tasks, blameless culture.

---

## 1. The Blameless Post-Mortem Philosophy

* **Core Principle:** Human error is the *symptom* of a deeper systemic failure, not the root cause.
* If an engineer deployed a bug that broke production, the post-mortem does not ask *"Why was the engineer careless?"*. It asks:
  * *"Why did our automated CI/CD tests not catch this bug before merge?"*
  * *"Why did our staging environment not replicate production schema?"*
  * *"Why did our deployment pipeline lack automated canary rollback?"*

---

## 2. Complete Enterprise RCA Template

### Incident Report: INC-2026-08-104

| Parameter | Details |
| :--- | :--- |
| **Incident Title** | Complete API Outage (HTTP 500) Following v1.2.0 Deployment |
| **Severity** | P0 (Critical) |
| **Impact Duration** | 22 minutes (14:02 UTC – 14:24 UTC) |
| **Impacted Services** | Authentication & Skills CRUD (`/api/v1/*`) |
| **Total Affected Requests** | ~4,200 failed user requests (100% login failure rate) |
| **Incident Commander** | DevOps Lead |

---

### 1. Executive Summary
On August 26, 2026, at 14:02 UTC, a deployment of `apiserver:v1.2.0` triggered a total outage across all API endpoints due to an unhandled database exception. At 14:18 UTC, on-call engineers executed an emergency rollback to `v1.1.0`. Service was fully restored at 14:24 UTC with zero customer data loss.

---

### 2. Chronological Timeline (UTC)
* **14:02** - GitHub Actions completed deployment of `sahil9079/js-apiserver:v1.2.0`.
* **14:05** - PagerDuty alert fired: HTTP 500 error rate exceeded 5% threshold.
* **14:08** - Incident Commander initiated Slack war room `#inc-202608-api-down`.
* **14:12** - Operations engineer identified `SequelizeDatabaseError: column "is_verified" does not exist` in pod logs.
* **14:18** - Incident Commander approved and executed `kubectl rollout undo deployment/apiserver`.
* **14:21** - Previous pods in revision 1 reached `Ready` state.
* **14:24** - Synthetic canary checks confirmed 100% success on `/api/v1/auth/login`. Incident closed.

---

### 3. Root Cause Analysis (The 5 Whys)
1. **Why did users receive HTTP 500?** Express crashed on startup querying column `is_verified` on the `users` table.
2. **Why was the query made?** Code in `v1.2.0` assumed the `is_verified` column existed.
3. **Why did the column not exist?** The Sequelize database migration had not been executed in production.
4. **Why was the migration not executed?** The GitHub Actions pipeline had no automated database migration step prior to pod rollout.
5. **Why was this not caught in Staging?** Staging database had been manually migrated by a developer earlier that day, masking the CI/CD pipeline deficiency.

---

### 4. Corrective & Preventative Action Items

| Action Item | Type | Owner | Target Date |
| :--- | :--- | :--- | :--- |
| Add automated Kubernetes migration `Job` in GitHub Actions pipeline prior to deployment rollout. | Preventative (CI/CD) | DevOps Team | Completed |
| Enforce policy banning manual schema migrations on Staging and Production databases. | Process | Tech Lead | Immediate |
| Implement an automated synthetic health probe pinging `/api/v1/auth/login` every 30s. | Observability | DevOps Team | Sprint 14 |
