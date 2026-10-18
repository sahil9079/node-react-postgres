#!/usr/bin/env bash
set -euo pipefail

REGION="${1:-ap-south-1}"

echo "=== Post-Destroy AWS Billable Resource Audit (Region: $REGION) ==="

echo "[1/8] Checking EKS Clusters..."
aws eks list-clusters --region "$REGION"

echo "[2/8] Checking Running/Stopped EC2 Instances..."
aws ec2 describe-instances --region "$REGION" \
  --filters "Name=instance-state-name,Values=pending,running,stopping,stopped" \
  --query "Reservations[*].Instances[*].[InstanceId,InstanceType,State.Name]" --output table

echo "[3/8] Checking Application/Network Load Balancers (ALBs/NLBs)..."
aws elbv2 describe-load-balancers --region "$REGION" \
  --query "LoadBalancers[*].[LoadBalancerName,Type,State.Code]" --output table

echo "[4/8] Checking NAT Gateways..."
aws ec2 describe-nat-gateways --region "$REGION" \
  --filter "Name=state,Values=pending,available,deleting" \
  --query "NatGateways[*].[NatGatewayId,State,SubnetId]" --output table

echo "[5/8] Checking Allocated Elastic IPs (Unattached EIPs bill hourly!)..."
aws ec2 describe-addresses --region "$REGION" \
  --query "Addresses[*].[PublicIp,AllocationId,AssociationId]" --output table

echo "[6/8] Checking RDS Instances..."
aws rds describe-db-instances --region "$REGION" \
  --query "DBInstances[*].[DBInstanceIdentifier,DBInstanceClass,DBInstanceStatus]" --output table

echo "[7/8] Checking Manual RDS Snapshots..."
aws rds describe-db-snapshots --region "$REGION" --snapshot-type manual \
  --query "DBSnapshots[*].[DBSnapshotIdentifier,AllocatedStorage,Status]" --output table

echo "[8/8] Checking Available/In-Use EBS Volumes..."
aws ec2 describe-volumes --region "$REGION" \
  --filters "Name=status,Values=available,in-use" \
  --query "Volumes[*].[VolumeId,Size,State,VolumeType]" --output table

echo "=== Audit Complete. Verify all tables above are empty (or contain only intentionally retained resources). ==="
