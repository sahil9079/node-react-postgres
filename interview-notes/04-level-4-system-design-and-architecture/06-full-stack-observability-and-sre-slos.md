# Level 4: Full-Stack Observability & SRE Reliability Metrics

> **Experience Target:** 4-Year Senior DevOps & Platform Architect  
> **Topic Scope:** The 3 pillars of observability (Metrics, Logs, Traces), Prometheus Operator, Grafana dashboards, Loki log aggregation, SLI, SLO, SLA, and Error Budgets.

---

## 1. The 3 Pillars of Cloud-Native Observability

1. **Metrics (Prometheus & Grafana):**
   * Numeric time-series data capturing aggregated behavior (CPU usage, memory consumption, request rates, HTTP 5xx error counts, database connection pool stats).
2. **Logs (Grafana Loki / FluentBit):**
   * Timestamped text events emitted by containers to `stdout`/`stderr`. FluentBit streams logs from nodes to Loki for centralized search by namespace/pod label.
3. **Traces (OpenTelemetry & Tempo/Jaeger):**
   * Traces individual request spans as they travel across distributed boundaries (Browser $\to$ Ingress $\to$ Express $\to$ PostgreSQL), pinpointing exact microsecond bottlenecks.

---

## 2. Reliability Engineering: SLI, SLO, SLA & Error Budgets

```
100% ─────────────────────────────────────────────────────────────
      ▲
      │ 99.9% SLO Target (Allowed Room for Failure = 0.1% Error Budget)
      ▼
 0%  ─────────────────────────────────────────────────────────────
```

* **Service Level Indicator (SLI):**
  * A formal, quantifiable measurement of real-time service health.
  * *Example:* "Percentage of successful HTTP requests (status $< 500$) on `/api/v1/*` with latency $p95 < 200\text{ms}$."
* **Service Level Objective (SLO):**
  * The target reliability goal agreed upon by engineering and product teams.
  * *Example:* "99.9% of API requests must succeed with $< 200\text{ms}$ latency over a rolling 30-day window."
* **Service Level Agreement (SLA):**
  * The legal and financial contract with external paying customers.
  * *Example:* "99.5% uptime guaranteed, or customers receive a 10% credit."
* **Error Budget Management Policy:**
  * **Error Budget = $100\% - \text{SLO} = 0.1\%$ (approx. 43 minutes of allowed downtime per month).**
  * **When Error Budget is Healthy:** Engineering deploys features quickly, runs canary experiments, and ships new releases.
  * **When Error Budget is Exhausted:** Feature deployments are frozen; all engineering effort shifts strictly to fixing technical debt, improving test suites, and hardening reliability.
