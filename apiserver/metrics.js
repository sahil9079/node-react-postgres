// Prometheus metrics collector & exposition module (Prometheus Text Format 0.0.4)
// Tracks Golden Signals (Request Count, Error Rate, Latency Histogram, Node.js Process Saturation)
// Normalizes dynamic route parameters to prevent high-cardinality label explosion.

const HISTOGRAM_BUCKETS = [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5];

const requestCounts = new Map();
const durationBuckets = new Map();
const durationSums = new Map();
const durationCounts = new Map();

function normalizeRoute(req) {
    if (req.route && req.route.path) {
        const baseUrl = req.baseUrl || "";
        return `${baseUrl}${req.route.path === "/" ? "" : req.route.path}` || "/";
    }
    const rawPath = (req.originalUrl || req.url || "/").split("?")[0];
    return rawPath
        .replace(/\/api\/v1\/skills\/[^/]+/g, "/api/v1/skills/:skillId")
        .replace(/\/api\/v1\/auth\/verify\/[^/]+/g, "/api/v1/auth/verify/:token")
        .replace(/\/[0-9a-fA-F-]{8,}/g, "/:id")
        .replace(/\/\d+/g, "/:id");
}

function metricsMiddleware(req, res, next) {
    if (req.path === "/metrics") {
        return next();
    }
    const startNs = process.hrtime.bigint();

    res.on("finish", () => {
        const elapsedSeconds = Number(process.hrtime.bigint() - startNs) / 1e9;
        const method = req.method;
        const route = normalizeRoute(req);
        const statusCode = String(res.statusCode);
        const key = `${method}|${route}|${statusCode}`;

        requestCounts.set(key, (requestCounts.get(key) || 0) + 1);
        durationSums.set(key, (durationSums.get(key) || 0) + elapsedSeconds);
        durationCounts.set(key, (durationCounts.get(key) || 0) + 1);

        if (!durationBuckets.has(key)) {
            durationBuckets.set(key, new Array(HISTOGRAM_BUCKETS.length).fill(0));
        }
        const buckets = durationBuckets.get(key);
        for (let i = 0; i < HISTOGRAM_BUCKETS.length; i++) {
            if (elapsedSeconds <= HISTOGRAM_BUCKETS[i]) {
                buckets[i] += 1;
            }
        }
    });

    next();
}

function metricsEndpoint(req, res) {
    const lines = [];
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();

    lines.push("# HELP process_resident_memory_bytes Resident memory size in bytes.");
    lines.push("# TYPE process_resident_memory_bytes gauge");
    lines.push(`process_resident_memory_bytes ${mem.rss}`);

    lines.push("# HELP nodejs_heap_used_bytes Process heap memory used in bytes.");
    lines.push("# TYPE nodejs_heap_used_bytes gauge");
    lines.push(`nodejs_heap_used_bytes ${mem.heapUsed}`);

    lines.push("# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.");
    lines.push("# TYPE process_cpu_user_seconds_total counter");
    lines.push(`process_cpu_user_seconds_total ${(cpu.user / 1e6).toFixed(6)}`);

    lines.push("# HELP process_uptime_seconds Node.js process uptime in seconds.");
    lines.push("# TYPE process_uptime_seconds gauge");
    lines.push(`process_uptime_seconds ${process.uptime().toFixed(2)}`);

    lines.push("# HELP http_requests_total Total number of HTTP requests processed.");
    lines.push("# TYPE http_requests_total counter");
    for (const [key, count] of requestCounts.entries()) {
        const [method, route, status_code] = key.split("|");
        lines.push(`http_requests_total{method="${method}",route="${route}",status_code="${status_code}"} ${count}`);
    }

    lines.push("# HELP http_request_duration_seconds HTTP request latency histogram in seconds.");
    lines.push("# TYPE http_request_duration_seconds histogram");
    for (const [key, buckets] of durationBuckets.entries()) {
        const [method, route, status_code] = key.split("|");
        const labels = `method="${method}",route="${route}",status_code="${status_code}"`;
        for (let i = 0; i < HISTOGRAM_BUCKETS.length; i++) {
            lines.push(`http_request_duration_seconds_bucket{${labels},le="${HISTOGRAM_BUCKETS[i]}"} ${buckets[i]}`);
        }
        const totalCount = durationCounts.get(key) || 0;
        const totalSum = (durationSums.get(key) || 0).toFixed(6);
        lines.push(`http_request_duration_seconds_bucket{${labels},le="+Inf"} ${totalCount}`);
        lines.push(`http_request_duration_seconds_sum{${labels}} ${totalSum}`);
        lines.push(`http_request_duration_seconds_count{${labels}} ${totalCount}`);
    }

    res.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
    res.status(200).send(lines.join("\n") + "\n");
}

module.exports = {
    metricsMiddleware,
    metricsEndpoint,
    normalizeRoute,
};
