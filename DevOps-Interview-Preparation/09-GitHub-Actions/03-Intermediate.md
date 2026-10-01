# GitHub Actions - Level 2: Intermediate
## 1. Production Workflow with AWS OIDC & DevSecOps
```yaml
name: Node.js EKS Production CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

permissions:
  id-token: write   # Required for AWS OIDC authentication
  contents: read

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run Unit Tests
        run: npm test -- --coverage

      - name: SonarQube Scan
        uses: sonarsource/sonarqube-scan-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}

  security-scan:
    needs: build-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker Image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Run Trivy Vulnerability Scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'myapp:${{ github.sha }}'
          format: 'table'
          exit-code: '1'
          ignore-unfixed: true
          vuln-type: 'os,library'
          severity: 'CRITICAL,HIGH'

  deploy-eks:
    needs: security-scan
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS Credentials (OIDC - Zero Keys!)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-actions-eks-deploy-role
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Push to ECR & Deploy to EKS
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          docker tag myapp:${{ github.sha }} $ECR_REGISTRY/nodejs-api:${{ github.sha }}
          docker push $ECR_REGISTRY/nodejs-api:${{ github.sha }}
          aws eks update-kubeconfig --name production-cluster --region us-east-1
          kubectl set image deployment/nodejs-api api=$ECR_REGISTRY/nodejs-api:${{ github.sha }} -n production
          kubectl rollout status deployment/nodejs-api -n production --timeout=120s
```
