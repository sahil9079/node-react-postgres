# 00 — Start Here

## 1. What is this project?

It is a **small website** where people can list their skills.

A person can:

1. Create an account.
2. Verify the account with a link.
3. Log in.
4. Add, edit and delete skills.
5. Upload a profile photo.

That is all. The rest of the project is about **running this website safely on the internet**.

## 2. The three boxes

Every web app has three boxes:

```
[ Browser ]  --->  [ Server / API ]  --->  [ Database ]
  React                Node.js                PostgreSQL
  (client folder)      (apiserver folder)     (data)
```

- **Browser box** = what the user sees. Folder: `client/`.
- **Server box** = the rules and logic. Folder: `apiserver/`.
- **Database box** = where data is saved. PostgreSQL 15.

DevOps work is everything around these boxes: packaging, shipping, watching, securing and paying for them.

## 3. Ten facts to remember

| Fact | Value |
| :--- | :--- |
| API port | `8010` |
| Frontend port in container | `80` |
| Frontend dev port | `3000` |
| Database port | `5432` |
| API URL prefix | `/api/v1` |
| Health URL (is it alive?) | `/healthz` |
| Ready URL (can it serve?) | `/readyz` |
| Metrics URL | `/metrics` |
| Kubernetes namespace | `node-react-app` |
| AWS region | `ap-south-1` (Mumbai) |

## 4. What each tool is for (one line each)

| Tool | Simple meaning |
| :--- | :--- |
| **Node.js** | Runs JavaScript outside a browser. |
| **Express** | A small framework that makes Node.js web servers. |
| **React** | Builds the user interface in the browser. |
| **PostgreSQL** | A database that stores rows and tables. |
| **Docker** | Packs an app and its dependencies into one image. |
| **Docker Compose** | Runs many containers together on one machine. |
| **Kubernetes** | Runs containers on many machines and keeps them alive. |
| **Terraform** | Creates cloud infrastructure from code. |
| **AWS** | Amazon's cloud (servers, network, database). |
| **GitHub Actions** | Runs tests and deployments automatically. |
| **Prometheus** | Collects numbers (metrics) about the app. |
| **Grafana** | Draws those numbers as graphs. |
| **SonarQube** | Checks code quality. |
| **Trivy** | Scans for security problems. |

## 5. Your first five commands

Run these from the project root:

```bash
# 1. check the tools
node -v
docker --version

# 2. create your local env file
copy apiserver\example.env apiserver\.config.env

# 3. start everything (database + API + frontend + monitoring)
docker compose up --build -d

# 4. check that it is alive
curl.exe http://localhost:8010/healthz

# 5. check that it can reach the database
curl.exe http://localhost:8010/readyz
```

Open the app at `http://localhost`.

## 6. What "good" looks like

The stack is healthy when:

- `docker compose ps` shows `db`, `apiserver`, `client`, `prometheus`, `grafana`.
- `/healthz` returns `{"status":"ok"}`.
- `/readyz` returns `{"status":"ready","database":"connected"}`.
- `http://localhost:9090/targets` shows the `skills-apiserver` target as **UP**.
- `http://localhost:3001` opens Grafana (`admin` / `adminpassword`).

## 7. What to do when something fails

Do not panic. Follow this order:

1. `docker compose ps` — is the container running?
2. `docker compose logs apiserver` — what did it say?
3. `curl.exe http://localhost:8010/healthz` — is the process alive?
4. `curl.exe http://localhost:8010/readyz` — can it reach the database?
5. `docker compose logs db` — is PostgreSQL ready?

The answer is almost always in the logs. Read the **last 30 lines**.

## 8. What next?

Open `01-BIG-PICTURE.md` and draw the three boxes and the arrows on paper.
