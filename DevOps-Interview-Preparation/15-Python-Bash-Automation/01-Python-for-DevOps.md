# Python for DevOps Automation
```python
#!/usr/bin/env python3
import boto3
import requests
import sys

def check_alb_target_health(target_group_arn):
    client = boto3.client('elbv2', region_name='us-east-1')
    response = client.describe_target_health(TargetGroupArn=target_group_arn)
    
    unhealthy = []
    for target in response['TargetHealthDescriptions']:
        state = target['TargetHealth']['State']
        target_id = target['Target']['Id']
        if state != 'healthy':
            unhealthy.append((target_id, state, target['TargetHealth'].get('Reason', 'Unknown')))
            
    if unhealthy:
        print(f"ALERT: {len(unhealthy)} unhealthy targets found!")
        for uid, state, reason in unhealthy:
            print(f" - Target: {uid} | State: {state} | Reason: {reason}")
        sys.exit(1)
    else:
        print("All targets are healthy.")

if __name__ == '__main__':
    TG_ARN = sys.argv[1] if len(sys.argv) > 1 else 'arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/prod-tg/abc'
    check_alb_target_health(TG_ARN)
```
