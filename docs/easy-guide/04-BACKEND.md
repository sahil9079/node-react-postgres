# 04 — Backend (The API) in Simple Words

Folder: `apiserver/`

## 1. What the backend does

The backend is a **waiter in the kitchen**. It:

1. listens on port `8010`,
2. checks who is calling,
3. reads or writes data in PostgreSQL,
4. sends JSON back.

It does **not** draw anything. React does that.

## 2. The boot order

When you run `node index.js`:

```
1. Load .config.env              (dotenv)
2. Register crash handlers       (uncaughtException, unhandledRejection)
3. Connect to PostgreSQL         (sampledb.authenticate)
4. Create missing tables         (sampledb.sync)
5. Build the Express app         (app.js)
6. Listen on PORT (8010)
7. Wait for SIGTERM to shut down gracefully
```

**Simple meaning of `sync({ force: false })`:** "create tables if they do not exist; never delete data." `force: true` means "drop everything and recreate" — used only by the seed script.

## 3. Middleware order (the assembly line)

Every request passes through these steps in order:

```
1.  metricsMiddleware      count it and time it
2.  cookieParser           read the cookie
3.  morgan                 log it (development only)
4.  cors                   allow cross-origin calls
5.  helmet                 add security headers
6.  express.json           parse JSON body
7.  express.urlencoded     parse form body
8.  /healthz               liveness
9.  /readyz                readiness
10. /metrics               Prometheus output
11. static files           React build + uploaded images
12. compression            gzip
13. /api/v1 router         real business routes
14. SPA fallback           send index.html
15. 404 handler
16. convertErrors          normalise errors
17. handleErrors           send the error response
```

**Why order matters:** if `cookieParser` runs after `isLoggedIn`, there is no cookie to read. If `handleErrors` is not last, errors are not caught.

## 4. The URL map

Base: `/api/v1`

| Method | URL | Login needed? | What happens |
| :--- | :--- | :--- | :--- |
| POST | `/auth/register` | no | Create user, print verify link |
| GET | `/auth/verify/:token` | no | Mark user verified, set cookie |
| POST | `/auth/login` | no | Check password, set cookie |
| GET | `/auth/check-auth` | cookie | Return current user |
| GET | `/auth/logout` | no | Clear cookie |
| GET | `/users` | yes | My profile |
| POST | `/users` | yes | Update profile + photo |
| PATCH | `/users` | yes | Change password |
| GET | `/skills` | yes | All skills |
| GET | `/skills/:id` | yes | One skill |
| POST | `/skills` | yes | Create skill |
| PATCH | `/skills/:id` | yes | Update skill (owner only) |
| DELETE | `/skills/:id` | yes | Delete skill (owner only) |

## 5. Login, explained like a story

```
User types email + password.
        |
authService finds the user by email.
        |
bcrypt.compare(typedPassword, storedHash)
        |
If wrong -> 400 "Incorrect email or password"
If right -> create a token:
    jwt.sign({ id, role }, JWT_SESSION_SECRET, { expiresIn: "1d" })
        |
Encrypt the token:
    AES-192-CBC with SESSION_ENCRYPT_SECRET
        |
Put it in a cookie:
    __sample_session=<hex>
    HttpOnly  -> JavaScript cannot read it
    Secure    -> only sent over HTTPS
    SameSite  -> helps against CSRF
        |
Browser saves the cookie and sends it on every request.
```

**Three secrets, three jobs:**

| Secret | Job |
| :--- | :--- |
| `JWT_VERIFY_SECRET` | Sign the email-verification link |
| `JWT_SESSION_SECRET` | Sign the login session token |
| `SESSION_ENCRYPT_SECRET` | Encrypt the token inside the cookie |

If one secret leaks, that one job is compromised. Rotate it.

## 6. The database tables

```
role
  id, name (user/admin/superAdmin), code

user
  id, first_name, last_name, email, password, password_confirm,
  status, is_verified, profile_img, refresh_token, role_id,
  created_at, updated_at

skill
  id, category, tag_line, travel_fee, user_id

location_option
  id, option (choose/instructor/online), skill_id
```

Relationships:

- One **role** has many **users**.
- One **user** has many **skills**.
- One **skill** has many **location options**.

## 7. The three most important files

### `index.js`
Starts everything. Handles `SIGTERM` so Kubernetes can stop the Pod without cutting a request in half.

### `app.js`
Builds the request pipeline. Contains the probes and `/metrics`. This is the file to read when you ask "why is this URL returning 404/500?".

### `services/authService.js`
Contains the real login logic. Controllers only call it and send the result.

## 8. Error handling in one picture

```
Controller throws
      |
catchAsync catches it
      |
next(error)
      |
convertErrors (JWT? Sequelize? unknown?)
      |
handleErrors
      |
development: full message + stack
production: safe message only (or "Something went very wrong!")
```

**Simple rule:** never show a stack trace to a real user. It can reveal file paths, table names and secrets.

## 9. Health endpoints

| URL | Checks | Used by |
| :--- | :--- | :--- |
| `/healthz` | Only "is the Node process alive?" | Liveness probe, load balancer |
| `/readyz` | "Can it reach PostgreSQL?" | Readiness probe |
| `/metrics` | Returns numbers for Prometheus | Prometheus |

Why two? Because a database outage should **not** restart every Pod. It should only remove them from traffic until the database returns.

## 10. Image upload

```
POST /api/v1/users
  -> multer reads the file into memory
  -> sharp resizes it to 120x120 JPEG
  -> saves it in images/
  -> userController saves the URL in the database
```

**DevOps consequence:** the container needs a writable folder. In Kubernetes, a persistent volume or object storage (S3) would be needed if uploads must survive Pod replacement.

## 11. Real problems in this backend (simple words)

| Problem | Effect | Fix idea |
| :--- | :--- | :--- |
| `passwordConfirm` is saved in the DB | Extra copy of a secret | Make it a virtual field |
| Fixed AES IV | Same token always looks the same | Random IV per encryption |
| `JWT_SESSION_EXPIRY` math assumes days | `12h` becomes 12 days | Use a duration parser |
| `sync()` on every boot | Schema changes are risky | Use migrations |
| `catchAsync` did not return the promise | Tests may finish early | Add `return` |
| Role check has swapped arguments | Wrong status if enabled | `new AppError(403, "message")` |
| `cors()` allows all origins | Too open in production | Set an allowed origin |
| `roleId = 1` hard-coded | Everyone becomes a normal user | Make role explicit |

These are good first pull requests.

## 12. Backend checklist

- [ ] I can say the boot order.
- [ ] I can say the middleware order.
- [ ] I can explain login without looking.
- [ ] I can explain why `/healthz` and `/readyz` are different.
- [ ] I can name the four tables.
