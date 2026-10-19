# 09 — Monitoring, Logging & Observability (`09-MONITORING-AND-OBSERVABILITY.md`)

---

## 1. Simple Hinglish Explanation & Official English Terminology

**Observability** ke 3 pillars hote hain (**Metrics, Logs, Traces**), aur SRE mein hum **Four Golden Signals** monitor karte hain:
1. **Latency**: Request ko complete hone mein kitna time laga (`http_request_duration_seconds_bucket` histogram in [apiserver/metrics.js](file:///d:/javascript_project/node-react-postgres/apiserver/metrics.js)).
2. **Traffic**: Har second kitni requests aa rahi hain (`rate(http_requests_total[5m])`).
3. **Errors**: Kitne percent requests HTTP `5xx` fail ho rahi hain (`status_code=~"5.."`).
4. **Saturation**: CPU, Memory Heap (`process_heap_used_bytes / process_heap_total_bytes`), aur RDS DB connections kitne full hain.

---

## 2. How Our Zero-Dependency Prometheus Collector Works (`apiserver/metrics.js`)

Humne [apiserver/metrics.js](file:///d:/javascript_project/node-react-postgres/apiserver/metrics.js) mein **Cardinality Explosion** rokne ke liye `normalizeRoute()` likha hai:
- Agar `/api/v1/skills/42` aur `/api/v1/skills/99` ko alag label milta, toh hazaron unique time-series ban jati aur Prometheus OOM ho jata.
- `normalizeRoute()` UUIDs aur numeric IDs ko `:id` mein replace kar deta hai (`/api/v1/skills/:id`), jisse metrics clean aur bounded rehti hain.

---

## 3. Essential PromQL Queries & Alert Rules ([deploy/prometheus/alerts.yml](file:///d:/javascript_project/node-react-postgres/deploy/prometheus/alerts.yml))

```promql
# 1. Total Request Rate (RPS)
sum(rate(http_requests_total[5m]))

# 2. HTTP 5xx Error Percentage (SLI for Availability SLO >= 99.9%)
(sum(rate(http_requests_total{status_code=~"5.."}[5m])) / clamp_min(sum(rate(http_requests_total[5m])), 0.001)) * 100

# 3. 95th Percentile (p95) API Latency in Seconds
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# 4. Node.js V8 Heap Saturation Ratio
nodejs_heap_used_bytes / nodejs_heap_total_bytes
```

---

## 4. SLI, SLO, SLA & Error Budget (Interview Defense)

- **SLI (Service Level Indicator)**: Actual measurement, e.g., `99.94%` of `/api/v1/*` requests succeeded (`non-5xx`) in under `300ms`.
- **SLO (Service Level Objective)**: Internal engineering target, e.g., `99.9%` availability over a 30-day window.
- **Error Budget**: `100% - 99.9% = 0.1%` allowed downtime (`~43.2 minutes/month`). Agar ek bad deployment mein 30 minutes खर्च ho gaye, toh team naye risky features freeze karke stability aur testing par focus karti hai.
