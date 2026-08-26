# Level 1: CI/CD Pipeline Fundamentals (GitHub Actions)

> **Experience Target:** 1-Year Junior/Associate DevOps Engineer  
> **Topic Scope:** CI vs CD definitions, GitHub Actions workflow anatomy, triggers, matrix strategies, Quality Gates, and artifact management.

---

## 1. Core CI/CD Concepts

### Q1. What is the difference between Continuous Integration (CI) and Continuous Deployment (CD)?
* **Continuous Integration (CI):** The practice where developers frequently commit code to a shared repository (Git). On every commit or Pull Request, automated pipelines build the application, run unit/integration tests, and perform static security scans to detect bugs early.
* **Continuous Delivery / Deployment (CD):** 
  * **Continuous Delivery:** Automated packaging and deployment of validated artifacts to staging/pre-production environments, requiring manual approval for production release.
  * **Continuous Deployment:** Every change that passes all CI stages and quality gates is automatically deployed to live production without human intervention.

---

## 2. Walkthrough: Your GitHub Actions Pipeline

Your workflow file is located at [`.github/workflows/main.yaml`](file:///d:/javascript_project/node-react-postgres/.github/workflows/main.yaml):

```yaml
name: deploy workflow

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read

jobs:
    testing:
      runs-on: ubuntu-latest
      strategy:
        matrix:
          service: [apiserver, client]
      steps:
        - name: checkout code
          uses: actions/checkout@v3
          with:
            fetch-depth: 0
          
        - name: unit testing
          uses: actions/setup-node@v4
        - run: npm ci
          working-directory: ${{ matrix.service }}
        - run: npm test -- --coverage
          working-directory: ${{ matrix.service }}

    sonarqube:
      needs: testing
      runs-on: ubuntu-latest
      steps:
        - name: checkout code
          uses: actions/checkout@v3
          with:
            fetch-depth: 0

        - name: SonarCloud Scan
          uses: SonarSource/sonarqube-scan-action@v5.2.0
          env:
            SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
            GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

    security:
      needs: testing
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4

        - name: Run npm audit for API Server
          run: |
            cd apiserver
            npm audit --json > npm-audit-apiserver.json || true

        - name: Run npm audit for Client
          run: |
           cd client
           npm audit --json > npm-audit-client.json || true
           
        - name: Upload npm Audit Reports
          uses: actions/upload-artifact@v4
          with:
            name: npm-audit-reports
            path: |
              apiserver/npm-audit-apiserver.json
              client/npm-audit-client.json

        - name: Run Trivy Security Scan
          uses: aquasecurity/trivy-action@v0.36.0
          with:
            scan-type: fs
            path: .
            format: json
            exit-code: 0
            vulnerability-type: os,library
            output: trivy-report.json
        
        - name: Upload Trivy scan results as Artifact
          uses: actions/upload-artifact@v4
          with:
            name: trivy-scan-results
            path: trivy-report.json
```

---

### Q2. Explain the key directives in your pipeline:
1. **`on: push: branches: [main]` & `workflow_dispatch`:** Triggers the pipeline automatically when code is pushed to `main`, or allows manual execution via GitHub UI.
2. **`strategy: matrix: service: [apiserver, client]`:** Runs the `testing` job concurrently across two parallel runner instances, cutting test execution time in half.
3. **`needs: testing`:** Ensures `sonarqube` and `security` jobs will not execute if any Jest unit or integration test fails.
4. **`upload-artifact@v4`:** Packages scan outputs (`npm-audit-reports`, `trivy-scan-results`) into downloadable zip archives accessible in the GitHub Actions summary.
