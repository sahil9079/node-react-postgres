# PromQL Deep Dive & Essential Alerts
```promql
# 1. High CPU Utilization Alert (> 85% for 5m)
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 85

# 2. Kubernetes Pod Memory Usage vs Limit Percentage
(sum(container_memory_working_set_bytes{name!=""}) BY (pod, namespace) / sum(kube_pod_container_resource_limits{resource="memory"}) BY (pod, namespace)) * 100 > 90

# 3. HTTP 5xx Error Rate Spike Percentage
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100 > 5
```
