# Project Deep Dive: Kubernetes Manifests Defense

> **Core Focus:** Answering technical interview questions about your 10 Kubernetes YAML manifests in `k8s/`.

---

## 1. Kubernetes Architecture Q&A

### Q1. Why did you use `envFrom` in `apidep.yaml`?
```yaml
envFrom:
  - configMapRef:
      name: configmap
  - secretRef:
      name: my-secret
```
* **Answer:** "`envFrom` automatically loads all key-value pairs defined in `configmap` and `my-secret` as environment variables inside the container without needing to declare each variable individually with `valueFrom`. This keeps the deployment manifest clean and allows developers to add new non-sensitive config keys to `configmap.yaml` without changing the deployment spec."

---

### Q2. How do your Service Selectors link to Deployments?
* **In `clientdep.yaml`:**
  ```yaml
  spec:
    selector:
      matchLabels:
        app: client-app
    template:
      metadata:
        labels:
          app: client-app
  ```
* **In `clientsrc.yaml`:**
  ```yaml
  spec:
    type: LoadBalancer
    selector:
      app: client-app
  ```
* **Explanation:** "The Service uses its `selector.app: client-app` to continuously query the Kubernetes API for Pods carrying the label `app: client-app`. Kube-proxy registers these Pod IPs as active endpoints for the Service. If there is a label mismatch, the Service endpoint list is empty and incoming traffic fails."

---

### Q3. How does database storage persist when the PostgreSQL pod is deleted?
* **In `dbpvc.yaml` & `dbdep.yaml`:**
  * The `db-pvc` PersistentVolumeClaim is bound to an AWS EBS volume.
  * Because the PVC is decoupled from the Deployment lifecycle, deleting or restarting `postgres-deployment` does not destroy the PVC or underlying EBS volume.
  * When Kubernetes launches a replacement PostgreSQL pod, it re-mounts the same `db-pvc` volume at `/var/lib/postgresql/data`, restoring all tables and data instantly.
