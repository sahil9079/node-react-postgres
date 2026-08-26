# Level 2: CI/CD Quality Gates & DevSecOps Implementation

> **Experience Target:** 2-Year Mid-Level DevOps Engineer  
> **Topic Scope:** Coverage threshold enforcement, SonarQube quality gates, Trivy container security scans, npm audit vulnerability management, and immutable image tagging.

---

## 1. Automated Test Quality Gates (Jest Thresholds)

In [`apiserver/jest.config.js`](file:///d:/javascript_project/node-react-postgres/apiserver/jest.config.js), we enforce strict coverage thresholds:

```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
}
```

* **How it Enforces Quality:**
  * When GitHub Actions executes `npm test -- --coverage`, Jest analyzes statement, branch, and function execution paths.
  * If a developer writes a new controller or route without unit tests that drops coverage below 50%, Jest exits with code `1`.
  * GitHub Actions fails the `testing` job, automatically preventing image building and deployment.

---

## 2. Static Code Analysis (SonarQube & SonarCloud)

In [`sonar-project.properties`](file:///d:/javascript_project/node-react-postgres/sonar-project.properties):
```properties
sonar.projectKey=FullStack-DevOps-Pipeline
sonar.projectName=FullStack DevOps Pipeline
sonar.sources=apiserver,client/src
sonar.tests=apiserver/__tests__,client/src/__tests__
sonar.javascript.lcov.reportPaths=client/coverage/lcov.info,apiserver/coverage/lcov.info
sonar.exclusions=**/node_modules/**,**/build/**,**/coverage/**
```

* **SonarQube Quality Gate Metrics:**
  * **Bugs & Code Smells:** Identifies memory leaks, unhandled async promise rejections, and unused variables.
  * **Security Hotspots:** Highlights insecure hashing algorithms, unescaped SQL queries, or hardcoded credentials.
  * **Duplication:** Flags copy-pasted blocks exceeding threshold limits.

---

## 3. Vulnerability Scanning (Trivy & `npm audit`)

In [`.github/workflows/main.yaml`](file:///d:/javascript_project/node-react-postgres/.github/workflows/main.yaml#L48-L90):
* **`npm audit`:** Scans `package-lock.json` against the National Vulnerability Database (NVD) for known CVEs in third-party JavaScript packages.
* **Aqua Security Trivy (`aquasecurity/trivy-action`):**
  * Performs vulnerability scanning on container base images and filesystem dependencies.
  * Detects OS-level vulnerabilities (e.g. OpenSSL, glibc CVEs in Debian/Alpine base layers) and application package CVEs.

---

## 4. Container Image Versioning & Immutability

### Q1. Why is tagging container images with `latest` forbidden in production?
1. **Lack of Traceability:** If production fails, there is no way to map image `latest` back to the exact Git commit that introduced the bug.
2. **Kubernetes Caching Bugs:** Kubernetes defaults to `imagePullPolicy: IfNotPresent` for tags. If a new image is pushed as `latest`, worker nodes with a previously cached `latest` layer will not pull the updated code.
3. **Rollback Ambiguity:** You cannot easily rollback to `latest~1`. Using Semantic Versions (`v1.1.0`) or Git Commit SHAs (`sha-9a3b8c`) allows instant, deterministic rollbacks:
   ```bash
   kubectl set image deployment/apiserver apiserver=sahil9079/js-apiserver:sha-9a3b8c -n node-react-app
   ```
