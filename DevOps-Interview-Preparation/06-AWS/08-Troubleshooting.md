# AWS Troubleshooting Matrix

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| **IAM AccessDenied** | Missing action permission in IAM policy | Check CloudTrail event, update IAM role policy statement |
| **ALB Unhealthy Targets** | Healthcheck path mismatch or container down | Verify health check path (`/health`), port, and target security group |
| **Cannot SSH to EC2** | SG port 22 blocked or missing IGW route | Add inbound rule for port 22 from your IP; verify public IP & IGW route |
