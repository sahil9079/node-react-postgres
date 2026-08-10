# 03. Kubernetes — Detailed Notes

> **Biggest interview section.** Master the mental model: *Workloads → Workloads API (Deployment/StatefulSet/DaemonSet) → Service → Ingress*. Then networking, storage, and troubleshooting.

---

## SECTION A: Workload Controllers

### Q1. What is the difference between a Deployment, StatefulSet, and DaemonSet?

| | **Deployment** | **StatefulSet** | **DaemonSet** |
|---|---|---|---|
| **Purpose** | Stateless apps | Stateful apps (DB, message queue) | One pod on **every node** |
| **Pod identity** | random, replaceable | **stable** name + network identity | hostname = node name |
| **Storage** | no persistent or shared (any PV) | **stable per-pod PVC** (volumeClaimTemplates) | node-local storage |
| **Scaling** | any order | ordered (N-1 down first, then delete 0) | scales with nodes |
| **Update order** | rolling, any order | **ordered**: reverse ordinal index (N-1 → 0) | node by node |
| **DNS** | random pod names | **stable DNS** `pod-0.svc`, `pod-1.svc` | pod per node |
| **Use case** | web servers, APIs, workers | databases, Zookeeper, Kafka, Elasticsearch | log collectors, metrics agents, networking (e.g., Prometheus node-exporter, fluentd, kube-proxy) |

**Quick memory:**
- **Deployment** = "throwaway pods, no identity"
- **StatefulSet** = "pets with names and shoes (storage)" — pods 0..N-1, stable identity, ordered ops
- **DaemonSet** = "one per node, always"

---

### Q2. When would you choose a Deployment versus a StatefulSet?

**Choose Deployment when:**
- App is **stateless** — any pod can serve any request (API, web, workers)
- Scaling is horizontal, pods interchangeable
- Restart = new pod, no state lost (state lives in DB/Redis/S3)
- Cheap rollbacks, arbitrary pod names fine

**Choose StatefulSet when:**
- App **needs stable identity** (cluster members reference each other — ZK, Kafka, Cassandra)
- App has **per-pod persistent storage** (database writes on attached volume)
- App needs **ordered start/shutdown** (e.g., leader election, sequential members)
- DNS-dependent clustering (peer discovery)

> **Interview line:** "For my API server I used a Deployment because it's stateless and horizontal scaling just means more identical replicas. A database — if I ran it myself — needs a StatefulSet for stable identity and per-pod storage. In practice I'd run prod DB as a managed service (RDS) and let the platform handle those guarantees."

---

### Q3. What operational differences drive the choice between Deployment and StatefulSet?

- **Identity:** Deployments give random names (`app-7d8f9-abc12`); StatefulSets give ordinal names (`db-0, db-1, db-2`)
- **Storage:** Deployments share (or have no) PVC; StatefulSets give **each pod its own PVC** that persists
- **Ordering:** StatefulSets start pods 0→N-1 and shut down N-1→0; Deployments are unordered
- **Update strategy:** StatefulSets update in **reverse order** (newest last, one at a time); Deployments can do maxSurge (extra pods) — StatefulSets **cannot** have extra pods
- **Scaling:** StatefulSet scale-down deletes highest ordinal first; Deployment any pod
- **Rollback behavior** differs because of ordered semantics

---

### Q4. What guarantees does a StatefulSet provide that a Deployment does not?

1. **Stable, unique network identity** (stable hostname: `web-0`, `web-1`)
2. **Stable, persistent storage** (each pod has its own PVC that survives restart)
3. **Stable DNS names** — `pod-0.service.namespace.svc.cluster.local`
4. **Ordered, graceful deployment & scaling** (0→N-1 up, N-1→0 down)
5. **Ordered, graceful termination** — waits for pod N-1 to terminate before N-2
6. **Ordered updates** — update replica N-1 first, wait ready, then N-2...

---

### Q5. How does StatefulSet provide stable pod identity?

- Pods named **`<statefulset-name>-<ordinal>`** (`db-0`, `db-1`, ...) — ordinal never reused
- Each pod has a **stable network identity**: `db-0.svc.cluster.local`
- This identity **persists across rescheduling** — a replaced `db-0` pod gets the same name
- It's implemented via:
  - **Headless Service** (stable DNS)
  - PersistentVolumeClaims that are **bound to specific pods** (identity = storage attachment)

