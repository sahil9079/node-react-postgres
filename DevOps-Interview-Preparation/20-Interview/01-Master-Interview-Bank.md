# Comprehensive 3–3.5 Year DevOps Engineer Interview Question Bank

### Section 1: Core Kubernetes Triage
**Q: A Pod is stuck in `Pending` state. How do you investigate?**
* **Answer:** I run `kubectl describe pod <pod_name>` and inspect the **Events** section at the bottom. The most common causes are:
  1. Insufficient cluster CPU or Memory requests.
  2. NodeSelector or NodeAffinity rules that match zero active nodes.
  3. Taints on worker nodes with no matching tolerations on the Pod.
  4. PVC bound failure (storage claim cannot be provisioned).

### Section 2: AWS Infrastructure
**Q: How do you design an EKS cluster for high availability?**
* **Answer:**
  1. Spread Managed Node Groups across at least 3 Availability Zones.
  2. Deploy stateless pods with `podAntiAffinity` to ensure replicas do not land on the same physical node or AZ.
  3. Front workloads with a multi-AZ Application Load Balancer.
  4. Configure Horizontal Pod Autoscaler (HPA) alongside Cluster Autoscaler or Karpenter for compute elasticity.
  5. Back stateful databases with Multi-AZ AWS RDS.
