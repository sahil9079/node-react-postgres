# Kubernetes Troubleshooting Matrix

| Issue | Symptom | Diagnostic Command | Root Cause & Resolution |
| :--- | :--- | :--- | :--- |
| **CrashLoopBackOff** | Container restarts repeatedly | `kubectl logs <pod> --previous` | App error, missing env var, DB connection failure. |
| **ImagePullBackOff** | Pod cannot pull image | `kubectl describe pod <pod>` | Invalid image tag, wrong registry URL, or missing ECR secret/IAM. |
| **Pending Pod** | Pod not scheduled to any node | `kubectl describe pod <pod>` | Insufficient CPU/Memory on cluster nodes or unsatisified NodeAffinity. |
| **Pending PVC** | Storage claim unbound | `kubectl describe pvc <pvc>` | StorageClass provisioner missing or EBS CSI driver not installed. |
