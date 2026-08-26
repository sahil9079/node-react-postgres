# Level 2: Docker Troubleshooting & Advanced Optimization

> **Experience Target:** 2-Year Mid-Level DevOps Engineer  
> **Topic Scope:** Debugging containers in production, multi-stage optimization, cross-platform buildx, layer caching internals, and non-root security.

---

## 1. Troubleshooting Production Container Failures

### Scenario 1: Container runs locally on macOS/Windows, but crashes on EKS Linux
* **Root Cause 1 — Architecture Mismatch (`arm64` vs `amd64`):**
  * Modern Apple Silicon (M1/M2/M3) builds `linux/arm64` images by default. Standard AWS EKS worker nodes run Intel/AMD `linux/amd64`.
  * **Fix:** Build using Docker Buildx:
    ```bash
    docker buildx build --platform linux/amd64,linux/arm64 -t sahil9079/js-apiserver:v1.1.0 --push ./apiserver
    ```
* **Root Cause 2 — Filesystem Case-Sensitivity:**
  * Windows and macOS have case-insensitive filesystems (`require('./AuthController')` works locally). Linux filesystems are strictly case-sensitive (`require('./authController')` throws `Error: Cannot find module`).
* **Root Cause 3 — Alpine `musl` vs Debian `glibc`:**
  * Modules compiled with native C++ bindings (e.g. `sharp`, `bcryptjs`) built on a host OS fail inside an Alpine container unless compiled against `musl libc`.

---

### Scenario 2: Container crashes with `EACCES: permission denied`
* **Root Cause:**
  * In `apiserver/Dockerfile`, we switched to `USER node` (UID 1000).
  * If a volume is mounted to a directory created by `root` (e.g. `/app/images/profile`), the non-root `node` user cannot write uploaded profile pictures to disk.
* **Fix in Dockerfile:**
  ```dockerfile
  RUN mkdir -p /app/images/profile && chown -R node:node /app
  USER node
  ```

---

## 2. Dockerfile Optimization Metrics

### Image Size Comparison Matrix

| Image | Base Image | Strategy | Size | Build Time |
| :--- | :--- | :--- | :--- | :--- |
| **Old Frontend (Single-Stage)** | `node:18` (full) | Single stage with `react-scripts` + `node_modules` | **~1.3 GB** | 4.2 min |
| **New Frontend (Multi-Stage)** | `node:18-bullseye-slim` $\to$ `nginx:1.29-alpine` | Discard Node runtime; keep only compiled `/app/build` | **~23 MB** | 1.1 min |
| **Backend API** | `node:18-slim` | Debian-slim + `npm ci` layer caching | **~180 MB** | 45 sec |

### Key Optimization Rules Applied
1. **Order Matters:** Copy `package*.json` and run `npm ci` *before* copying application code so dependency layers stay cached when only code changes.
2. **`.dockerignore`:** Exclude `node_modules`, `.git`, `.env`, tests, and coverage reports to prevent inflating the build context sent to the Docker daemon.
3. **Exec Form for `CMD`:** Use `CMD ["node", "index.js"]` so Node.js runs as PID 1 to receive `SIGTERM` signals for graceful shutdown.
