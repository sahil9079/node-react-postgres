# 01. CI/CD & Continuous Integration — Detailed Notes

> Answer framework for every question: **What → Why → When/How**. Use your project as evidence.

---

## SECTION A: Pipeline Strategy

### Q1. How do you decide what runs on every PR vs after merging to main?

**Core principle: PR = fast feedback, merge = safety, nightly = depth.**

| Pipeline | Trigger | What runs | Goal |
|---|---|---|---|
| **PR** | every push to a branch with open PR | fast checks | catch problems early, quick loop (<5-10 min) |
| **Merge/main** | merged to main | full pipeline + deploy | deliver safely |
| **Nightly** | cron schedule | deep/expensive checks | catch slow issues, cache warm, report drift |

**Decision criteria:**
- **Speed vs coverage tradeoff:** PR runs only what needs to change fast — lint, unit tests, targeted build
- **Cost:** don't run E2E/load/scan on every PR (slow, costly, flaky)
- **Trust level:** main is closer to production → more gates
- **Failure cost:** if a failure blocks merge vs just reported

**Example answer:**
> On every PR I run lint, unit tests, and a build to give fast feedback. After merging to main, I run the full pipeline — all tests, SonarQube, security scans, Docker build, and deployment to staging. Nightly I run expensive jobs like full E2E, dependency scanning, and Trivy so they don't slow the PR loop.

---

### Q2. Which checks would you run on every PR?

- ✅ **Lint / formatting** (fast, catches style bugs) — e.g., ESLint, Prettier
- ✅ **Unit tests** (fast, isolated, high signal)
- ✅ **Build/compile** (does the code even build?)
- ✅ **Targeted integration tests** (affected services)
- ✅ **Dependency security quick scan** (`npm audit`, `pip-audit`) — fast fail on critical
- ✅ **Secret scanning** (gitleaks) — never let secrets merge

**NOT on PR (unless small project):** full E2E suite, load tests, full container image scan, SonarQube full report (can be a lightweight variant).

---

### Q3. Which checks run only after merging to main?

- 🔴 **Full test suite** (all unit + integration + E2E)
- 🔴 **SonarQube full analysis + quality gate** (needs coverage reports)
- 🔴 **SAST / DAST / container image scanning (Trivy)** — expensive
- 🔴 **Docker image build + push** to registry
- 🔴 **Deployment to staging/production**
- 🔴 **Contract/regression suite**
- 🔴 **Benchmarks/performance tests**

---

### Q4. Which checks on a nightly schedule?

