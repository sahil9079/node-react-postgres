# 05 — Frontend (React + NGINX) in Simple Words

Folder: `client/`

## 1. What the frontend does

The frontend is the **menu and the dining room**. It shows pages, forms and buttons. When it needs data, it calls the API.

It is a **Single Page Application (SPA)**:

- The server sends one `index.html`.
- JavaScript changes what you see.
- The page does not reload when you click a link.

## 2. The five React ideas you need

| Idea | Simple meaning | Example here |
| :--- | :--- | :--- |
| **Component** | A reusable piece of UI. | `Header.jsx`, `SkillList.jsx` |
| **Props** | Data passed from parent to child. | `<SkillList userSkills={...} />` |
| **State** | Data that can change and redraw the page. | `useState([])` for skills |
| **Hook** | A function that adds React features. | `useEffect`, `useContext` |
| **Context** | Data shared without passing props at every level. | `UserContext` |

## 3. Page flow

```
App.js
  |
  +-- PublicRoute
  |     +-- /        Home
  |     +-- /about   About
  |     +-- /contact Contact
  |
  +-- PrivateRoute
  |     +-- /skills  UserSkills
  |
  +-- /sign-in       SignIn
  +-- /sign-up       SignUp
```

`PrivateRoute` checks `UserContext`:

- loading → show `Loading`
- user exists → show the page
- no user → redirect to `/sign-in`

**Important:** this is only a user-experience guard. The API still checks the cookie. Never trust the browser for security.

## 4. Login flow in the browser

```
SignIn form
  -> useAuth.loginUser(values)
  -> authService.loginUser
  -> POST /api/v1/auth/login
  -> server sets cookie
  -> useAuth calls checkUserAuth()
  -> GET /api/v1/auth/check-auth
  -> server returns user
  -> setUser(user) in context
  -> navigate to /skills
```

The cookie is stored by the browser. JavaScript does **not** read it (`HttpOnly`).

## 5. The skills page

`UserSkills.jsx`:

1. On load, calls `GET /api/v1/skills`.
2. Saves the list in state.
3. Renders `<SkillList>`.
4. `<SkillAdd>` adds a skill.
5. `<SkillUpdate>` edits one.
6. Delete calls `DELETE /api/v1/skills/:id`.

After every change it calls `getUserSkills()` again to refresh the table. This is called **refetching**.

## 6. How the browser reaches the API

### In development

`client/package.json` has:

```json
"proxy": "http://localhost:8010"
```

So `fetch("/api/v1/skills")` goes to `localhost:8010`.

### In Docker / Kubernetes

`NGINX` does the forwarding:

```nginx
location /api/ {
    proxy_pass http://apiserver:8010;
}
```

`proxy_pass` **without a trailing slash** keeps the full path. With a trailing slash it would remove `/api/` and break the API routes.

## 7. `nginx.conf` line by line

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location = /nginx-health {
        access_log off;
        return 200 "healthy\n";
    }

    location / {
        try_files $uri $uri/ /index.html;   # SPA routing
    }

    location /api/ {
        proxy_pass http://apiserver:8010;   # backend
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

| Line | Why |
| :--- | :--- |
| `listen 80` | NGINX serves HTTP on port 80 |
| `root` | Where the React build lives |
| `try_files` | If `/skills` is not a file, send `index.html` so React Router can handle it |
| `/nginx-health` | Cheap health endpoint for probes |
| `proxy_pass` | Send `/api/` calls to the API |
| `X-Forwarded-Proto` | Lets the API know if the original request was HTTPS (for Secure cookies) |

**Kubernetes gotcha:** NGINX looks up `apiserver` when it starts. If that name does not resolve, NGINX crashes with `host not found in upstream`. The repo solves this with an extra Service named `apiserver` in `k8s/apisrc.yaml`.

## 8. The frontend Docker image

```
Stage 1: node:18  -> npm ci -> npm run build -> /app/build
Stage 2: nginx    -> copy /app/build -> serve on port 80
```

The production image contains **no Node.js**. It only contains static files and NGINX. That makes it small and fast.

## 9. Real problems in the frontend (simple words)

| Problem | Effect | Fix idea |
| :--- | :--- | :--- |
| `localStorage` token is set but backend uses cookies | Confusing, unused code | Remove it or use it |
| `AbortController` is created but sometimes never aborted | Wasted requests | Abort on unmount |
| `useErrorHandler` redirects 403 to `/satin-al` (typo) | Broken redirect | Change to a real page |
| No loading/error UI in some pages | User sees a blank screen | Add states |
| `Header` shows `user.profileImg` even if empty | Broken image icon | Conditional render |
| No global error boundary | One crash blanks the app | Add an error boundary |
| Build output is committed in `client/build/` | Large repo, stale files | Rebuild in CI only |

## 10. Frontend checklist

- [ ] I can explain component, props, state, hook, context.
- [ ] I can trace login from the form to the cookie.
- [ ] I can explain `try_files` and why SPA routing needs it.
- [ ] I can explain why NGINX needs the `apiserver` Service name.
- [ ] I know the frontend guard is not real security.
