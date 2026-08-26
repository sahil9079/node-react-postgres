# Level 3: Incident Scenario — Database Connection & Deadlock Triage

> **Incident Severity:** P0 / Critical  
> **Symptom:** Express API logs `Connection timeout` or PostgreSQL rejects new client queries.

---

## 1. Step-by-Step Database Triage

### Step 1: Check Database Process Health
```bash
# Check if PostgreSQL is accepting connections inside the cluster
kubectl exec -it $(kubectl get pod -l app=postgres-db -n node-react-app -o jsonpath='{.items[0].metadata.name}') -n node-react-app -- pg_isready -U postgres -d sampledb
# Output: sampledb:5432 - accepting connections
```

---

## 2. Connection Pool Exhaustion Diagnosis

### Step 1: Inspect Active Database Connections
```sql
-- Connect to PostgreSQL CLI
kubectl exec -it $(kubectl get pod -l app=postgres-db -n node-react-app -o jsonpath='{.items[0].metadata.name}') -n node-react-app -- psql -U postgres -d sampledb

-- Check total open connections vs max allowed
SELECT count(*), state FROM pg_stat_activity GROUP BY state;
SHOW max_connections;
```

* **Root Cause:**
  * By default, PostgreSQL has `max_connections = 100`.
  * If Sequelize ORM is configured with `pool: { max: 10 }` per pod, and you scale the API deployment to 12 replicas ($12 \times 10 = 120\text{ connections}$), the 11th and 12th replicas exhaust database connections, throwing:
    ```
    FATAL: remaining connection slots are reserved for non-replication superuser connections
    ```
* **Resolution:**
  1. Tune Sequelize pool configuration in [`apiserver/config/index.js`](file:///d:/javascript_project/node-react-postgres/apiserver/config/index.js):
     ```javascript
     pool: {
       max: 5,
       min: 1,
       acquire: 30000,
       idle: 10000
     }
     ```
  2. Implement a connection pooler like **PgBouncer** in production to multiplex thousands of API client connections over a smaller pool of database backend sockets.

---

## 3. Detecting Long-Running Queries & Table Deadlocks

```sql
-- 1. Find queries running longer than 10 seconds
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity
WHERE state != 'idle' AND (now() - pg_stat_activity.query_start) > interval '10 seconds';

-- 2. Kill an unresponsive stuck transaction
SELECT pg_terminate_backend(<PID>);
```
