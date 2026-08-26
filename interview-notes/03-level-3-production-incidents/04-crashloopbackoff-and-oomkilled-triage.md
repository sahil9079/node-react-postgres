# Level 3: Incident Scenario — CrashLoopBackOff & OOMKilled Triage

> **Incident Severity:** P0 / Critical  
> **Symptom:** Kubernetes Pods repeatedly crash and fail to reach `Running` state.

---

## 1. Exit Code Diagnostic Matrix

```bash
kubectl describe pod <POD_NAME> -n node-react-app
```

Look at the `Last State: Terminated` block:

| Exit Code | Name | Cause | Resolution |
| :--- | :--- | :--- | :--- |
| **`1`** | Generic Application Error | Uncaught exception in Node.js, missing environment variable, syntax error. | Check logs using `kubectl logs <POD> --previous`. |
| **`137`** | `OOMKilled` (SIGKILL) | Container exceeded memory limit (`resources.limits.memory`) or system ran out of RAM. | Increase memory limit or fix application memory leak. |
| **`143`** | `SIGTERM` | Graceful shutdown requested by Kubernetes (e.g. rolling update, node drain). | Normal behavior during deployments or rescheduling. |
| **`126 / 127`** | Command / Binary Not Found | Wrong entrypoint in Dockerfile (e.g. `CMD ["nodemon", "index.js"]` when nodemon is not installed in prod). | Fix `CMD` in Dockerfile. |

---

## 2. Systematic Troubleshooting Commands

```bash
# 1. Check pod events and last termination state
kubectl describe pod <POD_NAME> -n node-react-app

# 2. View logs of the CRASHED container instance (previous execution)
kubectl logs <POD_NAME> -n node-react-app --previous

# 3. Check node-level memory pressure
kubectl describe node <NODE_NAME> | grep -i pressure
```

---

## 3. Project-Specific CrashLoop Fix: Database Cold-Start

* **Problem:** In Kubernetes, `dbdep.yaml` and `apidep.yaml` are applied at the same time. The Express API boots in 2 seconds, attempts to authenticate with PostgreSQL, fails because Postgres is still creating the `sampledb` catalog, and crashes (Exit Code 1).
* **Fix:** Add an `initContainer` in `apidep.yaml` to wait for TCP port 5432:
  ```yaml
  initContainers:
    - name: wait-for-postgres
      image: busybox:1.36
      command: ['sh', '-c', 'until nc -z postgres-service 5432; do echo waiting for postgres; sleep 2; done;']
  ```
