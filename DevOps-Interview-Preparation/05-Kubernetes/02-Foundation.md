# Kubernetes Fundamentals - Level 1: Foundation

## 1. Kubernetes High-Level Architecture
```
+-------------------------------------------------------------------------+
|                        CONTROL PLANE (MASTER NODES)                     |
|  +-------------------------------------------------------------------+  |
|  | Kube-API-Server  |  etcd (State Store)  |  Kube-Controller-Manager|  |
|  | Kube-Scheduler   |  Cloud-Controller    |                         |  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
                                    |
            +-----------------------+-----------------------+
            |                                               |
            v                                               v
+-----------------------+                       +-----------------------+
|      WORKER NODE 1    |                       |      WORKER NODE 2    |
|  +-----------------+  |                       |  +-----------------+  |
|  | Kubelet         |  |                       |  | Kubelet         |  |
|  | Kube-Proxy      |  |                       |  | Kube-Proxy      |  |
|  | Container Engine|  |                       |  | Container Engine|  |
|  |  [Pod]   [Pod]  |  |                       |  |  [Pod]   [Pod]  |  |
|  +-----------------+  |                       |  +-----------------+  |
+-----------------------+                       +-----------------------+
```

## 2. Core Kubernetes Objects
* **Pod:** The smallest deployable computing unit in K8s (encapsulates one or more containers sharing network namespace & storage).
* **Deployment:** Manages declarative updates and scaling for stateless Pod replicas.
* **Service:** Provides a stable IP address and DNS name to route traffic across dynamic Pods (ClusterIP, NodePort, LoadBalancer).
* **ConfigMap & Secret:** Externalizes configuration parameters and sensitive credentials from container images.

## 3. Essential `kubectl` Commands
```bash
kubectl get nodes -o wide                  # Check cluster node status and IPs
kubectl get pods -A                        # List pods across all namespaces
kubectl describe pod <pod_name>            # Inspect events, status, and failures
kubectl logs -f <pod_name> -c <container>  # Stream container logs
kubectl apply -f deployment.yaml           # Apply declarative manifest
kubectl exec -it <pod_name> -- /bin/sh     # Debug inside pod container
kubectl get svc,ep                         # Check Services and corresponding Endpoints
```