- 🌙 **Full E2E suite** (long, flaky-prone, don't block PRs)
- 🌙 **Dependency vulnerability scans** (npm audit, pip, OSV)
- 🌙 **Full image scanning** (Trivy, Grype) on latest images
- 🌙 **Drift detection** (Terraform plan, compare staging vs prod)
- 🌙 **Performance/load tests** (k6) — report trends
- 🌙 **License compliance checks**
- 🌙 **Cache warming / image rebuilds** to catch base-image changes
- 🌙 **Test trend/report generation** (flaky detection across time)

**Why nightly?** They're slow/expensive/flaky and don't need immediate feedback. Run them off the critical path; still alert on failure.

---

### Q5. How do you keep CI fast while maintaining security and quality?

**The speed levers:**
1. **Caching** — dependency caches (`actions/cache`, npm/yarn/pip cache), Docker layer caching
2. **Parallelization** — matrix builds, split test shards across runners
3. **Incremental builds** — only build/test what changed (path filters, affected modules)
4. **Better runners** — larger instance types, more cores for CPU-heavy jobs
5. **Dependency caching** — lockfile-based `npm ci` vs reinstall
6. **Test sharding** — split test suite across N parallel runners
7. **Fail fast** — fail the job the moment something breaks, cancel matrix on first failure

**Keeping security/quality (don't cut corners, cut waste):**
- Run **cheap** security checks (secret scan, audit) on PRs; **deep** checks (SAST, Trivy) on merge/nightly
- Use **cached/trusted** base images (pinned tags, not `latest`)
- **Quality gates on merge**, fast checks on PR — same coverage, just staged
- Measure: track CI duration per PR as a metric; alert when it regresses

---

### Q6. How do you enforce quality gates in CI?

**Definition:** A **quality gate** is an automated, binary pass/fail checkpoint in the pipeline. Failure = stop.

**Mechanisms:**
- Pipeline step exits **non-zero** → job fails → downstream stages blocked
- **GitHub:** `required status checks` on protected branches → merge blocked if check fails
- **GitLab:** pipeline stages with `when: on_success`
- **SonarQube:** Quality Gate evaluated by scanner → API response → fail pipeline
- **Coverage:** CI runs `jest --coverage` → threshold check → fail if below

**Types of gates:** tests pass · coverage % · lint clean · build success · security scan clean · SonarQube gate · manual approval (staging→prod)

---

### Q7. How do you block a merge when tests fail?

**GitHub branch protection (the standard answer):**
1. **Branch Protection Rule** on `main`
2. Require **1+ pull request reviews** (optional)
3. **Require status checks to pass** → select required CI checks (e.g., "unit-tests", "lint", "build")
4. **Require branches to be up to date** before merging
5. **Require conversation resolution**
6. **Restrict who can push** (only CI bot / admins)
7. **Require signed commits** (optional, higher security)

**Result:** The **only** way code reaches `main` is through a PR whose required checks all pass. CI writes a "check" via GitHub Checks API; protection refuses merge while any is pending/failed.

---

### Q8. How do you enforce code coverage thresholds?

- **Tool-level (works everywhere):** `jest --coverage --coverageThreshold='{"global":{"lines":80}}'` or `jest.config.js`
  ```js
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 }
  }
  ```
- **Behavior:** Jest exits **non-zero** when below threshold → CI job fails → merge blocked
- **Per-file option:** `"./src/utils/**": { lines: 90 }` for critical paths
- **Enforce in CI:** the `npm run test:coverage` step is a required status check
- **Per-test-server caveat:** C8/Istanbul merge reports; ensure config is consistent

> **Project tie-in:** Your config uses 50% thresholds across branches/functions/lines/statements — a good baseline; you can say you'd raise it for critical modules.

---

### Q9. How do you enforce SonarQube quality gates?

**The flow:**
1. **SonarQube server** defines a **Quality Gate** (default: "Sonar way" — bugs=0, no new blockers, coverage on new code, duplicated code %)
2. **CI runs scanner** → analyzes code → uploads to server
3. Server evaluates gate → returns status via API
4. Scanner exits **non-zero** if gate fails → CI fails → merge blocked
5. `sonar.qualitygate.wait=true` → CI waits for analysis completion

**Config essentials:**
```properties
sonar.projectKey=...
sonar.sources=apiserver,client/src
sonar.tests=apiserver/__tests__,client/src/__tests__
sonar.javascript.lcov.reportPaths=client/coverage/lcov.info,apiserver/coverage/lcov.info
sonar.test.inclusions=**/*.test.js
```

**Custom gates:** add rules like "coverage on new code ≥ 80%", "no new critical issues", "no security hotspots open".

---

### Q10. Who should be allowed to override a failed quality gate?

**Principle: rare, audited, least-privilege.**

- ✅ **Approvers:** senior/lead engineers, engineering manager, DevOps/platform owner (2-person rule for serious gates)
- ❌ **Not:** individual developers overriding their own PR; not anonymous; not automated
- **Risk-based:** trivial infra changes might allow tech lead override; prod-critical code requires a more senior approver
- **Documented policy:** who can override WHAT and WHEN (e.g., "security gate overrides need security lead + CTO")

---

### Q11. How do you audit quality-gate overrides?

1. **Log every override** — who, when, which gate, why (ticket/issue ref)
2. **CI writes override audit trail** (SLACK message + a ticket + a log)
3. **Report periodically** — monthly dashboard: overrides by person, by gate
4. **Retroactively verify** — "overridden scans get re-run; issues tracked as debt"
5. **Tooling:** GitHub audit logs, git history on `README`/approval docs, ADO audit streams
6. **Alert on abuse** — someone overriding repeatedly → investigation

---

### Q12. What would you do if a required CI check is flaky?

**Definition:** a check that fails intermittently for non-code reasons.

**Immediate steps:**
1. **Triage & quarantine** — identify the flaky test (repeat run), document
2. **Remove from required list** temporarily → unblock developers
3. **File a tracking bug** — treat flaky tests as P1 bugs

**Long-term fix:**
4. **Run repeatedly** locally/CI to reproduce (`--repeat 20`, `--detectOpenHandles`)
5. **Find root cause:** timing (race conditions, async), environment (ports, resources), order dependence, shared state, network
6. **Fix properly:** mock external calls, use `await`/`flush`, add retries ONLY for infra flakiness, isolate shared state
7. **Re-add to required checks only when stable** (e.g., 10 consecutive green runs)
8. **Monitoring:** track flaky rate; alert if > threshold

> **Anti-patterns:** blanket retry to hide flakiness, or ignoring it forever.

---

### Q13. How do you identify and fix flaky tests?

**Identify:**
- CI **flaky-test report** (GitHub's repeat-run feature, GitLab flaky suite)
- Run suite N times, compare pass/fail across runs
- **Quarantine server** — tests tagged `@flaky` run in isolation
- Timeouts, `--maxWorkers`, `--forceExit` symptoms

**Fix — the causes:**
| Cause | Fix |
|---|---|
| Race condition / async not awaited | proper `await`, polling, `waitFor` |
| Shared mutable state / test order | reset state in `beforeEach`, isolate DB |
| External API dependency | mock/stub, use test server |
| Time/date dependence | inject clock (`fake timers`) |
| Port/resource collision | unique ports, parallel-safe setup |
| Real network calls | block + mock |
| DB shared between tests | transactional rollback, unique data |

---

### Q14. What would you do if SonarQube was unavailable?

1. **Detect** — scanner fails to connect (health check, status endpoint)
2. **Decide severity:** is this a hard requirement for prod? 
3. **Fail the pipeline** for critical changes (security/quality) — do NOT silently skip
4. **OR allow controlled skip** with:
   - **manual approval / break-glass flag** (recorded override)
   - **re-queue** the analysis to run when Sonar returns (nightly catch-up)
   - **degraded gate:** run a local fallback linter (ESLint/coverage only) as compensation
5. **Restore:** bring Sonar back (check container/volume), re-run missed analysis, log the incident
6. **Prevention:** run Sonar in HA / persistent volume, health checks, backup

> **Answer:** "I would not silently skip a quality gate. I'd either fail-fast and block, or do a documented break-glass override with a compensating check and re-run analysis once SonarQube recovers."

---

### Q15. What would you do if Trivy was unavailable?

Same playbook as SonarQube (section Q14):
1. Check is it a hard block? Usually container-scan failure = **block image push**
2. Options: retry, use an alternate scanner (**Grype, Snyk, Anchore, Docker Scout**), or manual review + documented exception
3. If Trivy is your only tool and it's down → block push OR fall back to `docker scan` + `npm audit` as compensating controls
4. **Re-scan later** once Trivy returns; track as debt
5. **Prevention:** version-pin Trivy, use Trivy in a separate runner, cache DB

---

### Q16. What compensating controls would you use when a CI security tool is unavailable?

- **Manual review** by security/lead (documented, logged)
- **Alternate tool** (Grype/Snyk instead of Trivy; ESLint instead of SonarQube)
- **Static gates:** coverage threshold, lint, secret scan still enforced
- **Scoped blast radius:** deploy to staging only, not prod
- **Defer with tracking:** scan queued, run when tool returns, alert if overdue
- **Rate-limit deploy velocity** — smaller changes only while scanning is degraded
- **Audit everything** — every compensating control is recorded for later verification

---

### Q17. How would you unblock a production deployment without bypassing governance?

**Key: unblock ≠ bypass. Keep the paper trail.**

1. **Assess:** is the blockage (test fail, gate fail, scan fail) actually a blocker for THIS change?
2. **Documented override** with ticket + approval (not silent skip)
3. **Compensating control** (see Q16): manual verification, alternate scan, run subset
4. **Deploy with guardrails:** feature flags (deploy dark), canary 1% → 10% → 100%, instant rollback ready
5. **Deferred enforcement:** re-run full checks post-deploy; track "debt items" with due date
6. **Audit log** everything
7. **Post-incident review** — why was governance blocking? fix the underlying issue

---

### Q18. What is a break-glass procedure in CI/CD?

**Definition:** a **documented, audited, emergency procedure** to bypass normal safeguards (gates) when the system is down or there's an urgent issue — like breaking glass on a fire alarm.

**Key elements:**
- **Trigger conditions** defined (only for specific emergencies)
- **Who** can break glass (limited, senior)
- **What** they do (a flag, a script, an approval)
- **What they must do after** (raise ticket, log, restore within TTL)
- **Audit trail** — all breaks are logged and reviewed
- **Auto-revert** — break-glass access expires; system returns to normal state

**Example:** production outage + CI is down + critical fix needed. Dev runs an approved override, deploys manually, then CI is restored and full checks run retroactively.

---

### Q19. How would you safely handle an emergency deployment?

**The 6 rules of emergency deploys:**
1. **Feature flag / rollback first** — can you disable the bug without deploying? (flag off)
2. **Pre-built artifacts** — use an image that already passed some checks (staging-tested)
3. **Minimal change** — one commit, one fix, no unrelated changes
4. **Canary / blue-green** — deploy to a small slice, monitor, expand
5. **Rollback plan ready** — know the exact command/image to revert
6. **Post-incident** — follow up with full CI/security checks, root-cause analysis, and the "why wasn't this caught earlier" review

> **Break-glass + emergency deploy go together:** emergency deploy may skip some gates BUT always keeps: rollback path, monitoring, and a full post-deploy audit.

---

## SECTION B: Branch Protection & Merge Control

### Q20. How do you implement branch protection?

**GitHub (typical):**
```yaml
# .github/branch-protection or UI settings
- Require pull request reviews (1-2)
- Require status checks (CI checks listed)
- Require branches up-to-date
- Require conversation resolution
- Restrict push access (only admins/CI bot)
- Require signed commits (optional)
- Do not allow bypassing the above settings (tick this!)
```
**Key:** set these in **settings (protected branches)** OR managed as **code** via REST API / `gh api` (GitOps-able).

---

### Q21. How do you prevent direct pushes to main?

- **Branch protection rule** → "Restrict who can push" → only CI bot + admins; devs cannot push
- **Admin overrides disabled** ("do not allow bypassing")
- **Repository settings** → block force pushes on protected branches
- **Git hooks / server-side** pre-receive hook rejecting non-PR commits to main
- **Enforce via pipeline:** merge queue

**Result:** the only way code lands on main is a **PR merged after passing checks**.

---

### Q22. How do you configure required status checks?

1. CI must **report checks** — GitHub Actions automatically creates check runs for each job
2. In branch protection → **"Require status checks to pass before merging"** → add the check names
3. Optionally **"Require branches to be up to date"** → blocks merging a stale branch
4. Once set, a PR with a failed/missing required check **cannot merge**

**Naming:** use stable, unique job names (e.g., `test-unit`, `test-integration`, `sonar-analysis`) so protection rules match.

---

### Q23. How do you handle failed deployment pipelines?

1. **Stop** — don't advance to next stage (gates block automatically)
2. **Triage** — read logs, find the stage (build vs test vs deploy)
3. **Classify** — transient (network) vs code issue vs infra issue
4. **Fix & retry** — push fix, rerun; or rerun transient jobs
5. **Rollback if already partially deployed** — revert image / `kubectl rollout undo`
6. **Alert & notify** — Slack/PagerDuty with logs
7. **Retrospective** — why did it fail, add a gate to prevent recurrence

---

### Q24. How do you implement rollback in a CI/CD pipeline?

**Rollback = redeploy the last-known-good artifact.**

| Approach | Mechanism | Speed |
|---|---|---|
| **Image rollback** | redeploy previous image tag (`kubectl set image dep/app app=app:v1.0.0`) | minutes |
| **K8s native** | `kubectl rollout undo deployment/app` (goes back to previous revision) | fast |
| **Git revert + redeploy** | revert commit → pipeline redeploys | slow but clean |
| **Blue/green** | flip LB back to blue (old) | seconds |
| **Canary** | shift traffic back | seconds |

**Design for rollback:**
- Keep old images in registry (don't overwrite tags)
- **Immutable tags** (`v1.2.3`, git SHA) — never reuse `latest` for prod
- Automated rollback on **health check failure** after deploy
- **Rollback = also roll back DB migrations** carefully (backward-compatible migrations help)

---

### Q25. How do you promote an application from PR → staging → production?

**The promotion flow:**
```
[PR] ── checks pass ──► [merge to main] ──► [build artifact: image tag = git SHA]
                                              │
                                              ▼
                                        [staging deploy]
                                              │  smoke tests pass + manual approval
                                              ▼
                                        [production deploy]
                                              │  canary → rollout
                                              ▼
                                             [monitor]
```
**Key practices:**
- **One artifact** — build once, promote the SAME image (no rebuild per env) → "build once, run anywhere"
- **Immutable tags:** image `app:abc123` goes staging → prod
- **Config per env** — code same, config (ConfigMap/Secret/env) differs
- **Promotion approval** — human gate staging→prod (esp. for regulated)
- **Audit trail** — record which build went to which env when

---

## SECTION C: Scenario Questions (quick reference)

| Scenario | Immediate action |
|---|---|
| Flaky required check | Quarantine + document + track, unblock, fix root cause, re-enable |
| SonarQube down | Fail-fast OR documented break-glass + compensating control + re-run later |
| Trivy down | Block image push OR alternate scanner (Grype/Snyk) + documented exception |
| Prod deploy blocked by gate | Documented override + feature flag/canary + post-deploy full check |
| Emergency outage | Feature flag off first → minimal change → canary → rollback ready |
| Two engineers apply Terraform | State locking (DynamoDB) blocks second apply — covered in Terraform notes |

---

*Next: [02-terraform.md](02-terraform.md) — Terraform / Infrastructure as Code.*
