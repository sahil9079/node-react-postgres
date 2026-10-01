# Monitoring & Observability Fundamentals
## 1. Metrics vs Logs vs Traces (The 3 Pillars)
* **Metrics:** Numeric time-series values aggregated over intervals (CPU%, Memory usage, HTTP request rate, Latency p99). Best for alerting.
* **Logs:** Timestamped discrete textual records emitted by applications/systems. Best for root cause analysis of specific errors.
* **Traces:** End-to-end request journey tracking across distributed microservices via correlation IDs. Best for pinpointing latency bottlenecks.

## 2. Prometheus Architecture
Prometheus is a pull-based time-series database that scrapes metrics via HTTP endpoints (e.g., `/metrics`) exported by applications and Node Exporters.
