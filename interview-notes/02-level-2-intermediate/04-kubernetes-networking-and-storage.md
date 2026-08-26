# Level 2: Kubernetes Networking & Storage Deep Dive

> **Experience Target:** 2-Year Mid-Level DevOps Engineer  
> **Topic Scope:** Kubernetes networking model, CoreDNS service discovery, ClusterIP vs NodePort vs LoadBalancer, CSI driver storage lifecycle, PVC binding.

---

## 1. Kubernetes Networking Internals

### Q1. How does a Pod communicate with a Service in another namespace or within the same namespace?
* **Same Namespace (`node-react-app`):**
  * The API pod connects to `http://postgres-service:5432`.
  * CoreDNS appends the search domain `node-react-app.svc.cluster.local` and resolves the virtual ClusterIP.
* **Across Namespaces:**
  * Must use Fully Qualified Domain Name (FQDN): `<service-name>.<namespace>.svc.cluster.local` (e.g. `postgres-service.node-react-app.svc.cluster.local`).

---

### Q2. What is the difference between Service Ports: `port`, `targetPort`, and `nodePort`?

```yaml
apiVersion: v1
kind: Service
metadata:
  name: apiserver-service
spec:
  type: ClusterIP
  selector:
    app: apiserver
  ports:
    - name: http
      port: 8010             # Port exposed by the Service internally
      targetPort: 8010       # Port the container inside the Pod is listening on
      # nodePort: 31234      # (Only for NodePort/LoadBalancer) Port on the physical EC2 node
```

* **`port`:** The port on which other pods inside the cluster access the Service.
* **`targetPort`:** The port where the container application process is actively listening (`containerPort`).
* **`nodePort`:** A dedicated port allocated on every Kubernetes worker node (`30000–32767`) used by external cloud load balancers to route traffic into the cluster.

---

## 2. Kubernetes Persistent Storage Lifecycle

```
[StorageClass (gp3)] ──► [PersistentVolumeClaim (db-pvc)] ──► [PersistentVolume (EBS)] ──► [Mounted in Pod]
```

### Q1. Walk me through the lifecycle of your PostgreSQL storage (`dbpvc.yaml`).
1. **Provisioning Request:** `dbpvc.yaml` requests 3Gi storage with `ReadWriteOnce` access mode.
2. **CSI Driver Dynamic Provisioning:** The AWS EBS CSI Driver intercepts the PVC, communicates with the AWS EC2 EBS API, and creates a 3Gi gp2/gp3 EBS volume in the same Availability Zone where the PostgreSQL pod is scheduled.
3. **Binding:** A `PersistentVolume (PV)` object is created by Kubernetes and automatically bound 1-to-1 with `db-pvc`.
4. **Mounting:** When `postgres-deployment` launches on worker node `node-01`, Kubernetes attaches the EBS block device to `node-01` and mounts it into the container at `/var/lib/postgresql/data`.
5. **Pod Rescheduling:** If the pod crashes or is rescheduled to `node-02` (in the same AZ), Kubernetes automatically detaches the EBS volume from `node-01` and reattaches it to `node-02`, ensuring zero database data loss.
