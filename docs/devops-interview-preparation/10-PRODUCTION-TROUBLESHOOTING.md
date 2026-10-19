# 10 — Production Troubleshooting & Reliability Playbooks (`10-PRODUCTION-TROUBLESHOOTING.md`)

---

## 1. Systematic Troubleshooting Methodology (Hinglish)

Production incident mein kabhi bhi andaze se Pod delete ya server restart nahi karte. Har incident mein yeh 6-step order follow karein:
1. **Observe Symptom & Blast Radius**: Kitne percent users affected hain (`502`, `503`, slow latency)?
2. **Mitigate / Stop the Bleeding First**: Agar latest deployment ke turant baad outage shuru hua hai, toh pehle **`kubectl rollout undo`** karein, debugging baad mein!
3. **Collect Evidence**: `kubectl get pods`, `kubectl describe pod`, `kubectl logs --previous`, Prometheus graphs, aur RDS CloudWatch metrics check karein.
4. **Isolate the Layer**: Edge/ALB $\to$ NGINX (`client`) $\to$ Express (`apiserver`) $\to$ Network/SG $\to$ RDS PostgreSQL.
5. **Apply Root-Cause Fix & Verify**: Fix ko branch/PR ke through test karke deploy karein aur `/healthz`, `/readyz`, `/metrics` verify karein.
6. **Blameless Post-Mortem (RCA)**: "Kisne galti ki" ke bajaye "Pipeline ke kis gate ne is galti ko kyun nahi roka?" document karein.

---

## 2. Quick-Reference Diagnostic Matrix for This Project

| Failure Mode | Symptom | First 3 Diagnostic Commands | Root Cause in This Project | Safe Remediation |
| :--- | :--- | :--- | :--- | :--- |
| **`client` Pod `CrashLoopBackOff`** | Frontend Pod crashes immediately on startup in K8s | `kubectl logs -l app=client-app -n node-react-app --previous` | `nginx: [emerg] host not found in upstream "apiserver"` if `apiserver` Service is missing (`F-01`) | Apply updated `k8s/apisrc.yaml` containing both `apiserver-service` and `apiserver` Services |
| **HTTP `503 Service Unavailable` on `/api/*`** | ALB returns `503`; `apiserver` Pods show `0/1 Ready` | `kubectl describe pod -l app=apiserver -n node-react-app` | `/readyz` failing (`sampledb.authenticate()` rejected due to wrong `DB_HOST`, `DB_SSL`, or `rds-sg`) | Verify `ConfigMap` (`DB_HOST`, `DB_SSL="true"`), `ExternalSecret` (`my-secret`), and `rds-sg` port `5432` |
| **HTTP `404` on `/api/v1/auth/login` via NGINX** | React login fails with `404 Not Found` locally | `docker compose logs client` and `apiserver` | Trailing slash in `proxy_pass http://apiserver:8010/;` stripped `/api/` prefix | Remove trailing slash: `proxy_pass http://apiserver:8010;` in `client/nginx.conf` |
| **`apiserver` `OOMKilled` (`Exit Code 137`)** | Pod restarts under heavy image upload traffic (`sharp`) | `kubectl get pod -n node-react-app -o jsonpath='{.items[*].status.containerStatuses[*].lastState}'` | Concurrent large image buffers in `uploadSingleFile.js` (`multer.memoryStorage()`) exceeding `512Mi` limit | Add `limits: { fileSize: 2 * 1024 * 1024 }` in Multer and tune memory request/limit |
| **`terraform destroy` Hangs on VPC/Subnets** | `DependencyViolation` on VPC or Public Subnets | `aws elbv2 describe-load-balancers --region ap-south-1` | Kubernetes Ingress (`skills-platform-ingress`) was not deleted before `terraform destroy`, leaving ALB ENIs attached | Delete Ingress (`kubectl delete ingress -n node-react-app`), wait 90s for ALB deletion, then re-run `terraform destroy` |
