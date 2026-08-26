# Level 3: Incident Scenario — HTTP 502 Bad Gateway Triage

> **Incident Severity:** P0 / Critical  
> **Symptom:** Nginx returns HTTP 502 Bad Gateway when users make API calls.

---

## 1. What HTTP 502 Means in Your Architecture

In our 3-tier architecture, an HTTP 502 error means the frontend **Nginx reverse proxy** reached out to the backend Express server, but the backend failed to return a valid HTTP response (connection refused, socket hangup, or process dead).

```
[Browser] ──► [AWS Load Balancer] ──► [Client Pod (Nginx)] ──(❌ Connection Refused)──► [Apiserver Pod (:8010)]
```

---

## 2. Step-by-Step Diagnostic Checklist

### Step 1: Inspect Nginx Error Logs inside the Client Pod
```bash
kubectl logs -l app=client-app -n node-react-app -c client-server | grep -E "error|connect\(\) failed|502"
```

* **Typical Log Pattern 1:**
  ```
  [error] 31#31: *120 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.1.20, server: , request: "GET /api/v1/skills HTTP/1.1", upstream: "http://10.100.12.34:8010/skills"
  ```
  * **Meaning:** Nginx reached the pod IP, but no process is listening on port 8010 (Express has crashed or is in a startup loop).

* **Typical Log Pattern 2:**
  ```
  [error] 31#31: *125 apiserver could not be resolved (3: Host not found)
  ```
  * **Meaning:** Upstream DNS mismatch. In `nginx.conf`, the proxy points to `http://apiserver:8010/` (Docker Compose name) instead of `http://apiserver-service:8010/` (Kubernetes Service name).

---

### Step 2: Check Service Endpoints
```bash
kubectl get endpoints apiserver-service -n node-react-app
```
* **If Endpoints is `<none>`:**
  * The Service's `selector: app: apiserver` does not match the Pod template label in `apidep.yaml`!
  * Fix the label mismatch so Kube-Proxy registers the backend pods into the service.

---

### Step 3: Check Pod Lifecycle Status
```bash
kubectl get pods -n node-react-app -l app=apiserver
```
* If pods are in `CrashLoopBackOff` or `OOMKilled`, proceed to the CrashLoopBackOff playbook.
