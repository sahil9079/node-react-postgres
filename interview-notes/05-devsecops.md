# 05. DevSecOps — Detailed Notes

> Theme: **shift-left security** — find issues early, gate the pipeline, verify, monitor. Know the tool acronyms cold (SAST/DAST/SCA), and the "who can override + how it's audited" governance story.

---

## SECTION A: Security Tooling Concepts

### Q1. What is SAST (Static Application Security Testing)?

- **Scans source code** (or compiled bytecode) **without running it** — analyzes patterns, data flow, known-bad practices
- **"White-box"** — looks at the code, not the running app
- **When:** early in the pipeline (commit/PR)
- **What it finds:** SQL injection patterns, XSS, hardcoded secrets, insecure crypto, dangerous function usage
- **Examples:** **SonarQube (security rules)**, Semgrep, Checkmarx, Fortify, ESLint security plugins

**Pros:** fast, cheap, runs on every PR, catches issues before build
**Cons:** false positives, doesn't find runtime/config issues

---

### Q2. What is DAST (Dynamic Application Security Testing)?

- **Tests the RUNNING application** from the outside — sends malicious input, observes responses
- **"Black-box"** — no source code access, like an attacker
- **When:** after deployment (staging, sometimes prod)
- **What it finds:** SQLi, XSS, CSRF, auth issues, misconfig exposed via HTTP, header issues
- **Examples:** OWASP ZAP, Burp Suite, Acunetix

**Pros:** finds real exploitable issues in a running system, no false positives from code
**Cons:** slower, needs a running env, can be intrusive

**Comparison:** SAST = inspect code (early), DAST = attack running app (late). Both needed — different layers.

---

### Q3. What is SCA (Software Composition Analysis)?

- **Scans third-party dependencies** (open-source libraries, packages) for **known vulnerabilities**
- Checks **dependency versions** against **CVE databases** (NVD, GitHub Advisory, OSV)
- **What it finds:** vulnerable libraries (`lodash` CVE), transitive deps, license issues, outdated versions
- **Examples:** **npm audit**, Trivy, Snyk, Dependabot, OWASP Dependency-Check

**Why it matters:** most apps are 80-90% third-party code; you must track what you import.

> **Project tie-in:** I ran `npm audit` on my services. The client had vulnerabilities but all in **devDependencies** (Jest, webpack, react-scripts) — acceptable risk for non-production code.

---

### Q4. What is container image scanning?

- **Scans the built Docker image** for vulnerabilities in:
  - **Base image** layers (OS packages — Debian/Ubuntu/Alpine)
  - **Language dependencies** (npm/pip/gems)
  - **Misconfigurations** (running as root, exposed ports, secrets in image)
- **When:** after image build, before push / before deploy (gate)
- **Examples:** **Trivy**, Grype, Clair, Docker Scout, Snyk

**Levels:** OS packages (apt/yum/apk) + language packages + binary detection + IaC secrets.

---

### Q5. What is Trivy?

**Trivy** = open-source, all-in-one security scanner (Aqua Security):
- Scans **container images** for OS + language package vulnerabilities
- Scans **filesystems / git repos / IaC** (Terraform, K8s manifests) for misconfig
- Scans **Kubernetes** (live cluster), **SBOM** generation
- Uses **CVE databases** (NVD, GitHub, Red Hat, Debian)
- Fast, accurate, **zero config** — popular in CI/CD

**Typical CI usage:**
```bash
trivy image --severity HIGH,CRITICAL --exit-code 1 \
  --ignore-unfixed sahil9079/js-apiserver:v1.1.0
```
`--exit-code 1` → fails pipeline if high/critical found.

---

### Q6. What does Trivy scan?

1. **OS packages** (apk, apt, yum, alpine/debian/ubuntu) in image layers
2. **Language-specific deps:** npm, pip, gem, go, cargo, maven
3. **Binary detection** (statically linked binaries)
4. **IaC misconfigurations** (Terraform, Dockerfile, K8s YAML) — `trivy config`
5. **Secrets** in filesystem/config
6. **Kubernetes cluster** — `trivy k8s --cluster`

