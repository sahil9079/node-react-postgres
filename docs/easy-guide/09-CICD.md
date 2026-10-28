# 09 — CI/CD in Simple Words

Folder: `.github/workflows/`

## 1. CI and CD

| Term | Simple meaning |
| :--- | :--- |
| **CI** (Continuous Integration) | Every change is tested automatically |
| **CD** (Continuous Delivery/Deployment) | Every good change can be shipped automatically |
| **Pipeline** | The whole chain: test -> scan -> build -> deploy |

## 2. The two workflows

| File | Trigger | Job |
| :--- | :--- | :--- |
| `main.yaml` | push/PR to `main`, manual | Test, coverage, Sonar, audit, Trivy, build |
| `deploy-lab.yml` | manual button | OIDC to AWS, push ECR, deploy EKS, rollback |

## 3. CI step by step

```
1. Checkout code
2. Install Node 18
3. npm ci (exact dependencies)
4. npm test -- --coverage
5. Upload coverage files
6. SonarQube analysis (code quality)
7. npm audit (dependency vulnerabilities)
8. Trivy filesystem scan (vulns + secrets + misconfig)
9. docker build API + client
10. Trivy image scan
11. Upload reports
```

The `testing` job runs **twice in parallel** using a matrix:

```yaml
strategy:
  matrix:
    service: [apiserver, client]
```

One job for the backend, one for the frontend. Same steps, different folder.

## 4. What each gate means

| Gate | Checks | Fails the build? |
| :--- | :--- | :--- |
| Jest tests | Does the code work? | Yes, if a test fails |
| Coverage 50% | Are enough lines tested? | Yes, below 50% |
| SonarQube | Bugs, smells, duplication | Only if the quality gate is configured to fail |
| `npm audit` | Known bad packages | **No** (`|| true`) |
| Trivy fs | Vulnerabilities, secrets, misconfig | **No** (`exit-code: 0`) |
| Trivy image | CVEs in the image | **No** (`exit-code: 0`) |

**Senior lesson:** a scan that never fails is a report, not a gate. Start with `0` to see findings, then change to `1` for `CRITICAL`.

## 5. CD step by step

```
1. You click "Run workflow" and choose lab or production
2. GitHub gives the job a short-lived OIDC token
3. AWS STS verifies it and returns temporary credentials
4. Docker build API + client
5. Tag with the Git commit SHA (not "latest")
6. Push to ECR
7. aws eks update-kubeconfig
8. kubectl apply -k k8s/overlays/<env>
9. kubectl set image ... :<sha>
10. kubectl rollout status (wait up to 180s)
11. If it fails -> kubectl rollout undo -> exit 1
```

## 6. Why tag with the commit SHA?

```
skills-apiserver:9f3c2a1
```

You can answer: "Which code is running in production?" — commit `9f3c2a1`.

`latest` cannot answer that. ECR is also set to **immutable**, so a tag cannot be silently replaced.

## 7. Why OIDC instead of AWS keys?

| Access keys | OIDC |
| :--- | :--- |
| Long-lived | Minutes |
| Must be rotated | Automatic |
| Can leak forever | Expire quickly |
| Stored in GitHub secrets | No long-lived secret |

Required permission in the workflow:

```yaml
permissions:
  id-token: write
```

Without it, OIDC cannot work.

## 8. Rollback

```bash
kubectl rollout status deployment/apiserver -n node-react-app
kubectl rollout history deployment/apiserver -n node-react-app
kubectl rollout undo deployment/apiserver -n node-react-app
```

The Deployment keeps 5 old versions (`revisionHistoryLimit: 5`), so rollback is possible.

## 9. How to run CI locally

```bash
# backend
cd apiserver
npm ci
npm run test:coverage

# frontend
cd ../client
npm ci
npm run test:coverage

# images
docker build -t skills-apiserver:ci ./apiserver
docker build -t skills-client:ci ./client

# security scan (Docker required)
docker run --rm -v "$PWD:/work" aquasec/trivy:latest fs --scanners vuln,secret,misconfig /work
```

## 10. What is missing (good improvements)

1. A real smoke test after deploy (`scripts/smoke-test.sh`).
2. `exit-code: 1` for critical vulnerabilities.
3. `concurrency` so two deploys cannot race.
4. Pin third-party actions by commit SHA.
5. Generate an SBOM.
6. Add a `production` environment approval rule.
7. Cache Docker layers in CI.

## 11. CI/CD checklist

- [ ] I can explain CI vs CD.
- [ ] I can list the CI steps in order.
- [ ] I can explain matrix builds.
- [ ] I can explain OIDC and `id-token: write`.
- [ ] I can explain SHA tags and rollback.