**Why it matters:** cluster software (Kafka, Cassandra) uses the stable DNS to discover peers; if pod names changed on restart, the cluster would break.

---

### Q6. How does StatefulSet handle persistent storage?

- **`volumeClaimTemplates`** — a template that StatefulSet uses to create **one PVC per replica**
- Each replica gets `pvc-<claim>-<statefulset>-<ordinal>` (e.g., `data-db-0`, `data-db-1`)
- PVCs are **bound to the pod's identity** (ordinal), NOT random
- On pod **reschedule**: pod `db-0` reattaches to the SAME PVC → data survives
- On pod **deletion**: PVC is NOT deleted automatically (data preserved unless you delete the PVC)

---

### Q7. How does StatefulSet handle pod startup ordering?

- Pods start **in ordinal order**: `0, 1, 2, ... N-1`
- Pod N **waits until pod N-1 is Running & Ready** before it starts
- Implemented via **pod readiness** — StatefulSet waits for the previous pod's **readiness** probe before launching the next
- This guarantees a deterministic sequence (important for primary/secondary databases, leader election)

---

### Q8. How does StatefulSet handle pod shutdown ordering?

- Pods terminate in **reverse ordinal order**: `N-1, N-2, ..., 0`
- Pod N-1 must be fully terminated before pod N-2 begins terminating
- Ensures graceful shutdown sequence — e.g., replica N-1 flushes and shuts down cleanly before N-2

---

### Q9. What happens when a StatefulSet pod is deleted?

- If the StatefulSet still exists (replicas unchanged) → **K8s recreates the pod with the same name and identity**
- Example: you `kubectl delete pod db-1` → StatefulSet controller recreates `db-1`
- The pod's **PVC is untouched** — `db-1` reattaches to its original storage
- If you scale DOWN (reduce replicas), the highest-ordinal pods are removed and **their PVCs remain** (not auto-deleted)

---

### Q10. What happens when a StatefulSet pod restarts?

- Pod gets same name (`db-0`), same identity, same DNS
- It **reuses its existing PVC** → data is preserved
- Kubelet restarts container; if node lost, pod is recreated on another node but PVC follows via the PV (same AZ constraints)
- If the node is gone permanently, the PV/PVC must be reattachable (EBS volumes are per-AZ → pod re-schedules within same AZ)

---

### Q11. What is volumeClaimTemplates?

- A template inside a StatefulSet spec that defines how PVCs are created **for each replica**
- Example:
```yaml
volumeClaimTemplates:
- metadata:
    name: data
  spec:
    accessModes: ["ReadWriteOnce"]
    resources:
      requests:
        storage: 10Gi
```
- Creates `data-<statefulset>-0`, `data-<statefulset>-1`, ... automatically
- This is how each StatefulSet pod gets **its own dedicated persistent volume**

---

### Q12. How are PVCs associated with StatefulSet replicas?

- By **ordinal naming**: PVC name = `<claimTemplateName>-<statefulsetName>-<ordinal>`
- Example: `data-db-0`, `data-db-1`, `data-db-2`
- **Pod `db-0` mounts `data-db-0`** — this binding is deterministic
- Because the PVC survives pod rescheduling, the pod's data follows it
- So PVC ↔ pod association is **identity-based, not random**

---

### Q13. What happens to PVCs when a StatefulSet is scaled down?

- When scaling down (e.g., 3 → 1), the highest-ordinal pods (`db-2`, `db-1`) terminate
- **Their PVCs are NOT deleted** by default
- Data is preserved — if you scale back up, pods `db-1`, `db-2` get their **original PVCs back**
- **Important for interview:** K8s does NOT auto-delete StatefulSet PVCs. You must delete them manually if you want to remove data (or the PV becomes orphaned)
- **Pitfall:** after scale-down and PVC deletion, scaling up creates NEW empty volumes

---

### Q14. What is a headless Service?

- A Service with **`clusterIP: None`**
- It does **NOT** provide load balancing or a single VIP
- Instead it returns the **list of pod IPs** (DNS A-records for each pod)
- DNS: `service.namespace.svc.cluster.local` → returns all pod IPs
- Each pod also gets `pod-name.service.namespace.svc.cluster.local`

**Why:** lets clients discover individual pods directly (peer-to-peer).

