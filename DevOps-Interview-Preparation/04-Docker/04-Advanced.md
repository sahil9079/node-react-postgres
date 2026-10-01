# Docker Fundamentals - Level 3: Advanced

## 1. Multi-Stage Builds & Image Optimization
Multi-stage builds separate compile-time build tools (compilers, npm devDependencies) from runtime artifacts.

```dockerfile
# Stage 1: Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Distroless / Alpine Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Security: Run as non-root user
USER node
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder --chown=node:node /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

## 2. Docker Image Layer Caching Optimization
* Docker caches each layer. If a layer changes, all subsequent layers must be rebuilt.
* **Best Practice:** Copy `package.json` / `pom.xml` and install dependencies **BEFORE** copying source code. Source code changes frequently, dependencies change rarely.
