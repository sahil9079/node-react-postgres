# Level 1: Docker & Container Fundamentals

> **Experience Target:** 1-Year Junior/Associate DevOps Engineer  
> **Topic Scope:** Docker vs Virtual Machines, Image vs Container, Dockerfile line-by-line breakdown, Layer caching, Non-root user hardening, Docker Compose, and Container CLI operations.

---

## 1. Containers vs. Virtual Machines

### Q1. What is Docker and how does a container differ from a Virtual Machine?
* **Virtual Machine (VM):**
  * Runs a full guest operating system (Kernel + OS libraries + App) on top of a Hypervisor (Type 1 or Type 2).
  * Heavyweight (Gigabytes in size), takes minutes to boot, requires dedicated virtual CPU and RAM allocation.
* **Docker Container:**
  * Packages only application binaries and dependencies.
  * Runs as an isolated process directly on the host operating system, sharing the host Linux kernel.
  * Achieves isolation using Linux kernel primitives:
    * **Namespaces:** Isolates Process IDs (`pid`), Network (`net`), Mounts (`mnt`), Inter-process communication (`ipc`), and User IDs (`user`).
    * **Control Groups (`cgroups`):** Enforces resource limits on CPU, Memory, and Disk I/O.
  * Lightweight (Megabytes in size), boots in milliseconds, uses host RAM dynamically.

---

## 2. Deep Dive: Your Project Dockerfiles

### Q1. Walk me line-by-line through your `apiserver/Dockerfile`.
```dockerfile
1: FROM node:18-slim
2: WORKDIR /app
3: COPY package*.json ./
4: RUN npm ci
5: COPY . .
6: USER node
7: EXPOSE 8010
8: CMD ["node", "index.js"]
```

* **Line 1 (`FROM node:18-slim`):** Specifies the base image. `node:18-slim` is based on minimal Debian Linux. It contains Node.js 18 and standard `glibc` libraries needed by native dependencies like `bcryptjs` and `sharp` without bloating the image with unnecessary build utilities.
* **Line 2 (`WORKDIR /app`):** Sets `/app` as the current working directory for all following instructions (`COPY`, `RUN`, `CMD`).
* **Line 3 (`COPY package*.json ./`):** Copies `package.json` and `package-lock.json` into `/app` **before copying the rest of the application code**.
* **Line 4 (`RUN npm ci`):** Runs a clean install strictly based on `package-lock.json`. Because lines 3–4 are placed before line 5, Docker caches this layer. If you only modify code in `index.js`, Docker skips re-running `npm ci`, saving minutes during builds.
* **Line 5 (`COPY . .`):** Copies all project files into `/app` (excluding files specified in `.dockerignore` like `node_modules` and `.config.env`).
* **Line 6 (`USER node`):** Switches execution privilege from `root` to the pre-created non-privileged user `node` (UID 1000). If a security vulnerability (RCE) is exploited in Express, the attacker cannot modify root system files inside the container.
* **Line 7 (`EXPOSE 8010`):** Documents that the Express server listens on port 8010.
* **Line 8 (`CMD ["node", "index.js"]`):** Defines the container runtime command in **exec form** (`["binary", "arg"]`). In exec form, Node.js runs as PID 1, allowing it to receive OS signals directly (`SIGTERM` for graceful shutdown).

---

### Q2. Walk me line-by-line through your multi-stage `client/Dockerfile`.
```dockerfile
1:  FROM node:18-bullseye-slim AS Builder
2:  WORKDIR /app
3:  COPY package*.json ./
4:  RUN npm ci 
5:  COPY . .
6:  RUN npm run build
7: 
8:  FROM nginx:1.29-alpine
9:  COPY --from=Builder /app/build /usr/share/nginx/html
10: RUN rm -rf /etc/nginx/conf.d/default.conf
11: COPY nginx.conf /etc/nginx/conf.d/default.conf
12: EXPOSE 80
13: CMD ["nginx", "-g", "daemon off;"]
```

* **Stage 1 (Builder - Lines 1–6):** Uses a complete Node.js environment to run React build scripts (`npm run build`). This creates the production bundle inside `/app/build`.
* **Stage 2 (Runtime - Lines 8–13):** Starts with an ultra-lightweight `nginx:1.29-alpine` image.
* **Line 9 (`COPY --from=Builder /app/build /usr/share/nginx/html`):** Copies *only* the compiled HTML, CSS, and JS files from the `Builder` stage into Nginx's document root.
* **Lines 10–11:** Replaces the default Nginx configuration with our custom [`client/nginx.conf`](file:///d:/javascript_project/node-react-postgres/client/nginx.conf) to support React client-side routing and `/api/` reverse-proxying.
* **Line 13 (`CMD ["nginx", "-g", "daemon off;"]`):** Runs Nginx in the foreground so the container does not exit.
* **Why Multi-Stage?**
  * **Size:** Drops the final image from **~1.2 GB (with Node & build tools)** down to **~23 MB**.
  * **Security:** Development packages, npm cache, and build tools are completely discarded and never deployed to production.

---

## 3. Docker Compose Orchestration

### Q1. How does your `docker-compose.yaml` work and how does it prevent race conditions?
```yaml
version: '3.8'

services:
   db:
      image: postgres:15-alpine
      restart: always
      ports:
         - "5432:5432"
      environment:
         POSTGRES_PASSWORD: mypassword
         POSTGRES_USER: postgres
         POSTGRES_DB: sampledb
      volumes:
         - dbdata:/var/lib/postgresql/data
      healthcheck:
        test: ["CMD-SHELL", "pg_isready -U postgres -d sampledb"]
        interval: 10s
        timeout: 5s
        retries: 5

   apiserver:
      build: ./apiserver
      env_file: ./apiserver/.config.env
      image: sahil9079/js-apiserver:v1.1.0
      ports:
         - "8010:8010"
      depends_on:
         db:
            condition: service_healthy

   client:
      build: ./client
      image: sahil9079/js-client:v1.1.0
      ports:
         - "80:80"
      depends_on:
         - apiserver

volumes:
   dbdata: {}
```

* **Healthcheck & Startup Order:**
  * In standard Docker Compose, `depends_on: [db]` only waits for the database container to *start*, not for PostgreSQL to be ready to accept connections.
  * In our setup, we defined a `healthcheck` using `pg_isready -U postgres -d sampledb`.
  * `apiserver` uses `condition: service_healthy`, guaranteeing that the Express API will not boot until PostgreSQL is fully initialized and listening on port 5432.
* **Volume Persistence:**
  * `dbdata:/var/lib/postgresql/data` maps PostgreSQL database files to a Docker named volume so data persists across `docker-compose down` and `docker-compose up` cycles.

---

## 4. Essential Docker CLI Commands

```bash
docker build -t sahil9079/js-apiserver:v1.1.0 ./apiserver   # Build image with tag
docker run -d -p 8010:8010 --name api sahil9079/js-apiserver:v1.1.0 # Run in background
docker ps -a                                                 # List all containers (running & stopped)
docker logs -f --tail=100 <container_id>                    # Follow container stdout/stderr
docker exec -it <container_id> sh                           # Open interactive shell in container
docker inspect <container_id>                               # Inspect IP address, mounts, env vars
docker system prune -af --volumes                           # Clean all unused containers, images, volumes
```