---

### Q15. Why is a headless Service commonly used with StatefulSets?

- StatefulSet pods need **stable, unique DNS names** to find each other (cluster members)
- Headless service provides `db-0.db.default.svc.cluster.local`, `db-1.db.default.svc.cluster.local`
- Clients/peers query the headless service to get **all pod IPs** for discovery
- This is how Kafka, Cassandra, Elasticsearch, Zookeeper find their peers

**Pairing:** StatefulSet + headless Service = stable network identity (Q5).

---

### Q16. When would you use a Deployment for a database?

- **Single-instance dev/test** database (no HA needed) — a Deployment is fine
- Database in **managed services** (RDS, Cloud SQL) — the platform manages replicas, so app uses Deployment
- Read-replica farms where identity doesn't matter
- When state is stored externally anyway

> **Interview note:** Many would argue a DB should be a StatefulSet. The honest answer: for a **single-pod** DB with a shared PVC, a Deployment with 1 replica + PVC works. For multi-replica clustered DBs you need StatefulSet (identity, ordering, per-pod storage).

---

### Q17. When would you use a StatefulSet for a database?

- **Multi-replica** clustered DB (PostgreSQL primary/standby, MySQL group replication, MongoDB, Cassandra, Kafka, Redis cluster)
- When replicas need to **discover each other** by stable DNS
- When each replica needs **its own dedicated volume** (not shared)
- When ordered startup/shutdown matters (primary first, then secondaries)
- When a pod restart must keep its **identity and data**

---

### Q18. How do StatefulSet rolling updates work?

- **`updateStrategy.rollingUpdate`** with `partition` (default 0)
- Updates happen **in reverse ordinal order**: start with the highest ordinal pod, one at a time
- Each pod is updated, **waits until Ready**, then next pod updates
- `partition: N` → only pods with ordinal ≥ N are updated (enables **canary-style** partial updates for stateful apps)
- No `maxSurge` (extra pods) — StatefulSets update **one at a time in order**

```yaml
updateStrategy:
  type: RollingUpdate
  rollingUpdate:
    partition: 0   # update all; set to 2 to update only db-2, db-3...
```

---

### Q19. How do you rollback a Kubernetes deployment?

```bash
# Check rollout history
kubectl rollout history deployment/apiserver

# Rollback to previous revision
kubectl rollout undo deployment/apiserver

# Rollback to a specific revision
kubectl rollout undo deployment/apiserver --to-revision=2

# Watch the rollout
kubectl rollout status deployment/apiserver
```

**How it works:** Deployment Controller stores previous **ReplicaSets** (each change = new RS). `rollout undo` points the Deployment back to the previous ReplicaSet → **pause creation of new pods, scale down new RS, scale up old RS** (gradual swap).

**Rollback triggers:**
- Manual (`kubectl rollout undo`)
- **Automatic** via `progressDeadlineSeconds` + failed health checks (if new pods never become ready → Deployment rolls back / stops)

---

### Q20. What is a ReplicaSet?

- A controller that ensures **N running pod replicas** at all times (declarative desired state)
- **It creates and deletes pods** to match the replica count
- If a pod dies → ReplicaSet recreates it
- **Deployment manages ReplicaSets** (a Deployment creates a new RS per revision/update, and scales them for rolling updates)

```
Deployment (desired state)
   └── manages ReplicaSet (revision N)  →  creates/manages Pods
   └── ReplicaSet (revision N-1)  ← kept for rollback
```

> "Deployment is the parent that manages ReplicaSets; ReplicaSet is the parent that manages pods. You rarely touch ReplicaSets directly."

---

## SECTION B: Networking & Services

### Q21. What are Kubernetes Services and their different types?

**Service = stable abstraction that exposes a set of pods (selected by labels) as a single network endpoint.**

| Type | Exposure | Use |
|---|---|---|
| **ClusterIP** | internal cluster IP (default) | internal service (DB, API backend) |
| **NodePort** | exposes on each node's IP: port (30000-32767) | dev/quick external access |
| **LoadBalancer** | cloud LB → forwards to NodePort → pods | public app entry (EKS → AWS ALB/NLB) |
| **ExternalName** | CNAME to external DNS | alias for external service |
| **Headless** (`clusterIP: None`) | no VIP, direct pod DNS | stateful discovery |

