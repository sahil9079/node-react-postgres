# Kubernetes Fundamentals - Level 3: Advanced

## 1. Pod Lifecycle & Quality of Service (QoS) Classes
Kubernetes assigns QoS classes based on resource requests and limits:
* **Guaranteed:** `requests == limits` for both CPU and Memory. Highest priority; killed last during node resource eviction.
* **Burstable:** `requests < limits`. Evicted after BestEffort pods when node experiences memory pressure.
* **BestEffort:** No requests or limits specified. Lowest priority; first to be evicted when node memory is exhausted.

## 2. Kubernetes Networking & CNI Mechanics
* **Pod-to-Pod Communication:** Every Pod gets its own unique IP. Pods communicate across nodes without NAT (handled by CNI e.g. AWS VPC CNI, Calico).
* **Kube-Proxy:** Manages iptables / IPVS rules on worker nodes to load balance Service IP (ClusterIP) traffic to Pod IPs.
* **CoreDNS:** Resolves `<service-name>.<namespace>.svc.cluster.local` to the Service ClusterIP.
