# Docker Fundamentals - Level 2: Intermediate

## 1. Container Networking & Storage
* **Docker Networks:**
  * `bridge` (Default): Private internal virtual network with NAT out to host.
  * `host`: Removes network isolation; container shares host network namespace directly.
  * `overlay`: Multi-host networking across swarm/cluster nodes.
* **Docker Storage:**
  * **Volumes (`/var/lib/docker/volumes`):** Managed directly by Docker. Best for database persistence.
  * **Bind Mounts:** Maps an arbitrary host directory directly into the container. Great for local development.

## 2. Multi-Container Orchestration with Docker Compose
```yaml
# docker-compose.yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=postgres_db
      - DB_USER=postgres
      - DB_PASS=secret123
    depends_on:
      postgres_db:
        condition: service_healthy

  postgres_db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secret123
      POSTGRES_DB: appdb
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```
