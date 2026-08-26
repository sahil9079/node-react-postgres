# Level 1: Kubernetes Fundamentals & Manifest Walkthrough

> **Experience Target:** 1-Year Junior/Associate DevOps Engineer  
> **Topic Scope:** Pod, ReplicaSet, Deployment, Service, ConfigMap, Secret, PersistentVolumeClaim, walkthrough of your 10 Kubernetes manifests, and essential `kubectl` CLI commands.

---

## 1. Core Kubernetes Concepts

### Q1. What is Kubernetes and why is it needed over Docker Compose?
* **Docker Compose:** Designed for single-host development. It lacks auto-healing across node crashes, horizontal auto-scaling, zero-downtime rolling updates, and cloud storage integrations.
* **Kubernetes (K8s):** An open-source enterprise container orchestration system that:
  1. Automatically reschedules failed containers and crashed nodes (**Self-Healing**).
  2. Scales container replicas up or down based on CPU/memory load (**Autoscaling**).
  3. Executes progressive zero-downtime updates with automated rollback (**Rolling Updates**).
  4. Provides cluster-wide DNS and load balancing (**Service Discovery**).

---

## 2. Deep Dive: Your 10 Kubernetes Manifests

Your project organizes infrastructure into **10 YAML manifests** under [`k8s/`](file:///d:/javascript_project/node-react-postgres/k8s/):

```
k8s/
├── namespace.yaml   ──► Isolated namespace 'node-react-app'
├── configmap.yaml   ──► Plaintext environment variables
├── secret.yaml      ──► Base64 credentials (DB & JWT)
├── dbpvc.yaml       ──► 3Gi PersistentVolumeClaim for PostgreSQL
├── dbdep.yaml       ──► PostgreSQL Deployment (1 replica)
├── dbsrc.yaml       ──► PostgreSQL ClusterIP Service (Port 5432)
├── apidep.yaml      ──► Express API Deployment (1 replica)
├── apisrc.yaml      ──► Express API ClusterIP Service (Port 8010)
├── clientdep.yaml   ──► Nginx React Frontend Deployment (1 replica)
└── clientsrc.yaml   ──► Nginx Frontend LoadBalancer Service (Port 80)
```

---

### Manifest 1: `k8s/namespace.yaml`
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: node-react-app
```
* **Purpose:** Creates a virtual cluster boundary named `node-react-app`. This scopes RBAC policies, resource quotas, and isolates our resources from other applications running on the same EKS cluster.

---

### Manifest 2: `k8s/configmap.yaml`
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: configmap
  namespace: node-react-app
data:
  NODE_ENV: "development"
  PORT_DEV: "8010"
  API_VERSION: "v1"
  DB_HOST: "postgres-service"
  DB_PORT: "5432"
  DB_NAME: "sampledb"
```
* **Purpose:** Injects non-sensitive environment variables into pods.
* **Key Detail:** `DB_HOST: "postgres-service"` matches the Kubernetes Service name created in `dbsrc.yaml`, allowing CoreDNS to resolve database connections.

---

### Manifest 3: `k8s/secret.yaml`
```yaml
apiVersion: v1
kind: Secret
metadata:
 name: my-secret
 namespace: node-react-app
type: Opaque
data:
 username: cG9zdGdyZXM=       # Base64 decoded: postgres
 password: bXlwYXNzd29yZA==   # Base64 decoded: mypassword
 JWT_SECRET: c29tZV9zZWNyZXQ= # Base64 decoded: some_secret
```
* **Purpose:** Stores sensitive credentials in base64 format.
* **Note:** Base64 is encoding, not encryption. In enterprise production, K8s secrets are encrypted at rest with AWS KMS or injected via HashiCorp Vault.

---

### Manifest 4: `k8s/dbpvc.yaml`
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
* **Purpose:** Requests a 3Gi block storage volume dynamically from the cloud provider (AWS EBS gp2/gp3).
* **`ReadWriteOnce (RWO)`:** Can be mounted as read-write by a single node at a time.

---

### Manifest 5 & 6: `k8s/dbdep.yaml` and `k8s/dbsrc.yaml`
```yaml
# dbdep.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres-deployment
  namespace: node-react-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres-db
  template:
    metadata:
      labels:
        app: postgres-db
    spec:
      containers:
        - name: database
          image: postgres:15-alpine
          volumeMounts:
            - name: db-storage
              mountPath: /var/lib/postgresql/data
          ports:
            - name: postgresdb-port
              containerPort: 5432
          env:
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef: { name: my-secret, key: username }
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef: { name: my-secret, key: password }
            - name: POSTGRES_DB
              value: sampledb
      volumes:
        - name: db-storage
          persistentVolumeClaim:
            claimName: db-pvc
```
```yaml
# dbsrc.yaml
apiVersion: v1
kind: Service
metadata:
 name: postgres-service
 namespace: node-react-app
spec:
 type: ClusterIP
 selector:
   app: postgres-db
 ports:
   - name: postgres
     port: 5432
     targetPort: postgresdb-port
```
* **Purpose:** Runs 1 PostgreSQL container mounting the EBS volume at `/var/lib/postgresql/data`. Exposes port 5432 internally inside the cluster using a `ClusterIP` Service.

---

### Manifest 7 & 8: `k8s/apidep.yaml` and `k8s/apisrc.yaml`
```yaml
# apidep.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
 name: apiserver
 namespace: node-react-app
spec:
 replicas: 1
 selector:
   matchLabels:
     app: apiserver
 template:
   metadata:
     labels:
       app: apiserver
   spec:
     containers:
     - name: apiserver
       image: sahil9079/js-apiserver:v1.1.0
       ports:
         - name: apiserver-port
           containerPort: 8010
       envFrom:
         - configMapRef: { name: configmap }
         - secretRef: { name: my-secret }
```
```yaml
# apisrc.yaml
apiVersion: v1
kind: Service
metadata:
  name: apiserver-service
  namespace: node-react-app
spec:
  type: ClusterIP
  selector:
    app: apiserver
  ports:
    - protocol: TCP
      port: 8010
      targetPort: apiserver-port
```
* **Purpose:** Runs the Express API and exposes it internally via ClusterIP on port 8010. Environment variables are loaded automatically from both `configmap` and `my-secret`.

---

### Manifest 9 & 10: `k8s/clientdep.yaml` and `k8s/clientsrc.yaml`
```yaml
# clientdep.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-deployment
  namespace: node-react-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: client-app
  template:
    metadata:
      labels:
        app: client-app
    spec:
      containers:
        - name: client-server
          image: sahil9079/js-client:v1.1.0
          ports:
            - name: client-port
              containerPort: 80
```
```yaml
# clientsrc.yaml
apiVersion: v1
kind: Service
metadata:
 name: client-service
 namespace: node-react-app
spec:
 type: LoadBalancer
 selector:
   app: client-app
 ports:
   - protocol: TCP
     port: 80
     targetPort: client-port
```
* **Purpose:** Runs the Nginx + React frontend and exposes it directly to the internet by requesting an **AWS Load Balancer** (`type: LoadBalancer`) on Port 80.

---

## 3. Essential `kubectl` Operational Commands

```bash
# 1. Apply all manifests in order
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/ -n node-react-app

# 2. Inspect resources
kubectl get pods -n node-react-app -o wide
kubectl get svc -n node-react-app
kubectl get pvc,pv -n node-react-app

# 3. Debugging pods
kubectl describe pod <POD_NAME> -n node-react-app
kubectl logs -f <POD_NAME> -c apiserver -n node-react-app
kubectl exec -it <POD_NAME> -n node-react-app -- sh

# 4. Rollback deployment
kubectl rollout history deployment/apiserver -n node-react-app
kubectl rollout undo deployment/apiserver -n node-react-app
```