**Service = selector + ports:**
```yaml
spec:
  selector: { app: apiserver }      # route to pods with this label
  ports:
  - port: 8010                       # service port
    targetPort: 8010                 # container port (can be a named port)
```

---

### Q22. What is the difference between ClusterIP, NodePort, and LoadBalancer?

```
ClusterIP:    Service → virtual IP → pods (cluster-internal only)
NodePort:     nodeIP:NodePort → Service → pods (reachable outside cluster)
LoadBalancer: cloud LB (ALB/NLB) → nodeIP:NodePort → Service → pods
```

- **ClusterIP** — only inside the cluster
- **NodePort** = ClusterIP + a port opened on **every node** (30000-32767)
- **LoadBalancer** = **NodePort** + **cloud load balancer** pointing at the node ports (AWS creates ALB/NLB; kops/eksctl handles it)

**Key relationship:** LoadBalancer is built on top of NodePort, which is built on top of ClusterIP. So a LoadBalancer Service also gets a ClusterIP and NodePort.

> **Project tie-in:** I used `ClusterIP` for postgres and apiserver (internal), and `LoadBalancer` for the client — the only public endpoint.

---

### Q23. What is Kubernetes Ingress?

- **Ingress** is an API object that manages **external HTTP(S) access** to services — providing **host/path-based routing**, TLS termination, and load balancing at Layer 7
- It needs an **Ingress Controller** to actually implement it (nginx-ingress, AWS ALB Ingress Controller, Traefik, Istio gateway)
- **Ingress rules:** route `example.com/api/*` → apiserver-service, `example.com/*` → client-service

**Ingress vs LoadBalancer:**
- LoadBalancer = L4, one IP/LB, no routing logic
- Ingress = L7, host/path routing, TLS, one ingress can route to MANY services

> **Project tie-in:** I deliberately skipped Ingress because the client's nginx already did path routing (`/` static + `/api/` proxy). A LoadBalancer alone was enough. I'd add Ingress when I have multiple services on one LB.

---

### Q24. What is the difference between ConfigMap and Secret?

| | ConfigMap | Secret |
|---|---|---|
| **Purpose** | non-sensitive config | sensitive data |
| **Encoding** | plaintext (strings) | base64 (obfuscation only) |
| **Storage** | etcd | etcd (can be encrypted at rest with KMS) |
| **Size limit** | 1 MiB | 1 MiB |
| **Use** | env vars, config files | passwords, API keys, certs, tokens |

**How they're used:**
```yaml
envFrom:
  - configMapRef: { name: configmap }
  - secretRef: { name: my-secret }
```
or
```yaml
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: my-secret
        key: password
```

