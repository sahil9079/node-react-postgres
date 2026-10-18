#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${1:-http://localhost:8010}"
CLIENT_BASE_URL="${2:-http://localhost:80}"

echo "=== Running Smoke Tests against API ($API_BASE_URL) and Client ($CLIENT_BASE_URL) ==="

echo "[1/4] Checking API Liveness Probe ($API_BASE_URL/healthz)..."
curl -fsS "$API_BASE_URL/healthz" | grep -q '"status":"ok"'
echo "  -> PASS: /healthz returned status: ok"

echo "[2/4] Checking API Readiness Probe ($API_BASE_URL/readyz)..."
curl -fsS "$API_BASE_URL/readyz" | grep -q '"status":"ready"'
echo "  -> PASS: /readyz confirmed PostgreSQL database connectivity"

echo "[3/4] Checking Prometheus Metrics Endpoint ($API_BASE_URL/metrics)..."
curl -fsS "$API_BASE_URL/metrics" | grep -q "http_requests_total"
echo "  -> PASS: /metrics exposed Prometheus telemetry"

echo "[4/4] Checking Frontend NGINX Health ($CLIENT_BASE_URL/nginx-health)..."
curl -fsS "$CLIENT_BASE_URL/nginx-health" | grep -q "healthy"
echo "  -> PASS: /nginx-health returned healthy"

echo "=== All Smoke Tests Passed Successfully! ==="
