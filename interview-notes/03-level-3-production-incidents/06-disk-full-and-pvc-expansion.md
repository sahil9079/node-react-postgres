# Level 3: Incident Scenario — Disk Full (100%) & PVC Expansion

> **Incident Severity:** P0 / Critical  
> **Symptom:** Worker node reaches 100% disk usage, or PostgreSQL PVC runs out of space.

---

## 1. Worker Node Disk Pressure Triage

### Step 1: Detect Node Disk Pressure
```bash
kubectl describe node <NODE_NAME> | grep -i diskpressure
# Conditions: DiskPressure = True
```
* When a node hits 85–90% disk utilization, kubelet starts **evicting BestEffort and Burstable pods**.

### Step 2: Emergency Node Cleanup
```bash
# 1. SSH into the worker node
ssh -i key.pem ec2-user@<NODE_IP>

# 2. Check disk usage per partition
df -h

# 3. Clean unused containers, networks, and dangling image layers
docker system prune -af --volumes
# Or for containerd runtime:
crictl rmi --prune

# 4. Truncate systemd and kubelet logs
journalctl --vacuum-size=500M
```

---

## 2. PostgreSQL PVC Expansion (`db-pvc`)

### Step 1: Check Database Volume Utilization
```bash
kubectl exec -it $(kubectl get pod -l app=postgres-db -n node-react-app -o jsonpath='{.items[0].metadata.name}') -n node-react-app -- df -h /var/lib/postgresql/data
```

### Step 2: Dynamic Volume Expansion (Zero Data Loss)
* Kubernetes supports expanding PersistentVolumeClaims online without recreating the volume:
```bash
# 1. Edit the PVC in-place
kubectl edit pvc db-pvc -n node-react-app

# 2. Update the storage request from 3Gi to 10Gi:
spec:
  resources:
    requests:
      storage: 10Gi
```
* **Underlying AWS EBS Action:** The AWS EBS CSI driver issues a `ModifyVolume` API call to AWS. AWS expands the EBS gp3 volume online. Once complete, the Linux filesystem (`ext4` or `xfs`) is resized inside the pod automatically.
* *Prerequisite:* The `StorageClass` must have `allowVolumeExpansion: true`.