**Important:** base64 is NOT encryption — treat secrets carefully (KMS encrypt at rest, don't commit plaintext).

---

### Q25. What are PersistentVolumes and PersistentVolumeClaims?

- **PersistentVolume (PV)** = cluster-level storage resource (provisioned by admin or **StorageClass**), independent of any pod
- **PersistentVolumeClaim (PVC)** = a **request for storage** by a pod/user — binds to a PV that matches
- **Lifecycle:** PVC binds PV → pod mounts PVC → storage attached

```yaml
# PVC
kind: PersistentVolumeClaim
spec:
  accessModes: [ReadWriteOnce]
  resources: { requests: { storage: 3Gi } }
  storageClassName: standard
```

**Binding:** PVC ↔ PV match on **capacity + access modes + storage class**. If no PV exists → **StorageClass** dynamically provisions one (EBS, gp2, etc.).

> **Project tie-in:** my `dbpvc.yaml` is a 3Gi PVC that binds to an EBS-backed PV so PostgreSQL data survives pod restarts.

---

### Q26. What is a StorageClass?

- Defines **how storage is provisioned** dynamically ("storage classes")
- Points to a **provisioner** (e.g., `ebs.csi.aws.com` on EKS, `standard` on minikube)
- Parameters: type, IOPS, zone, reclaim policy

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata: { name: standard }
provisioner: kubernetes.io/aws-ebs   # or ebs.csi.aws.com
parameters:
  type: gp3
reclaimPolicy: Delete
```

- Pod/PVC with `storageClassName: standard` → StorageClass dynamically creates the PV
- **Without StorageClass** (no dynamic provisioning) → you must create PVs manually

---

### Q27. What is the difference between ReadWriteOnce and ReadWriteMany?

| Access Mode | Meaning | Example |
|---|---|---|
| **ReadWriteOnce (RWO)** | read/write by **one node** | EBS volume, single pod per node |
| **ReadOnlyMany (ROX)** | read-only by many nodes | shared config, media |
| **ReadWriteMany (RWX)** | read/write by many nodes | NFS, EFS, GlusterFS |

**Interview points:**
- **EBS = RWO only** (bound to one AZ/node) — a StatefulSet DB pod uses RWO
- **EFS/NFS = RWX** — multiple pods on different nodes can share
- If you try RWO on two pods on different nodes → the second pod **fails to attach** / pending

> **Project tie-in:** my db PVC is `ReadWriteOnce` because PostgreSQL is a single-pod database on one EBS volume.

---

### Q28. What is the difference between readiness and liveness probes?

| | **Liveness** | **Readiness** |
|---|---|---|
| **Question** | "Is the process alive / stuck?" | "Is the pod ready to serve traffic?" |
| **On failure** | **kubelet restarts the container** | pod removed from Service endpoints (no traffic), container NOT restarted |
| **Purpose** | recover from deadlock/crash | gate traffic during slow start / dependency not ready |
| **Example** | app hung, no response → restart | app still loading model / DB not ready → no traffic yet |

**Plus:**
- **Startup probe** — for slow-starting apps: gives a grace period; only after success do liveness/readiness start

```yaml
livenessProbe:
  httpGet: { path: /healthz, port: 8010 }
  initialDelaySeconds: 15
  periodSeconds: 10
readinessProbe:
  httpGet: { path: /ready, port: 8010 }
  initialDelaySeconds: 5
```

**Common interview trap:** a pod with failed readiness is NOT restarted — it just stops receiving traffic. A failed liveness RESTARTS the container.

---

### Q29. What are Kubernetes resource requests and limits?

- **requests** = **minimum** resources guaranteed / reserved for the pod (used by **scheduler** to place pods)
- **limits** = **maximum** a pod can use (used by **kubelet** to cap / kill)

```yaml
resources:
  requests:
    cpu: "250m"      # 0.25 CPU guaranteed
    memory: "128Mi"
  limits:
    cpu: "500m"      # up to 0.5 CPU
    memory: "256Mi"  # hard limit → OOMKill if exceeded
```

**Concepts:**
- **requests** drive scheduling & QoS class
- **limits** protect the node (if exceeded: CPU throttled; memory → OOM kill)
- **QoS classes:** Guaranteed (req==limit), Burstable (req<limit), BestEffort (no requests/limits)
- **OOMKill** happens when memory limit exceeded — container restarts

**Interview line:** "Requests reserve resources for the scheduler; limits cap a pod so it can't starve the node. I always set both — without limits one app can OOM the node."

---

### Q30. What is HPA (HorizontalPodAutoscaler)?

- **HPA** automatically scales the **number of pod replicas** based on metrics (CPU, memory, custom metrics)
- Controller queries Metrics API every ~15s, computes desired replicas:
  `desired = ceil(currentReplicas × (currentMetric / targetMetric))`
- Example:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: apiserver-hpa }
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: apiserver
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target: { type: Utilization, averageUtilization: 70 }
```
- Needs **metrics-server** (for CPU/mem) or custom metrics adapter (Prometheus) on EKS
- **Does NOT** work if pods have no resource **requests** (it scales on request utilization)

---

### Q31. How does Kubernetes perform a rolling update?

- Deployment has `strategy.type: RollingUpdate` (default)
- **maxSurge:** max extra pods above desired during update (default 25%)
- **maxUnavailable:** max pods unavailable during update (default 25%)
- Controller **scales up the new ReplicaSet, scales down the old RS gradually**
- New pod must pass **readiness** before the next old pod is removed

```
old RS: 5 pods → new RS created → 1 new pod ready → 1 old pod removed → repeat
```

- `kubectl rollout status` shows progress; if new pods never ready → **`progressDeadlineSeconds` (default 600s) marks rollout failed** → old RS scaled back (auto-rollback trigger)

---

## SECTION C: Troubleshooting

### Q32. How do you troubleshoot a pod stuck in CrashLoopBackOff?

**Definition:** container starts and crashes repeatedly (restart loop). K8s backs off restart delay (10s → doubles → 5min max).

**Steps:**
1. `kubectl describe pod <pod>` — see **Events** for last state, exit code, image pull, liveness failures
2. `kubectl logs <pod> --previous` — logs from the **previous crashed container** (the crash reason)
3. Check **exit code**: 1 = app error, 137 = SIGKILL (OOM), 126/127 = command/entrypoint missing
4. Common causes:
   - App config missing (env var, ConfigMap/Secret) → check `kubectl exec env` / envFrom
   - **Missing dependencies** (DB not ready) → readiness/startup probe or initContainer
   - **Liveness probe too aggressive** → container killed by probe → tune probes
   - **OOMKilled** → check memory limit vs usage
   - **Image issue** — wrong entrypoint, missing file
5. Fix → redeploy

---

### Q33. How do you troubleshoot a pod stuck in Pending state?

**Pending = scheduler hasn't placed it / resources not ready.**

1. `kubectl describe pod <pod>` → look at **Events**
2. Common causes:
   - **Insufficient resources** — "0/3 nodes are available: insufficient cpu/memory" → requests too high → scale nodes or lower requests
   - **Unschedulable** — node taints/tolerations mismatch, node selector/affinity not matching, **nodeSelector** label missing
   - **PVC pending** — storage can't provision (no StorageClass, quota) → "persistentvolumeclaim not found"
   - **Node not ready** — cluster issue
3. Fix per cause: adjust resources, add tolerations, fix PVC/StorageClass, add nodes

**Order of checks:** describe → events → node capacity → PVC → taints.

---

### Q34. How do you troubleshoot an application not reachable through a Service?

**Go bottom-up through the stack:**

```
Pod running? (kubectl get pods, describe)
  → container ready? (readiness probe passing?)
    → pod IP reachable? (kubectl exec / curl podIP:port)
      → Service endpoints populated? (kubectl get endpoints)
        → Service selector matches pod labels?
          → DNS resolves? (kubectl exec -- nslookup service)
            → targetPort correct? (service → containerPort)
              → NetworkPolicy blocking? / node ports?
```

**Checks:**
1. `kubectl get pods -o wide` — is the pod Running & Ready?
2. `kubectl get endpoints <service>` — are endpoints populated? **If empty → selector mismatch** (labels don't match pod labels)
3. `kubectl describe svc <service>` — selector + ports
4. `kubectl exec <pod> -- curl http://<service>:<port>` — DNS + cluster network
5. `kubectl get networkpolicy` — is traffic blocked?
6. For LoadBalancer: check LB → nodePort → targetPort chain

**Selector mismatch is the #1 cause** — Service selector `app: client-app` must exactly match pod labels.

---

### Q35. What is the difference between Deployment, StatefulSet, DaemonSet, and ReplicaSet? (combined)

| Controller | Managed by | Guarantees | Use |
|---|---|---|---|
| **ReplicaSet** | Deployment | N identical pods | underlying worker |
| **Deployment** | user | declarative rolling updates, rollbacks | stateless apps |
| **StatefulSet** | user | stable identity, storage, ordering | stateful apps |
| **DaemonSet** | user | one pod per node | node-level agents |

---

## SECTION D: K8s Quick Command Reference

```bash
kubectl get pods -n node-react-app -o wide
kubectl get deployments,svc,pvc -n node-react-app
kubectl describe pod <pod>
kubectl logs <pod> --previous
kubectl exec -it <pod> -- sh
kubectl rollout status deployment/<name>
kubectl rollout undo deployment/<name>
kubectl get endpoints <service>
kubectl get nodes
kubectl top nodes / kubectl top pods
kubectl get events --sort-by='.lastTimestamp'
kubectl apply -f k8s/
kubectl delete -f k8s/
```

---

## SECTION E: Interview "Story" — link the concepts

> **"In my project I used a Deployment for the client and API, a Deployment for postgres with a PVC, ClusterIP services internally, and a LoadBalancer for the client. I chose LoadBalancer over Ingress because my client nginx already routes / and /api/. If I ran postgres at scale I'd use a StatefulSet with volumeClaimTemplates and a headless service so replicas discover each other."**

That one paragraph answers ~15 questions. Use it as your anchor.

---

*Next: [04-aws-eks.md](04-aws-eks.md) — AWS, EKS, and deployment strategies.*
