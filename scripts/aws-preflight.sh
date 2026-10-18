#!/usr/bin/env bash
set -euo pipefail

EXPECTED_REGION="${1:-ap-south-1}"

echo "=== AWS & Kubernetes Pre-Flight Safety Check ==="

echo "[1/4] Checking CLI versions..."
aws --version
terraform version
kubectl version --client

echo "[2/4] Verifying AWS Caller Identity (STOP if wrong account/role!)..."
aws sts get-caller-identity

echo "[3/4] Checking configured AWS Region (Expected: $EXPECTED_REGION)..."
CURRENT_REGION=$(aws configure get region || echo "unset")
echo "  -> Configured Region: $CURRENT_REGION"

echo "[4/4] Checking current kubectl context..."
kubectl config current-context || echo "  -> No active kubectl context set yet"

echo "=== Pre-Flight Check Complete. Review identity above before running terraform plan/apply! ==="
