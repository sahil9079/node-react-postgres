# 12 — Cleanup, Order and What to Keep

## 1. What was removed (generated or junk only)

These files are **reproducible** or **not project data**. Nothing that you wrote by hand was deleted.

| Removed | Why | How to get it back |
| :--- | :--- | :--- |
| `New folder/` | Empty folder | create it again if needed |
| `.scannerwork/` | Temporary Sonar scanner output | run Sonar again |
| `apiserver/coverage/` | Generated test report | `npm run test:coverage` |
| `client/build/` | Generated React production build | `npm run build` in `client/` |
| `client/scan-report.json` | Generated scan output (1.1 MB) | run the scan again |
| `.DS_Store` (4 copies) | macOS folder metadata | not needed on Windows/Git |

**Important:** because `client/build/` was removed, the backend will not serve the React app as static files until you rebuild it:

```bash
cd client
npm run build
```

API-only containers are not affected. The frontend container builds its own copy during `docker build`.

## 2. What was kept (and why)

Everything that contains logic, configuration, documentation or study material:

- all of `apiserver/`
- all of `client/src/`, `client/public/`, `client/nginx.conf`, `client/Dockerfile`
- all of `k8s/`, `infra/`, `deploy/`, `scripts/`, `.github/`
- all root guides
- all of `docs/`, `interview-notes/`, `DevOps-Interview-Preparation/`
- `apiserver/.config.env` (your local secrets — never commit)

## 3. Optional cleanup (decide yourself)

These are **not** generated junk. They are duplicates or large study files. Delete them only if you are sure.

| Item | Size | Why it is optional |
| :--- | :--- | :--- |
| `client/public/design.rar` | ~4.7 MB | design archive, not used by the app |
| `docs/AWS_COST_OPTIMIZATION_AND_CLEANUP.md` | 7 KB | duplicate topic of the root file |
| `docs/devops-interview-preparation/` | ~90 KB | overlaps `DevOps-Interview-Preparation/` and `interview-notes/` |
| `DevOps-Interview-Preparation/` | ~90 files | large study set; keep if you use it |
| `interview-notes/` | ~35 files | large study set; keep if you use it |
| `DEVOPS_IMPLEMENTATION_GUIDE.md` | 90 KB | overlaps the big build guide; keep as reference |

**Recommended:** do not delete study material. If the repo feels too big, move it to `archive/study/` or a separate repository. Losing notes is worse than a few extra megabytes.

## 4. Duplicate documentation map

You currently have four places that teach DevOps:

```
README.md                                  overview
ARCHITECTURE.md                            design decisions
DEVOPS_IMPLEMENTATION_GUIDE.md            long manual
DEVOPS_FRESHER_TO_SENIOR_BUILD_GUIDE.md   full course
HOW_TO_READ_AND_MASTER_THIS_PROJECT.md    reading order + drills
KUBERNETES_DEEP_DIVE.md                   Kubernetes detail
docs/easy-guide/                          simple path (start here)
docs/devops-interview-preparation/        interview curriculum
interview-notes/                          revision notes
DevOps-Interview-Preparation/             another curriculum
```

**Use this order:**

1. `docs/easy-guide/`
2. `README.md`
3. `ARCHITECTURE.md`
4. `DEVOPS_FRESHER_TO_SENIOR_BUILD_GUIDE.md`
5. `HOW_TO_READ_AND_MASTER_THIS_PROJECT.md`
6. `KUBERNETES_DEEP_DIVE.md`
7. one interview collection (not all three at once)

## 5. The recommended folder order (mental model)

```
1. Application
   apiserver/
   client/

2. Local packaging
   Dockerfile
   docker-compose.yaml

3. Orchestration
   k8s/

4. Cloud
   infra/

5. Delivery
   .github/workflows/

6. Operations
   deploy/
   scripts/

7. Learning
   docs/easy-guide/
   docs/
   interview-notes/
```

Read files in that order. That is also the order in which a request flows and the order in which you build the system.

## 6. Five small fixes that improve this repo

Do these on a branch, one PR each.

### Fix 1 — `k8s/dbpvc.yaml` invalid YAML

The `labels` line is indented one space too deep. Correct:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: db-pvc
  namespace: node-react-app
  labels:
    app: postgres-db
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 3Gi
  storageClassName: standard
```

Then `kubectl kustomize k8s` will parse correctly.

### Fix 2 — overlay paths

`k8s/overlays/*/kustomization.yaml` uses `../../namespace.yaml`. Kustomize blocks paths outside the overlay folder by default.

Immediate workaround:

```bash
kubectl kustomize --load-restrictor LoadRestrictionsNone k8s/overlays/lab
```

Better fix: make the overlay reference the base:

```yaml
resources:
  - ../..
patches:
  - target: { kind: ConfigMap, name: configmap }
    patch: |-
      - op: replace
        path: /data/DB_HOST
        value: "..."
```

### Fix 3 — rotate committed local secrets

`k8s/secret.yaml` and `docker-compose.yaml` contain real-looking JWT and session secrets. Even if they are "local only", rotate them and never reuse them.

### Fix 4 — make scans blocking

In `.github/workflows/main.yaml`, change:

```yaml
exit-code: "0"
```

to:

```yaml
exit-code: "1"
```

Start with `severity: "CRITICAL"` so the build only fails on the worst issues.

### Fix 5 — real smoke test after deploy

At the end of `deploy-lab.yml`:

```yaml
- name: Smoke test
  run: |
    ALB=$(kubectl get ingress skills-platform-ingress -n $K8S_NAMESPACE \
      -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    bash scripts/smoke-test.sh "http://$ALB" "http://$ALB"
```

Now a "successful" deploy actually proves the app works.

## 7. Safety rules for cleanup

1. Never delete `.config.env`, `example.env`, `package-lock.json`, `terraform.tfvars.example`.
2. Never delete `.git/`.
3. Never delete `node_modules/` unless you plan to run `npm ci` again.
4. Never delete `k8s/secret.yaml` without first moving production to ExternalSecrets.
5. Never delete `client/public/` — it is source.
6. Never run `docker compose down -v` unless you want to lose local database data.
7. Never run `terraform destroy` before deleting the Kubernetes Ingress (the ALB will block VPC deletion).

## 8. Final tree (after cleanup)

```
node-react-postgres/
├── apiserver/                backend source + tests
├── client/                   frontend source (build/ regenerated)
├── k8s/                      Kubernetes base + overlays
├── infra/                    Terraform modules + lab
├── deploy/                   Prometheus + Grafana
├── scripts/                  smoke test + AWS checks
├── .github/workflows/        CI + CD
├── docs/
│   ├── easy-guide/           ← start here
│   ├── adr/
│   └── devops-interview-preparation/
├── interview-notes/
├── DevOps-Interview-Preparation/
├── README.md
├── ARCHITECTURE.md
├── docker-compose.yaml
└── ... other root guides
```

## 9. Cleanup checklist

- [ ] I know what was removed and how to regenerate it.
- [ ] I kept all source files.
- [ ] I can run `cd client && npm run build` if I need static files.
- [ ] I understand the optional duplicates.
- [ ] I picked one learning path instead of reading all of them.
