# Architecture Decision Record (ADR) & System Blueprint

> **Project:** FullStack DevOps Pipeline — Skills Management Platform  
> **Scope:** Containerization, Kubernetes Orchestration, CI/CD Automation, Networking, and Cloud Infrastructure  
> **Status:** Active Reference Blueprint

---

## 1. Executive System Overview

The platform is a cloud-native 3-tier web application built to manage professional skill portfolios. The architecture decouples static frontend asset delivery, RESTful API services, and relational database persistence into independently scalable, isolated containerized workloads.

### Complete System Architecture & Network Flow

```mermaid
flowchart TD
    subgraph Internet["Public Internet"]
        User["Client Web Browser (User)"]
    end

    subgraph AWS_Cloud["AWS Cloud Infrastructure"]
        ALB["AWS Application Load Balancer\n(Port 80)"]

        subgraph EKS["Amazon EKS Cluster (Namespace: node-react-app)"]
            subgraph Frontend_Tier["Frontend Tier (Client)"]
                ClientSvc["Service: client-service\n(type: LoadBalancer)"]
                ClientPod["Client Pod: Nginx 1.29-Alpine\n- Port 80\n- Serves React 17 SPA Static Files\n- Reverse Proxies /api/"]
            end

            subgraph Backend_Tier["Backend Tier (API)"]
                APISvc["Service: apiserver-service\n(type: ClusterIP, Port 8010)"]
                APIPod["API Pod: Node.js 18 Slim\n- Express 4 REST API\n- Port 8010 (USER node)\n- JWT Auth, Bcrypt, Sharp"]
            end

            subgraph Database_Tier["Database Tier (Storage)"]
                DBSvc["Service: postgres-service\n(type: ClusterIP, Port 5432)"]
                DBPod["PostgreSQL 15 Alpine Pod\n- Port 5432\n- sampledb Catalog"]
                PVC["PersistentVolumeClaim (db-pvc)\n- 3Gi ReadWriteOnce"]
            end

            ConfigMap["ConfigMap: configmap\n(NODE_ENV, DB_HOST, PORT)"]
            Secret["Secret: my-secret\n(DB_USER, DB_PASS, JWT_SECRET)"]
        end

        EBS["AWS EBS gp3 Volume\n(Managed via EBS CSI Driver)"]
    end

    User -->|1. HTTP GET / | ALB
    ALB -->|2. Forward Port 80| ClientSvc
    ClientSvc --> ClientPod
    ClientPod -->|3. Serve Static HTML/JS| User
    User -->|4. HTTP POST /api/v1/auth/login| ALB
    ALB --> ClientPod
    ClientPod -->|5. proxy_pass /api/ | APISvc
    APISvc --> APIPod
    ConfigMap -.->|Inject non-sensitive env| APIPod
    Secret -.->|Inject sensitive credentials| APIPod
    Secret -.->|Inject credentials| DBPod
    APIPod -->|6. Sequelize TCP Queries| DBSvc
    DBSvc --> DBPod
    DBPod -->|7. Read/Write Mount /var/lib/postgresql/data| PVC
    PVC -->|8. Cloud Block I/O| EBS

    classDef aws fill:#FF9900,stroke:#232F3E,stroke-width:2px,color:black;
    classDef k8s fill:#326CE5,stroke:#fff,stroke-width:2px,color:white;
    classDef pod fill:#E6F0FA,stroke:#326CE5,stroke-width:1px,color:black;
    class ALB,EBS aws;
    class ClientSvc,APISvc,DBSvc,ConfigMap,Secret k8s;
    class ClientPod,APIPod,DBPod pod;
```

---

## 2. Architecture Decision Records (ADRs)

---

### ADR-001: Container Orchestration Strategy (Docker Compose $\to$ Kubernetes)

#### Context & Problem Statement
Developers require rapid feedback loops and local debugging capabilities on single machines, while production workloads demand automated self-healing, rolling updates, autoscaling, and cloud resource abstraction.

#### Decision
* **Local Development:** Use **Docker Compose** for lightweight, multi-container orchestration.
* **Production Deployment:** Use **Kubernetes (Amazon EKS manifests)** for declarative orchestration.

