const fs = require("fs")
const path = require("path")

const express = require("express")
const cookieParser = require('cookie-parser')
const compression = require('compression')
const cors = require('cors')
const helmet = require("helmet")
const morgan = require("morgan")

const api = require("./api")
const { metricsMiddleware, metricsEndpoint } = require("./metrics")
const convertErrors = require('./middleware/convertErrors')
const handleErrors = require('./middleware/handleErrors')
const app = express()

// record HTTP request counts and duration histograms for Prometheus
app.use(metricsMiddleware)

// parsing cookies for auth
app.use(cookieParser())

// setting up logger
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"))
}

// opening cors for development
app.use(cors())

// setting security HTTP headers
app.use(helmet({
    crossOriginResourcePolicy: false,
}))

// parsing incoming requests with JSON body payloads
app.use(express.json())

// parsing incoming requests with urlencoded body payloads
app.use(express.urlencoded({ extended: true }))

// Liveness probe: lightweight check that Node.js HTTP server is responsive (no DB check)
app.get("/healthz", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "apiserver",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    })
})

// Readiness probe: verifies PostgreSQL connection before accepting live traffic
app.get("/readyz", async (req, res) => {
    try {
        const { sampledb } = require("./models")
        await sampledb.authenticate()
        res.status(200).json({
            status: "ready",
            database: "connected",
            timestamp: new Date().toISOString()
        })
    } catch (err) {
        res.status(503).json({
            status: "not_ready",
            database: "disconnected",
            message: err.message
        })
    }
})

// Prometheus metrics scrape endpoint
app.get("/metrics", metricsEndpoint)

// serving the static files
const clientBuildPath = path.join(__dirname, "../", "client/", "build")
const clientIndexHtml = path.resolve(clientBuildPath, "index.html")
app.use(express.static(clientBuildPath))
app.use(express.static(path.join(__dirname, "images")))

// handling gzip compression
app.use(compression())
// redirecting incoming requests to api.js
app.use(`/api/${process.env.API_VERSION}`, api)

// returning the main index.html only when bundled together; in API-only containers, fall through to 404
app.get("*", (req, res, next) => {
    if (!req.path.startsWith("/api/") && fs.existsSync(clientIndexHtml)) {
        return res.sendFile(clientIndexHtml)
    }
    return next()
})

// setting up a 404 error handler
app.all("*", (req, res, next) => {
    res.status(404).end()
})

// convert&handle errors
app.use(convertErrors)
app.use(handleErrors)

module.exports = app