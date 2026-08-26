# Level 4: Zero-Downtime Deployment Strategies (Rolling, Blue/Green & Canary)

> **Experience Target:** 4-Year Senior DevOps & Platform Architect  
> **Topic Scope:** Rolling Updates (`maxSurge`/`maxUnavailable`), Blue/Green traffic switching, Canary deployments with Argo Rollouts, and GitOps with ArgoCD.

---

## 1. Zero-Downtime Deployment Comparison

| Strategy | Downtime | Extra Infrastructure Cost | Risk & Blast Radius | Rollback Speed |
| :--- | :--- | :--- | :--- | :--- |
| **Rolling Update (Kubernetes Default)** | **0** | Minimal (`maxSurge` pods) | Medium (all users eventually get new code). | 1–2 minutes (`kubectl rollout undo`). |
| **Blue/Green Deployment** | **0** | **+100%** during deployment window. | Low (validation in Green before cutover). | **Instant (< 5 seconds)** via DNS / ALB switch. |
| **Canary Deployment (Argo Rollouts)** | **0** | **+5–10%** for canary replicas. | **Minimal** (only 5% of traffic exposed to test version). | **Automated** upon Prometheus error spike. |

---

## 2. Advanced Canary Deployment with Argo Rollouts

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: apiserver-rollout
  namespace: node-react-app
spec:
  replicas: 10
  strategy:
    canary:
      steps:
        - setWeight: 5        # Route 5% traffic to new version
        - pause: { duration: 10m } # Wait 10 minutes for metric analysis
        - analysis:
            templates:
              - templateName: success-rate-check
        - setWeight: 20       # Route 20% traffic
        - pause: { duration: 10m }
        - setWeight: 50
        - pause: { duration: 5m }
```

* **Automated Rollback Metric (`AnalysisTemplate`):**
  * Prometheus queries the HTTP 5xx error rate on the canary pods.
  * If the 5xx rate exceeds `1.0%`, Argo Rollouts **aborts promotion and flips 100% of traffic back to the stable revision automatically** without human intervention.