#### Mapping Blueprint: Docker Compose $\to$ Kubernetes

```mermaid
graph LR
    subgraph Docker_Compose["Docker Compose (docker-compose.yaml)"]
        DC_Client["services.client\n(build: ./client, ports: 80:80)"]
        DC_API["services.apiserver\n(build: ./apiserver, ports: 8010)"]
        DC_DB["services.db\n(postgres:15-alpine, healthcheck)"]
        DC_Vol["volumes.dbdata"]
        DC_Env["env_file: .config.env"]
    end

    subgraph Kubernetes["Kubernetes (k8s/ manifests)"]
        K8s_Client["clientdep.yaml (Deployment)\nclientsrc.yaml (LoadBalancer)"]
        K8s_API["apidep.yaml (Deployment)\napisrc.yaml (ClusterIP)"]
        K8s_DB["dbdep.yaml (Deployment)\ndbsrc.yaml (ClusterIP)"]
        K8s_PVC["dbpvc.yaml (PersistentVolumeClaim 3Gi)"]
        K8s_Config["configmap.yaml (Non-sensitive)\nsecret.yaml (Sensitive base64)"]
    end

    DC_Client ==>|Maps To| K8s_Client
    DC_API ==>|Maps To| K8s_API
    DC_DB ==>|Maps To| K8s_DB
    DC_Vol ==>|Maps To| K8s_PVC
    DC_Env ==>|Splits Into| K8s_Config
```

---

### ADR-002: Client Routing (Service LoadBalancer vs. Ingress Controller)

#### Context & Problem Statement
The React frontend and Express backend need external reachability. The architectural question is whether to deploy an Ingress Controller (e.g. AWS Load Balancer Controller) or expose the client Nginx pod directly via `type: LoadBalancer`.

#### Decision
Use **`type: LoadBalancer`** directly on `clientsrc.yaml`. Do **not** deploy an extra Ingress Controller layer for this single-frontend architecture.

#### Rationale & Trade-Off Matrix

```mermaid
flowchart TD
    subgraph Chosen_Architecture["Chosen: type: LoadBalancer (Direct & Clean)"]
        BrowserA["Browser"] -->|Port 80| ALBA["AWS Load Balancer"]
        ALBA -->|NodePort| NginxPodA["Client Pod (Nginx)\n- Serves React SPA on /\n- proxy_pass /api/ to backend"]
        NginxPodA -->|ClusterIP| BackendA["apiserver-service:8010"]
    end

    subgraph Ingress_Alternative["Alternative: Ingress Controller (Overhead)"]
        BrowserB["Browser"] --> IngressLB["AWS ALB (Ingress)"]
        IngressLB -->|Route / | NginxPodB["Client Pod (React Static)"]
        IngressLB -->|Route /api/ | BackendB["apiserver-service:8010"]
    end

    classDef chosen fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:black;
    classDef alt fill:#FFF3E0,stroke:#EF6C00,stroke-width:1px,color:black;
    class Chosen_Architecture chosen;
    class Ingress_Alternative alt;
```

| Dimension | `type: LoadBalancer` (Selected) | Ingress Controller (Alternative) |
| :--- | :--- | :--- |
| **Architectural Simplicity** | **High:** 1 Service manifest (`clientsrc.yaml`). | **Low:** Requires Ingress resource + Controller pod + IAM OIDC roles. |
| **Infrastructure Cost** | **Free-tier eligible** AWS ALB. | Extra controller resources + provisioned ALB (~$20+/month). |
| **Routing Logic** | Handled natively by Nginx inside the client pod. | Handled at the AWS ALB Layer 7 rule level. |
| **When to Switch** | Current fit for 3-tier architecture. | Required when managing 10+ microservices or multi-domain SSL hosting. |

---

### ADR-003: Multi-Stage Docker Containerization

#### Context & Problem Statement
React Single Page Applications require a Node.js build runtime with extensive devDependencies (Webpack, Babel, React-Scripts) during compilation, but only require a lightweight static web server during production runtime.

