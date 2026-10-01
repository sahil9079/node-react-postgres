# Docker Troubleshooting Matrix

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| **Container restarts continuously** | App crashes immediately on startup | Inspect logs with `docker logs <container_id>` |
| **Exit Code 137** | Container OOMKilled by kernel | Increase memory limit or fix memory leak |
| **Cannot connect to service on localhost** | App bound to `127.0.0.1` inside container | Change app binding to `0.0.0.0` (all interfaces) |