---

### Q7. What is a CVE?

- **CVE (Common Vulnerabilities and Exposures)** — a **public catalog** of known security vulnerabilities, each with a unique ID: `CVE-2021-44228`
- Maintained by MITRE, referenced by NVD (NIST)
- **CVE severity** via **CVSS score** (0-10):
  - 0-3.9 Low · 4-6.9 Medium · 7-8.9 High · 9-10 Critical
- **CVE record contains:** description, affected versions, fix version, CVSS, references

**Related terms:**
- **NVD** — NIST's vulnerability database built on CVEs
- **EPSS** — exploit probability score
- **CISA KEV** — known exploited vulnerabilities (highest priority)

---

### Q8. How would you handle a critical CVE?

**The critical-CVE playbook:**
1. **Assess exposure** — is the vulnerable package actually in production? Is it reachable? (e.g., `log4j` only if you use the vulnerable path)
2. **Prioritize by:** CVSS + EPSS + exploitable in your env + reachable code path
3. **Remediate fast:**
   - **Upgrade/patch** the dependency (best)
   - **Workaround** — mitigate config (disable feature, block network path)
   - **Rebuild image** with patched base image
4. **Communicate** — incident ticket, affected systems list, SLA (e.g., critical patched within 24-48h)
5. **Verify** — rescan to confirm fixed; monitor for exploit attempts
6. **Post-mortem** — why did it slip through? add it to scan gates

**If patched version unavailable:** temporary compensating control (WAF rule, network restriction) + track exception with expiry.

---

### Q9. When should security scanning run in CI/CD?

**Answer: at every stage, but with appropriate tools (shift-left).**

| Pipeline stage | Security check |
|---|---|
| **Pre-commit / PR** | Secret scan (gitleaks), `npm audit` (fast), SAST (SonarQube/ESLint) |
| **After build** | **Container image scan (Trivy)** — gate before push |
| **Before deploy** | **Policy gate** — no critical/high vulnerabilities, no misconfig |
| **After deploy / nightly** | **DAST** (ZAP on staging), dependency re-scan, cluster scan |
| **Continuous** | Dependabot alerts, monitoring, SBOM tracking |

**Golden rule:** cheap+fast scans on every PR; **expensive/deep scans as merge/nightly gates**. Block deploys on critical/high.

---

### Q10. What is the difference between SonarQube and Trivy?

| | **SonarQube** | **Trivy** |
|---|---|---|
| **Type** | **SAST** (code quality + static security) | **Container/dependency scanner** (SCA + image) |
| **Scans** | source code — bugs, smells, security hotspots, coverage | images, OS packages, language deps, IaC, K8s |
| **Focus** | code quality & maintainability + app-level vulns | dependency & infrastructure vulnerabilities |
| **Output** | quality gate (bugs, smells, coverage) | CVEs with severity, exit codes |
| **Complementary** | Yes — they find DIFFERENT things | Yes |

**Interview line:** "They're complementary. SonarQube analyzes MY code quality and app-level security patterns. Trivy scans the third-party code and base image I ship. I run both."

---

## SECTION B: Secrets Management

### Q11. How do you prevent secrets from being committed to Git?

