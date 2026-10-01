# Kubernetes Fundamentals - Level 2: Intermediate

## 1. Production Deployment Manifest with Probes & Limits
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-api
  namespace: production
  labels:
    app: nodejs-api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: nodejs-api
  template:
    metadata:
      labels:
        app: nodejs-api
    spec:
      containers:
      - name: api
        image: 123456789012.dkr.ecr.us-east-1.amazonaws.com/api:v1.2.0
        ports:
        - containerPort: 3000
        resources:
          requests:
            cpu: "250m"
            memory: "256Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 10
        envFrom:
        - configMapRef:
            name: api-config
        - secretRef:
            name: api-secrets
```
