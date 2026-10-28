# 06 — Docker and Docker Compose in Simple Words

## 1. The problem Docker solves

Without Docker:

- "It works on my laptop" but not on the server.
- Different Node versions, missing libraries, different OS.

With Docker:

- You pack the app + its libraries + its OS into one **image**.
- Anyone who runs that image gets the same behaviour.

**Image = recipe. Container = the dish being served.**

## 2. The backend Dockerfile, explained

```dockerfile
FROM node:18-bullseye-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:18-bullseye-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8010
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .
RUN mkdir -p /app/images && chown -R node:node /app/images
USER node
EXPOSE 8010
HEALTHCHECK CMD node -e "...http.get('http://127.0.0.1:8010/healthz')..."
CMD ["node", "index.js"]
```

| Line | Simple meaning |
| :--- | :--- |
| `FROM ... AS deps` | Start a build stage named `deps` |
| `COPY package*.json` | Copy only dependency files first, so this layer is cached |
| `npm ci --omit=dev` | Install exact versions, skip test tools |
| `FROM ... AS runtime` | Start a fresh, smaller stage |
| `COPY --from=deps` | Take only `node_modules` from the first stage |
| `COPY --chown=node:node . .` | Copy source code with non-root ownership |
| `RUN mkdir -p /app/images` | Make the upload folder writable |
| `USER node` | Do not run as root |
| `HEALTHCHECK` | Docker can test `/healthz` |
| `CMD ["node","index.js"]` | Start the API; exec form passes signals correctly |

**Why two stages?**
The build stage may contain npm caches and dev tools. The runtime stage copies only what is needed. Result: smaller image, fewer security holes.

**The most important security detail:** `apiserver/.dockerignore` contains `.config.env`. If that file went into the image, your secrets would be baked into a layer forever, even if you delete the file later.

## 3. The frontend Dockerfile, explained

```dockerfile
FROM node:18-bullseye-slim AS Builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.29-alpine
COPY --from=Builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- Stage 1 turns React code into static HTML/CSS/JS.
- Stage 2 serves those files with NGINX.
- No Node.js in production. Smaller and safer.

## 4. Docker commands you will use

```bash
# build
docker build -t skills-apiserver:local ./apiserver
docker build -t skills-client:local ./client

# run one container
docker run --rm -p 8010:8010 skills-apiserver:local

# list
docker images
docker ps
docker ps -a

# inspect
docker logs -f <container>
docker exec -it <container> sh
docker inspect <container>

# prove non-root
docker run --rm skills-apiserver:local id
# expected: uid=1000(node)
```

## 5. What Docker Compose is

Compose is a **conductor** for many containers. It reads `docker-compose.yaml` and starts everything with the right network and startup order.

This project starts five services:

| Service | Image | Port | Job |
| :--- | :--- | :--- | :--- |
| `db` | `postgres:15-alpine` | `5432` | database |
| `apiserver` | built from `./apiserver` | `8010` | API |
| `client` | built from `./client` | `80` | website |
| `prometheus` | `prom/prometheus` | `9090` | metrics |
| `grafana` | `grafana/grafana` | `3001` | dashboards |

## 6. The three networks

```
frontend-net   : client  <-> apiserver
backend-net    : apiserver <-> db
monitoring-net : apiserver <-> prometheus <-> grafana
```

Why?

- The database is not reachable from the browser-facing container.
- Monitoring can read metrics but cannot touch the database.
- This is a small copy of the AWS network design.

## 7. Health and startup order

```yaml
depends_on:
  db:
    condition: service_healthy
```

That only works because `db` has:

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres -d sampledb"]
```

The order is:

```
db healthy  -> apiserver starts
apiserver healthy (/healthz) -> client and prometheus start
prometheus starts -> grafana starts
```

## 8. Volumes: where data lives

| Volume | Holds |
| :--- | :--- |
| `dbdata` | PostgreSQL data |
| `prometheus_data` | metrics history |
| `grafana_data` | dashboards/settings |

`docker compose down` keeps volumes.
`docker compose down -v` **deletes** them. Be careful.

## 9. Daily commands

```bash
docker compose config            # check the file
docker compose up --build -d     # start
docker compose ps                # status
docker compose logs -f apiserver # logs
docker compose stop db           # stop one service
docker compose start db          # start it again
docker compose down              # stop and remove containers
```

## 10. The five most common Docker errors

| Error | Simple cause | Fix |
| :--- | :--- | :--- |
| `port is already allocated` | Another process uses the port | Stop it or change the host port |
| `Cannot connect to the Docker daemon` | Docker Desktop is not running | Start Docker |
| `npm ERR! ERESOLVE` | Dependency conflict | Use `npm ci`, check Node version |
| `host not found in upstream "apiserver"` | NGINX cannot resolve the API name | Start the API first / add the Service alias |
| `permission denied` writing uploads | Container runs as non-root | Fix folder ownership |

## 11. How to debug in the right order

```
1. docker compose ps            -> is it running?
2. docker compose logs <name>   -> what did it say?
3. docker inspect <name>        -> env, mounts, network
4. docker exec -it <name> sh    -> look inside
5. curl from inside the network -> is it a DNS/network problem?
```

Example:

```bash
docker compose exec apiserver sh
wget -qO- http://127.0.0.1:8010/healthz
wget -qO- http://db:5432 || echo "db port not open"
```

## 12. Compose checklist

- [ ] I can explain image vs container.
- [ ] I can explain multi-stage build.
- [ ] I can name all five services and their ports.
- [ ] I can explain the three networks.
- [ ] I can start, stop, inspect and debug the stack.
