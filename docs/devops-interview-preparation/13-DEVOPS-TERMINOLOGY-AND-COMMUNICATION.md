# 13 — Official DevOps Terminology & Workplace Communication (`13-DEVOPS-TERMINOLOGY-AND-COMMUNICATION.md`)

> **Phase 19 — Official Technical Glossary & Real-World Engineering Communication**  
> *(See also the 48-Term Dictionary in [../../DEVOPS_IMPLEMENTATION_GUIDE.md](../../DEVOPS_IMPLEMENTATION_GUIDE.md))*

---

## 1. Core DevOps Terminology Table (Formal Meaning + Simple Hinglish + Project Example + Team Sentence)

| Term | Formal Definition | Simple Hinglish Explanation | Project Example (`node-react-postgres`) | Natural Sentence in a Team / Interview |
| :--- | :--- | :--- | :--- | :--- |
| **Artifact** | A deployable, immutable output produced by a build pipeline. | Build process ke baad jo final package/image banta hai jise hum deploy karte hain. | Docker images `skills-apiserver:<git-sha>` and `skills-client:<git-sha>` in Amazon ECR. | *"We build the container artifact once in CI and promote the exact same SHA digest across environments."* |
| **Immutable Tag** | A registry enforcement preventing an existing image tag from being overwritten. | Ek baar image tag push ho gaya toh usi naam se doosri image overwrite nahi ho sakti. | `image_tag_mutability = "IMMUTABLE"` in `infra/modules/ecr/main.tf`. | *"We disabled mutable `:latest` tags in ECR and use immutable Git commit SHAs for auditability and instant rollbacks."* |
| **Reverse Proxy** | A server that sits in front of backend servers and forwards client requests to them. | Aisa gatekeeper server jo client se request lekar peeche chal rahe backend server ko forward karta hai. | `client/nginx.conf` forwarding `/api/` to `http://apiserver:8010`. | *"NGINX acts as both our static React asset server and a reverse proxy forwarding `/api/*` calls to Express."* |
| **State & Drift** | State is Terraform's recorded mapping of real resources; Drift occurs when live cloud resources diverge from IaC. | Terraform ki memory file (`terraform.tfstate`) aur live AWS mein manual बदलाव se aane wala antar. | Someone manually editing `rds-sg` in the AWS Console causes drift during `terraform plan`. | *"Before applying changes, we run `terraform plan` to detect any out-of-band configuration drift."* |
| **Least Privilege & IRSA** | Granting an identity only the minimum permissions needed for its task; IAM Roles for Service Accounts binds AWS IAM roles to K8s Pods. | Kisi user ya Pod ko sirf utni hi permission dena jitni kaam ke liye zaroori hai. | `skills-app-sa` ServiceAccount (`k8s/serviceaccount.yaml`) reading only `prod/node-react-app/credentials`. | *"Instead of attaching broad permissions to the EC2 node role, we scope Secrets Manager access to the Pod via IRSA."* |
| **Liveness vs Readiness Probe** | Liveness detects deadlocked processes needing restart; Readiness detects when a Pod can safely receive traffic. | Liveness check karta hai "process zinda hai ya restart karun?"; Readiness check karta hai "traffic bhejun ya ruk jaun?". | `/healthz` (Liveness) vs `/readyz` (Readiness checking `sampledb.authenticate()`). | *"Separating `/healthz` from `/readyz` prevents a brief RDS glitch from triggering a cascading liveness restart storm."* |
| **SLI / SLO / Error Budget** | Quantitative measure of service behavior (SLI), target threshold (SLO), and remaining allowed unreliability (Error Budget). | Service ki napne wali metric (SLI), humara internal target (SLO), aur mahine mein allowed failure margin. | `99.9%` of `/api/*` requests returning non-`5xx` within `500ms` measured via `/metrics`. | *"Our p95 latency SLI breached 500ms during the load test, so we tuned the Sequelize connection pool before burning our error budget."* |

---

## 2. How DevOps Engineers Communicate Across Teams (Copy-Paste Templates)

1. **With Backend Developers (Reporting a Code/Config Issue Found in Review)**:
   - *"Hi team, while testing the Kubernetes deployment for `client`, I noticed `client/nginx.conf` proxies `/api/` to `http://apiserver:8010`. In `k8s/apisrc.yaml`, the Service was only named `apiserver-service`, which caused NGINX to fail DNS resolution on startup. I added an `apiserver` Service alias in `k8s/apisrc.yaml` so both Docker Compose and Kubernetes resolve cleanly without requiring code changes."*
2. **With Security Engineers (Explaining Vulnerability Remediation)**:
   - *"We fixed two supply-chain gaps in `.github/workflows/main.yaml`: first, we excluded `.config.env` in `apiserver/.dockerignore` and switched to a 2-stage `--omit=dev` build running as `USER node` (`UID 1000`); second, we added Trivy container scanning for both `skills-apiserver` and `skills-client` images."*
3. **With Engineering Managers / FinOps (Requesting Lab Provisioning Approval)**:
   - *"I've validated the Docker Compose stack, Kustomize overlays, and Terraform formatting locally (`$0` cost). To run the end-to-end EKS + Private RDS + ALB integration test in `ap-south-1`, the lab will cost approximately `$0.29/hour` (`~$1.16` for a 4-hour window). Once verified, I will execute the dependency-ordered teardown (`kubectl delete ingress` followed by `terraform destroy` and `scripts/post-destroy-check.sh`) to return recurring costs to `$0`."*
