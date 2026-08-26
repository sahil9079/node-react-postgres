# Level 3: Incident Scenario — CPU 100% & Memory Leaks

> **Incident Severity:** P1 / Major  
> **Symptom:** Pod CPU spikes to 100% or Memory steadily grows until pods are OOMKilled.

---

## 1. Diagnosing CPU 100% & Node.js Event Loop Lag

### Step 1: Identify Offending Pods & Nodes
```bash
kubectl top pods -n node-react-app --sort-by=cpu
kubectl top nodes
```

### Step 2: Common Node.js CPU Bottlenecks
1. **Catastrophic Regular Expression Backtracking (ReDoS):** Complex regex used in input validation blocking the single-threaded Node.js event loop.
2. **Synchronous Cryptographic Hashing:** Using synchronous `bcrypt.hashSync()` instead of async `bcrypt.hash()` with worker threads.
3. **Unoptimized Database Queries:** Missing indexes causing PostgreSQL to execute CPU-intensive sequential table scans.

### Step 3: Immediate Mitigation
* Scale pods horizontally to distribute incoming traffic:
  ```bash
  kubectl scale deployment apiserver --replicas=5 -n node-react-app
  ```

---

## 2. Diagnosing Memory Leaks (Sawtooth Pattern)

### Step 1: Recognize the Pattern in Grafana
* A healthy application allocates memory and drops back down after Garbage Collection (GC).
* A memory leak shows a **continuous linear upward trend** that never recovers after GC until hitting the pod limit and crashing with `OOMKilled` (Exit Code 137).

### Step 2: Common Node.js Leak Culprits in Express
1. **Unclosed Sequelize Database Connections:** Leaving connections open in middleware or error handlers without releasing them back to the pool.
2. **Multipart File Buffers:** Buffering large uploaded user images (`sharp` / `formidable`) in global memory arrays rather than streaming to disk/S3.
3. **Dangling Event Listeners:** Attaching `process.on()` or socket listeners inside request handlers without cleanup.

### Step 3: Mitigation & Investigation
1. Temporarily increase memory limits in `apidep.yaml` to prevent crash cycles:
   ```yaml
   resources:
     limits:
       memory: "1Gi"
     requests:
       memory: "512Mi"
   ```
2. Trigger a V8 Heap Snapshot in a staging replica to inspect leaking objects:
   ```bash
   # Enable Node.js inspector
   node --inspect index.js
   # Connect Chrome DevTools at chrome://inspect to compare heap allocations
   ```
