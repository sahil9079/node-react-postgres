# Level 4: Kubernetes Autoscaling — HPA & Karpenter

> **Experience Target:** 4-Year Senior DevOps & Platform Architect  
> **Topic Scope:** Horizontal Pod Autoscaler (HPA), Vertical Pod Autoscaler (VPA), Karpenter vs Classic Cluster Autoscaler, Spot instance cost optimization.

---

## 1. Horizontal Pod Autoscaling (HPA)

### Production HPA Manifest for `apiserver`
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: apiserver-hpa
  namespace: node-react-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: apiserver
  minReplicas: 3
  maxReplicas: 30
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300   # 5-minute cooldown to prevent thrashing
```

---

## 2. Cluster Autoscaling: Karpenter vs. Cluster Autoscaler

| Feature | Classic Cluster Autoscaler | Karpenter (Modern AWS Standard) |
| :--- | :--- | :--- |
| **Mechanism** | Adjusts AWS Auto Scaling Group (ASG) capacity. | Talks directly to AWS EC2 Fleet API. |
| **Node Launch Speed** | Slow (takes **3 to 5 minutes** per node). | Ultra-fast (launches node in **under 45 seconds**). |
| **Instance Type Selection** | Tied to fixed ASG instance types (e.g. only `t3.medium`). | Evaluates pending pod requests and provisions the exact best-fit instance type dynamically. |
| **Spot & Cost Optimization** | Difficult to mix On-Demand and Spot instances. | Natively handles Spot instance diversification, graceful node consolidation, and rightsizing. |

---

## 3. Production Pod Hardening (Probes & PDB)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: apiserver
spec:
  template:
    spec:
      containers:
        - name: apiserver
          resources:
            requests:
              cpu: "250m"
              memory: "256Mi"
            limits:
              cpu: "1000m"
              memory: "512Mi"
          livenessProbe:
            httpGet: { path: /healthz, port: 8010 }
            initialDelaySeconds: 15
            periodSeconds: 10
          readinessProbe:
            httpGet: { path: /readyz, port: 8010 }
            initialDelaySeconds: 5
            periodSeconds: 5
```
