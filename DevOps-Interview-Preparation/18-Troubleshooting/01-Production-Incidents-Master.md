# Master Production Incident Troubleshooting Playbook

## Incident 1: HTTP 502 Bad Gateway Triage
```
Symptom: External users receive HTTP 502.
1. Check Load Balancer Access Logs:
   -> ELB 502 indicates backend targets failed to return valid HTTP response.
2. Check Ingress Controller Pod Logs:
   -> kubectl logs -n ingress-nginx ingress-nginx-controller-xxx
   -> Look for: "connect() failed (111: Connection refused)" or "upstream closed connection".
3. Check Target Endpoints:
   -> kubectl get ep <service-name>
   -> If Endpoints are empty, verify Service label selectors match Pod labels.
4. Check Pod Status:
   -> kubectl get pods -l app=<app>
   -> If CrashLoopBackOff or OOMKilled, inspect kubectl describe pod and kubectl logs --previous.
5. Check Port Binding:
   -> Verify container is listening on 0.0.0.0, and targetPort matches container port.
```

## Incident 2: Pod in CrashLoopBackOff
```
1. Run: kubectl logs <pod-name> --previous
   -> Reveals unhandled application crash or missing database credentials.
2. Run: kubectl describe pod <pod-name>
   -> Inspect Exit Code (e.g. Exit Code 137 = OOMKilled).
3. Check ConfigMaps and Secrets:
   -> Verify environment variable names match application expectations.
```
