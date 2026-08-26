# Level 3: Incident Scenario — AWS Load Balancer Health Check Failures

> **Incident Severity:** P0 / Critical  
> **Symptom:** AWS ALB Target Group reports `0 of 2 instances healthy`. External traffic drops with HTTP 503 Service Unavailable.

---

## 1. Diagnostic Checklist for Unhealthy Targets

```
[AWS ALB] ──(Health Check Probe: GET / on Port 80)──► [NodePort 3xxxx] ──► [Client Pod]
                                                                                │
                                                                       Returns 404 / Refused
```

### Check 1: Is the Container Bound to `127.0.0.1` (Localhost) or `0.0.0.0`?
* **Problem:** If a server is configured to listen on `localhost` (`127.0.0.1`), it will only accept loopback connections from inside the same container. Network packets arriving from the worker node or ALB will be rejected with `Connection Refused`.
* **Fix:** In Express / Nginx, always bind to all interfaces (`0.0.0.0` or `listen 80`).

---

### Check 2: Security Group Rule Mismatches
* **AWS ALB Security Group:** Must allow Inbound traffic on port 80/443 from `0.0.0.0/0`.
* **EKS Worker Node Security Group:** Must allow Inbound traffic from the **ALB Security Group ID** on the full NodePort range (`30000–32767`).

---

### Check 3: Health Check Path & HTTP Status Match
* If AWS ALB is configured with health check path `/` expecting `HTTP 200`, but Nginx returns a `301 Moved Permanently` (redirecting HTTP to HTTPS), the ALB marks the target **Unhealthy**.
* **Fix:** Update the health check matcher in AWS target group settings or Service annotations to accept `200,301,302`, or define a dedicated `/healthz` endpoint returning raw `200 OK`.
