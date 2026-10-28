# 10 — Monitoring, Reliability and Security in Simple Words

## 1. Three pillars of observability

| Pillar | Simple meaning | In this project |
| :--- | :--- | :--- |
| **Metrics** | Numbers over time | `/metrics` + Prometheus |
| **Logs** | Text messages about events | `console.log`, container logs, CloudWatch |
| **Traces** | The path of one request across services | **Not implemented** |

A senior knows what is missing. "We have metrics and logs, but no tracing" is an honest answer.

## 2. The Four Golden Signals

| Signal | Question | Metric here |
| :--- | :--- | :--- |
| **Latency** | How slow? | `http_request_duration_seconds` |
| **Traffic** | How many requests? | `http_requests_total` |
| **Errors** | How many failed? | `status_code=~"5.."` |
| **Saturation** | How full? | memory, CPU |

## 3. How metrics work here

```
apiserver/metrics.js
  -> counts every request
  -> records duration in buckets
  -> exposes text on /metrics

Prometheus (every 15s)
  -> calls http://apiserver:8010/metrics
  -> stores the numbers

Grafana
  -> queries Prometheus
  -> draws graphs

alerts.yml
  -> Prometheus checks rules
  -> fires an alert when a rule is true too long
```

## 4. Metric types

| Type | Meaning | Example |
| :--- | :--- | :--- |
| **Counter** | Only goes up | total requests |
| **Gauge** | Up or down | memory, uptime |
| **Histogram** | Buckets for percentiles | request duration |

## 5. PromQL in plain words

```promql
# requests per second
sum(rate(http_requests_total[5m]))

# error ratio
sum(rate(http_requests_total{status_code=~"5.."}[5m]))
  / sum(rate(http_requests_total[5m]))

# 95% of requests were faster than this
histogram_quantile(0.95,
  sum by (le) (rate(http_request_duration_seconds_bucket[5m])))

# is Prometheus able to scrape the API?
up{job="skills-apiserver"}
```

**Why p95, not average?** A few very slow requests can disappear in an average. p95 shows the experience of the slowest 5%.

## 6. The alert rules here

| Alert | Condition | Meaning |
| :--- | :--- | :--- |
| `ApiTargetDown` | `up == 0` for 1m | Prometheus cannot scrape the API |
| `HighHttp5xxErrorRate` | >5% for 2m | Users are seeing server errors |
| `HighApiLatencyP95` | >500ms for 3m | The API is slow |
| `HighNodeHeapMemoryUsage` | >400MB for 5m | Memory is close to the 512Mi limit |

## 7. SLI, SLO, error budget

A simple example:

```
SLI: successful requests / total requests
SLO: 99.9% successful over 30 days
Error budget: 0.1% = about 43 minutes per month
```

If you spend the whole error budget, stop adding features and fix reliability.

## 8. CloudWatch (AWS side)

| Source | Watch |
| :--- | :--- |
| ALB | 5xx count, target response time, unhealthy hosts |
| EKS | control-plane audit logs |
| RDS | CPU, connections, free storage, latency |
| EC2 nodes | disk, memory |

## 9. Load testing

`apiserver/k6-tests/` has two scripts.

```bash
k6 run apiserver/k6-tests/login.js
k6 run -e API_URL=http://<alb-host> apiserver/k6-tests/login.js
```

What to read:

- `http_req_duration` p95
- `http_req_failed` rate
- `http_reqs` throughput
- `vus` virtual users

## 10. Security layers in this repo

| Layer | Control |
| :--- | :--- |
| Code quality | SonarQube |
| Dependencies | `npm audit` |
| Secrets in files | Trivy secret scanner |
| Container | non-root, small base, Trivy, ECR scan |
| Supply chain | immutable SHA tags |
| Cloud identity | OIDC, no access keys |
| Network | private subnets, security-group chain, private RDS |
| Runtime | `runAsNonRoot`, no token automount |
| Secrets at runtime | AWS Secrets Manager + ExternalSecret |
| Transport | `DB_SSL=true` for RDS, TLS on ALB |

## 11. The biggest security problems to fix

1. **Committed local secrets** in `k8s/secret.yaml` and `docker-compose.yaml`. Rotate them.
2. **Scans do not block the build** (`exit-code: 0`).
3. **Client Pod has no securityContext.** Add non-root, read-only filesystem, drop capabilities.
4. **No NetworkPolicy.** Any Pod can talk to any Pod.
5. **Unused RBAC.** The app does not need Kubernetes API access.
6. **`passwordConfirm` stored** in the database.
7. **Fixed AES IV.**
8. **No tracing.**

## 12. Hardening checklist

- [ ] Container runs as non-root.
- [ ] Read-only filesystem where possible.
- [ ] Drop Linux capabilities.
- [ ] Default-deny NetworkPolicy.
- [ ] Minimal RBAC.
- [ ] Secrets from a secret manager.
- [ ] TLS everywhere.
- [ ] Image scan blocking critical CVEs.
- [ ] Audit logs enabled.
- [ ] Backups tested.

## 13. Monitoring and security checklist

- [ ] I can explain metrics vs logs vs traces.
- [ ] I can write a rate and an error-ratio query.
- [ ] I can explain SLI/SLO/error budget.
- [ ] I can name five security layers.
- [ ] I can name three fixes I would make first.
