# Docker Fundamentals - Level 1: Foundation

## 1. Docker Architecture & Engine
```
+-------------------------------------------------------------+
|                        DOCKER CLIENT                        |
|  CLI Commands: docker build, docker pull, docker run        |
+-------------------------------------------------------------+
                              | REST API (UNIX Socket /var/run/docker.sock)
                              v
+-------------------------------------------------------------+
|                        DOCKER DAEMON                        |
|  Image Builder | Container Orchestration | Network & Volume |
+-------------------------------------------------------------+
                              | Containerd & runc
                              v
+-------------------------------------------------------------+
|                      HOST LINUX KERNEL                      |
|         Namespaces (Isolation)  |  Cgroups (Resource Limits)|
+-------------------------------------------------------------+
```

## 2. Containers vs Virtual Machines
* **Virtual Machine (VM):** Includes Guest OS, Virtual Kernel, Hypervisor overhead (Gigabytes in size, minutes to boot).
* **Docker Container:** Shares the Host OS Kernel, isolates processes using Linux Kernel **Namespaces** and **Cgroups** (Megabytes in size, milliseconds to boot).

## 3. Essential Commands
```bash
docker build -t myapp:1.0 .          # Build image from Dockerfile
docker run -d -p 8080:80 --name web myapp:1.0 # Run container in detached mode
docker ps                            # List running containers
docker ps -a                         # List all containers (including stopped)
docker logs -f web                   # Stream container stdout/stderr logs
docker exec -it web /bin/sh          # Open interactive shell inside running container
docker stop web && docker rm web     # Stop and remove container
docker system prune -af --volumes    # Reclaim unused disk space
```
