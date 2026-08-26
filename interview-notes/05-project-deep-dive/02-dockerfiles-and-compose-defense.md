# Project Deep Dive: Dockerfiles & Compose Defense

> **Core Focus:** Technical interview Q&A on your project's Dockerfiles and Docker Compose configuration.

---

## 1. Line-by-Line Defense: `apiserver/Dockerfile`

```dockerfile
FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
USER node
EXPOSE 8010
CMD ["node", "index.js"]
```

* **Q: Why `node:18-slim` instead of Alpine or standard Node?**
  * *Answer:* "Standard `node:18` contains build tools and utilities that bloat the image to over 1GB. `node:18-alpine` uses `musl libc`, which can introduce compilation issues with native C++ Node packages like `bcryptjs` and `sharp`. `node:18-slim` is based on Debian with standard `glibc`, providing stability, small image size (~180MB), and native module compatibility."
* **Q: Why do you copy `package*.json` and run `npm ci` before `COPY . .`?**
  * *Answer:* "To maximize Docker layer caching. Package dependencies change far less frequently than source code. By isolating `npm ci` into its own layer, Docker reuses the cached node_modules layer during subsequent builds unless `package-lock.json` is modified."
* **Q: Why did you include `USER node`?**
  * *Answer:* "By default, Docker runs container processes as `root`. If an attacker achieves Remote Code Execution (RCE) through an Express dependency vulnerability, running as non-root user `node` (UID 1000) prevents the attacker from gaining root access or modifying host filesystems."

---

## 2. Line-by-Line Defense: `client/Dockerfile`

```dockerfile
FROM node:18-bullseye-slim AS Builder
WORKDIR /app
COPY package*.json ./
RUN npm ci 
COPY . .
RUN npm run build

FROM nginx:1.29-alpine
COPY --from=Builder /app/build /usr/share/nginx/html
RUN rm -rf /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

* **Q: Explain the exact mechanism of your multi-stage build.**
  * *Answer:* "Stage 1 (`Builder`) uses a Node.js runtime to compile React JSX files into static HTML, CSS, and JS (`npm run build`). Stage 2 starts fresh with `nginx:1.29-alpine` and copies only the static files from `/app/build` into `/usr/share/nginx/html`. The Node runtime, build compilers, and devDependencies are discarded, reducing image size from 1.2 GB to 23 MB."
