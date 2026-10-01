# Docker Fundamentals - Level 4: Production

## 1. Production Container Hardening Checklist
1. **Never run as root:** Use `USER 10001` or built-in non-root users.
2. **Use minimal base images:** Prefer Alpine or Google Distroless (`gcr.io/distroless/nodejs20-debian12`).
3. **Read-only root filesystem:** Deploy containers with `--read-only` flag.
4. **Drop Linux Capabilities:** Run with `--cap-drop=ALL`.
5. **Set explicit CPU and Memory limits:** Prevent memory leaks on host (`--memory=512m --cpus=1.0`).
6. **Scan images in CI/CD:** Block deployment if Trivy detects HIGH/CRITICAL CVEs.