**Layered approach:**
1. **`.gitignore`** — ignore `.env`, `.config.env`, key files (your project does this for `apiserver/.config.env`)
2. **Secret scanning tools** in CI — **gitleaks**, **trufflehog**, GitHub **secret scanning** — block PRs containing secrets
3. **Pre-commit hooks** — `pre-commit` with detect-secrets / gitleaks
4. **Centralized secret store** — Vault, AWS Secrets Manager, K8s Secrets — don't put secrets in repo at all
5. **Rotate on exposure** — if a secret ever hits git history, **rotate it immediately** (deleting from git isn't enough — history retains it)

**If secret leaked:** remove from history (filter-branch/BFG) + rotate the credential — rotation is the real fix.

---

### Q12. How do you securely manage secrets in GitHub Actions?

- **GitHub Secrets** (Settings → Secrets and variables → Actions) — encrypted at rest, masked in logs
- **Usage:** `${{ secrets.AWS_ACCESS_KEY_ID }}`
- **Repository vs Environment secrets:** use **Environment** secrets for prod (add required reviewers/approval)
- **Don't:** echo secrets, put them in `env` for whole workflow if avoidable, commit them, or print to logs
- **Best:** use **OIDC** so you don't need secrets for AWS at all (see 04-aws notes)
- **Masking:** GitHub auto-masks secret values in logs

**Rule:** never `${{ secrets.X }}` directly into a command that might log it; write to env and let the tool consume it.

---

### Q13. How do you securely manage secrets in Kubernetes?

**Layered approach:**
1. **K8s Secret** (base64) — better than plaintext env but **base64 ≠ encrypted**
2. **Encrypt at rest** — enable **KMS provider** encryption for Secrets in etcd (EKS supports this)
3. **External Secrets Operator / sealed-secrets** — store real secrets in AWS Secrets Manager/Vault, sync to K8s
4. **RBAC** — restrict who can read Secrets (least privilege)
5. **Don't** — commit Secret YAML to Git (use sealed secrets / SOPS + GitOps)
6. **IRSA** — pods get AWS permissions via service account, not embedded keys

**Best practice for GitOps:** commit **SealedSecret** (public key encrypted) to Git; controller decrypts with private key in cluster.

---

### Q14. Which security checks should block a deployment?

**Must-block (hard gates):**
- 🔴 **Critical/high CVEs** in production image (Trivy exit code)
- 🔴 **Secrets in code/image** (gitleaks)
- 🔴 **Failed SAST with critical findings** (SQLi, auth bypass)
- 🔴 **Malformed/unsigned image** or failing **supply-chain checks**
- 🔴 **IaC misconfig** with critical severity (public S3, open security group)
- 🔴 **Failed tests / quality gate** (coverage below threshold)

**Should alert but not always block:**
- 🟡 Medium/low CVEs (policy-based — can allow with exception)
- 🟡 Code smells (non-security)
- 🟡 License issues

**Policy-driven:** use a policy (OPA/Sentinel) that says "no critical/high in prod, exceptions require approval + expiry."

---

### Q15. How do you handle security exceptions in production?

**The exception lifecycle (governed, not free pass):**
1. **Formal exception request** — tool, CVE, version, why can't fix, exposure analysis
2. **Risk owner approval** — security lead/manager approves (not the dev)
3. **Set expiry** — exceptions have a **due date** (e.g., patch by next release)
4. **Compensating control** — WAF rule, network isolation, rate limit, feature flag off
5. **Track in backlog** — a ticket with due date, recurring review
6. **Re-scan on schedule** — when patch available, close exception
7. **Audit** — all exceptions logged; report monthly (who approved, how long open)

**Interview line:** "Exceptions exist but they're time-boxed, approved by the security owner, tracked in a ticket, and re-evaluated. They're never a permanent waiver."

---

## SECTION C: DevSecOps Pipeline Placement (summary diagram)

```
git push → PR
  ├── secret scan (gitleaks)          ← fast, blocks merge
  ├── npm audit / SCA quick           ← fast
  ├── SAST (SonarQube / Semgrep)      ← fast
  └── unit tests + coverage gate
        │
        ▼  merge to main
  ├── full test suite
  ├── SonarQube quality gate (full)
  ├── build image
  └── TRIVY image scan (HIGH/CRIT fail)   ← gates push/deploy
        │
        ▼  staging
  ├── deploy staging + DAST (ZAP)     ← tests running app
  └── smoke tests
        │  approval
        ▼  prod (canary)
  ├── deploy canary → monitor
  └── cluster scan (nightly) + dependency alerts (Dependabot)
```

---

*Next: [06-cheatsheet.md](06-cheatsheet.md) — the quick-revision cheat sheet.*
