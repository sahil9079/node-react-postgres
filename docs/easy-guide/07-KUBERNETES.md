# 07 — Kubernetes in Simple Words

Folder: `k8s/`

## 1. What Kubernetes is

Docker runs containers on **one** machine. Kubernetes runs containers on **many** machines and keeps them healthy.

You tell Kubernetes **what you want**:

> "I want 2 copies of the API running at all times."

Kubernetes keeps making that true. If a Pod dies, it creates another. If a node dies, it moves Pods.

## 2. The objects, one line each

| Object | Simple meaning |
| :--- | :--- |
| **Cluster** | All the machines Kubernetes manages |
| **Node** | One machine |
| **Pod** | One or more containers running together |
| **Deployment** | "Keep N Pods alive and update them safely" |
| **Service** | A stable name/IP in front of Pods |
| **Ingress** | Rules for outside traffic |
| **ConfigMap** | Non-secret settings |
| **Secret** | Secret settings |
| **Namespace** | A folder for resources |
| **ServiceAccount** | The identity a Pod uses |
| **HPA** | Adds/removes Pods based on load |
| **PDB** | Minimum Pods during maintenance |
| **Probe** | A health test |

## 3. Read the manifests in this order

```
namespace
  -> configmap
  -> secret / external-secret
  -> serviceaccount
  -> rbac
  -> database (only for local cluster)
  -> api deployment
  -> api service
  -> client deployment
  -> client service
  -> ingress
  -> hpa
  -> pdb
  -> kustomization + overlays
```

Why: you cannot start a Pod before the namespace, config and secrets exist.

## 4. Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: node-react-app
```

Everything lives in `node-react-app`. This keeps it separate from other apps.

## 5. ConfigMap vs Secret

**ConfigMap** = normal settings:

```yaml
data:
  PORT: "8010"
  DB_HOST: "postgres-service"
  DB_SSL: "false"
```

**Secret** = sensitive settings:

```yaml
stringData:
  DB_PASS: "mypassword"
  JWT_SESSION_SECRET: "..."
```

**Important:** a Kubernetes Secret is only **base64 encoded**, not encrypted. Real protection comes from:
- not committing it,
- RBAC,
- encryption at rest,
- an external store such as AWS Secrets Manager.

In AWS, `external-secret.yaml` copies the real secret from Secrets Manager into a Kubernetes Secret.

## 6. Deployment

A Deployment answers:

- Which image?
- How many copies?
- How much CPU/memory?
- How to test health?
- How to update without downtime?

```yaml
spec:
  replicas: 2
  strategy:
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

**Rolling update:** add a new Pod, wait until it is Ready, then remove an old one. `maxUnavailable: 0` means capacity never drops below 2.

## 7. Probes (the most important concept)

```yaml
startupProbe:
  httpGet: { path: /healthz, port: 8010 }
  failureThreshold: 12
  periodSeconds: 5
livenessProbe:
  httpGet: { path: /healthz, port: 8010 }
readinessProbe:
  httpGet: { path: /readyz, port: 8010 }
```

| Probe | Question | If it fails |
| :--- | :--- | :--- |
| Startup | "Has it finished booting?" | Restart, but only during startup |
| Liveness | "Is it permanently stuck?" | Restart the container |
| Readiness | "Can it serve traffic now?" | Remove it from the Service |

**Correct setup here:** liveness uses `/healthz` (no DB), readiness uses `/readyz` (DB check).

**Wrong setup:** liveness uses `/readyz`. Then a database blip restarts every Pod. Avoid.

## 8. Resources

```yaml
resources:
  requests: { cpu: "100m", memory: "128Mi" }
  limits:   { cpu: "500m", memory: "512Mi" }
```

- **Request** = what the scheduler reserves for you.
- **Limit** = the hard maximum.
- Too much memory over the limit → `OOMKilled` (exit code 137).
- Too high a request → Pod stays `Pending` because no node has room.

## 9. Service

A Service gives Pods one stable address.

```yaml
kind: Service
metadata:
  name: apiserver-service
spec:
  type: ClusterIP
  selector:
    app: apiserver
  ports:
    - port: 8010
      targetPort: apiserver-port
```

**Key idea:** the Service finds Pods by **labels**, not names. If `selector` does not match the Pod labels, the Service has **no endpoints** and traffic fails.

The repo also defines a Service named `apiserver` because `client/nginx.conf` uses `http://apiserver:8010`.

## 10. Ingress and the ALB

```yaml
kind: Ingress
metadata:
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
spec:
  ingressClassName: alb
  rules:
    - http:
        paths:
          - path: /api  -> apiserver-service:8010
          - path: /     -> client-service:80
```

This Ingress only works if the **AWS Load Balancer Controller** is installed. Without it, the Ingress exists but no ALB is created.

Longest path wins: `/api/...` goes to the API, everything else to the frontend.

## 11. HPA and PDB

**HPA** (autoscaler):

```yaml
minReplicas: 2
maxReplicas: 6
metrics:
  - cpu target 70%
  - memory target 80%
```

Needs `metrics-server`.

**PDB** (maintenance safety):

```yaml
minAvailable: 1
```

During a node drain, Kubernetes will not take below 1 Pod.

## 12. Kustomize: base + overlays

```
k8s/                  base (complete local stack)
k8s/overlays/lab/     small changes: RDS endpoint, 1 replica
k8s/overlays/prod/    3 API replicas, ExternalSecret
```

Render without applying:

```bash
kubectl kustomize k8s
kubectl kustomize --load-restrictor LoadRestrictionsNone k8s/overlays/lab
```

The `--load-restrictor` flag is needed because the overlay references files with `../../`, which Kustomize blocks by default.

## 13. Deploy locally with kind

```bash
kind create cluster --name skills

docker build -t skills-apiserver:local ./apiserver
docker build -t skills-client:local ./client
kind load docker-image skills-apiserver:local --name skills
kind load docker-image skills-client:local --name skills

kubectl apply -k k8s
kubectl get pods -n node-react-app -w
```

If `kubectl apply -k k8s` fails, read `12-CLEANUP-AND-ORDER.md` — there is a YAML indentation bug in `dbpvc.yaml` that you must fix first.

## 14. Debugging ladder (memorise)

```bash
kubectl get pods -n node-react-app
kubectl describe pod <pod> -n node-react-app
kubectl logs <pod> -n node-react-app
kubectl logs <pod> -n node-react-app --previous
kubectl get events -n node-react-app --sort-by=.lastTimestamp
kubectl get endpoints -n node-react-app
kubectl exec -it <pod> -n node-react-app -- sh
kubectl top pods -n node-react-app
```

| Symptom | First check |
| :--- | :--- |
| `ImagePullBackOff` | image name/tag, registry login |
| `CrashLoopBackOff` | `logs --previous`, env vars |
| `OOMKilled` | memory limit |
| `Pending` | requests vs node capacity |
| Running but not Ready | readiness path/port, DB |
| Service no endpoints | selector vs labels |
| Ingress no address | LB controller missing |

## 15. Kubernetes checklist

- [ ] I can explain Pod, Deployment, Service, Ingress.
- [ ] I can explain the three probes.
- [ ] I can explain request vs limit.
- [ ] I can debug a failing Pod in 5 commands.
- [ ] I can render both overlays.
