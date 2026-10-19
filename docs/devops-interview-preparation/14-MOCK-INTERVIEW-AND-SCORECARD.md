# 14 — Interactive Mock Interview & Competency Scorecard (`14-MOCK-INTERVIEW-AND-SCORECARD.md`)

> **Phase 18 — Interactive One-Question-at-a-Time Mock Interview Mode & Scorecard**

---

## 1. How Interactive Mock Interview Mode Works

Jab bhi aap mock interview practice karna chahein, chat mein likhein:
- **`"Start Mock Interview Level 1"`** (Beginner / Fresher)
- **`"Start Mock Interview Level 2"`** (Junior DevOps)
- **`"Start Mock Interview Level 3"`** (Intermediate DevOps)
- **`"Start Mock Interview Level 4"`** (~3+ Years Production DevOps)

### Rules Followed During Your Mock Interview
1. Main ek baar mein **sirf 1 scenario aur 1 question** poochunga (bina answer dikhaye).
2. Aap apna answer Hinglish ya English mein likhenge.
3. Main aapke answer ko **0 se 10 scale** par evaluate karunga across 5 criteria:
   - **Technical Accuracy (2 pts)**
   - **Troubleshooting Order / Triage Logic (2 pts)**
   - **Production Safety / Blast Radius Awareness (2 pts)**
   - **Clarity & Official DevOps Terminology (2 pts)**
   - **Project Grounding (`node-react-postgres` specifics) (2 pts)**
4. Agar aapka answer incomplete hai, toh main poora solution dene se pehle **1 targeted hint** dunga, phir **Stronger Sample Interview Answer** aur **1 Interviewer Follow-Up Question** poochunga, aur niche diye gaye Scorecard table ko update karunga.

---

## 2. Live Candidate Competency Scorecard Tracker

| Domain | Level Attempted | Questions Completed | Average Score (0–10) | Key Strengths | Areas to Practice |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Linux, Processes & Networking** | Ready to Start | 0 / 5 | — | — | `SIGTERM`, non-root `UID 1000`, DNS, `502` vs `503` |
| **2. Git, PR Gates & Secret Hygiene** | Ready to Start | 0 / 5 | — | — | `.dockerignore` vs `.gitignore`, history scrubbing |
| **3. Docker & Docker Compose** | Ready to Start | 0 / 5 | — | — | Multi-stage builds, `service_healthy`, `down` vs `down -v` |
| **4. CI/CD & GitHub Actions OIDC** | Ready to Start | 0 / 5 | — | — | OIDC trust policy, immutable SHA tags, rollout undo |
| **5. AWS VPC, IAM, ECR & RDS** | Ready to Start | 0 / 5 | — | — | 3-tier subnets, SG chaining, NAT Gateway trade-offs |
| **6. Terraform & State Management** | Ready to Start | 0 / 5 | — | — | Bootstrap S3, `use_lockfile = true`, drift, `force-unlock` |
| **7. Kubernetes, EKS & ALB Ingress** | Ready to Start | 0 / 5 | — | — | `/healthz` vs `/readyz`, `ClusterIP` + ALB Ingress, HPA/PDB |
| **8. Observability & Incident Response** | Ready to Start | 0 / 5 | — | — | Golden signals, cardinality normalization, RCA |
| **9. FinOps & Safe AWS Teardown** | Ready to Start | 0 / 5 | — | — | Idle cost drivers, Ingress-before-Terraform teardown |

---

## 3. Ready-to-Answer Question #1 (Try Answering Now Whenever You Are Ready!)

> **Mock Interview Question #1 (Level 2/3 — Grounded in `client/nginx.conf` & `k8s/apisrc.yaml`)**:  
> *"In your Skills Management Platform, `docker compose up` works fine on your laptop—both React and the `/api/v1/auth/login` endpoint work. However, when you deploy the exact same `client` Docker image to Kubernetes, the `client` Pod immediately enters `CrashLoopBackOff` even though the `apiserver` Pods are `Running 1/1`. Walk me through: (1) What is the very first command you run to diagnose this? (2) What error will you see in the logs based on how NGINX handles `proxy_pass`? (3) How did we fix this cleanly without breaking Docker Compose?"*