#### Decision
Implement a **2-stage multi-stage build** in [`client/Dockerfile`](file:///d:/javascript_project/node-react-postgres/client/Dockerfile).

```mermaid
flowchart LR
    subgraph Stage1["Stage 1: Builder (node:18-bullseye-slim)"]
        Code["React Source Code\n+ package.json"] --> NPM["npm ci\n(Dependencies)"]
        NPM --> Build["npm run build\n(Compiles JSX to /app/build)"]
    end

    subgraph Stage2["Stage 2: Runtime (nginx:1.29-alpine)"]
        StaticFiles["Static Assets\n(/app/build)"] --> Nginx["/usr/share/nginx/html"]
        Config["nginx.conf\n(SPA try_files + /api/ proxy)"] --> NginxConf["/etc/nginx/conf.d/default.conf"]
    end

    Build ==>|COPY --from=Builder /app/build| StaticFiles

    classDef stage1 fill:#FFF9C4,stroke:#FBC02D,stroke-width:1px,color:black;
    classDef stage2 fill:#E1F5FE,stroke:#0288D1,stroke-width:2px,color:black;
    class Stage1 stage1;
    class Stage2 stage2;
```

#### Metrics & Security Optimization
* **Image Size Reduction:** Discards the ~1.2 GB Node runtime; the final production image is **only ~23 MB**.
* **Attack Surface Elimination:** No Node.js runtime, npm cache, or development dependencies exist in the production container image.

---

### ADR-004: Automated CI/CD Pipeline & Quality Gates

#### Context & Problem Statement
Unvalidated code, breaking dependencies, and security vulnerabilities must be blocked automatically before building and pushing container images to the registry.

#### Decision
Implement a multi-job **GitHub Actions** pipeline with sequential quality gates.

```mermaid
flowchart TD
    Commit["Git Push to main"] --> Checkout["actions/checkout@v3"]
    
    subgraph Job1["Job 1: Parallel Matrix Testing"]
        Checkout --> TestAPI["apiserver: npm ci && npm test --cov"]
        Checkout --> TestClient["client: npm ci && npm test --cov"]
        TestAPI --> Gate1{"Coverage >= 50%?"}
        TestClient --> Gate1
    end

    Gate1 -->|Pass| Job2["Job 2: SonarQube Code Quality"]
    Gate1 -->|Pass| Job3["Job 3: DevSecOps Vulnerability Scans"]
    Gate1 -->|Fail| Terminate["Pipeline Terminated (Merge Blocked)"]

    subgraph Job2_Details["SonarQube Analysis"]
        Job2 --> SonarScan["SonarSource/sonarqube-scan-action"]
        SonarScan --> QualityGate{"Quality Gate Passed?"}
    end

    subgraph Job3_Details["Security Scanning"]
        Job3 --> Audit["npm audit (JSON report)"]
        Job3 --> Trivy["Aqua Security Trivy (fs CVE scan)"]
        Audit --> Artifacts["Upload Artifacts v4"]
        Trivy --> Artifacts
    end

    QualityGate -->|Pass| BuildDeploy["Build Docker Images & Deploy to EKS"]
    QualityGate -->|Fail| Terminate

    classDef pass fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:black;
    classDef fail fill:#FFEBEE,stroke:#C62828,stroke-width:2px,color:black;
    classDef job fill:#EDE7F6,stroke:#512DA8,stroke-width:1px,color:black;
    class Gate1,QualityGate pass;
    class Terminate fail;
    class Job1,Job2,Job3 job;
```

---

## 3. Production Readiness & Roadmap Evolution

```mermaid
timeline
    title Infrastructure Evolution & Maturity Roadmap
    Phase 1 (Completed) : Docker Multi-Stage Builds : Jest Unit/Integration Tests : Docker Compose with Healthchecks
    Phase 2 (Completed) : 10 Kubernetes Manifests : Namespace Isolation : ConfigMap & Secret Separation
    Phase 3 (Current) : GitHub Actions CI Testing : SonarQube Integration : Trivy Security Scans
    Phase 4 (Target) : Terraform IaC (VPC/EKS/RDS) : AWS ALB Ingress Controller : Amazon RDS Multi-AZ Failover
    Phase 5 (Scale) : Karpenter Dynamic Autoscaling : ArgoCD GitOps Continuous Delivery : Prometheus & Grafana Observability
```
