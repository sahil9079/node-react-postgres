# Level 3: Enterprise P0/P1 Incident Management Framework

> **Experience Target:** 3 to 3.5 Years Senior DevOps & Incident Lead  
> **Topic Scope:** P0/P1 Incident Lifecycle, Incident Commander (IC) protocol, war room management, MTTD/MTTR metrics, stakeholder communication, and the golden rules of live operations.

---

## 1. Incident Severity Definitions

| Severity | Definition | Examples | Response Target |
| :--- | :--- | :--- | :--- |
| **P0 (Critical / Blocker)** | Complete production outage; core business revenue flow down with no workaround. | All users receiving HTTP 500/502; database cluster down; user login broken. | **Acknowledge:** $< 5\text{ min}$<br>**Mobilize:** $< 10\text{ min}$ |
| **P1 (Major)** | Core service heavily degraded; significant percentage of users impacted with partial workaround. | High API latency ($> 3000\text{ms}$); profile image uploads failing; 20% error rate on skills CRUD. | **Acknowledge:** $< 15\text{ min}$<br>**Mobilize:** $< 20\text{ min}$ |
| **P2 (Minor)** | Non-critical functionality degraded; internal tools impacted; standard workaround available. | Admin dashboard stats slow; background report generation delayed. | Within 4 hours |
| **P3 (Trivial)** | Cosmetic bug, minor UI glitch, or minor log warning. | Typos on About page; non-breaking CSS alignment. | Next sprint |

---

## 2. The 5-Phase Incident Lifecycle

```
┌────────────────────────────────────────────────────────────────────────┐
│ The 5-Phase Incident Response Model                                    │
├────────────────────────────────────────────────────────────────────────┤
│ 1. DETECT & ACKNOWLEDGE  ──► PagerDuty / Datadog alert triggers oncall │
│ 2. MOBILIZE & TRIAGE     ──► Incident Commander + Slack War Room       │
│ 3. MITIGATE & RESTORE    ──► Stop the bleeding FIRST (Rollback/Scale)  │
│ 4. INVESTIGATE & ISOLATE ──► Deep logs & trace analysis in staging     │
│ 5. POST-MORTEM & RCA     ──► Blameless 5-Whys Post-Mortem + Action Items│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Incident Commander (IC) Protocol & War Room Roles

1. **Incident Commander (IC):**
   * Owns the incident from start to finish.
   * Directs the investigation, prevents panic/chaos, and makes executive decisions on whether to execute a rollback, scale up, or restart pods.
2. **Operations / Technical Lead:**
   * Gathers live telemetry: executes `kubectl`, checks Prometheus/Grafana graphs, inspects PostgreSQL queries, checks AWS CloudWatch logs.
3. **Communications Lead:**
   * Isolates the engineering team from external noise.
   * Updates the public Status Page (e.g. status.company.com) every 15–20 minutes with concise, non-technical updates.

### The Golden Rule of SRE Incident Management:
> **"Restore user service first; investigate root cause second."**  
> If an outage began after deploying version `v1.2.0`, do not spend 45 minutes attached to a live debugger in production. Execute `kubectl rollout undo` immediately to restore uptime, then debug the failed container in staging.
