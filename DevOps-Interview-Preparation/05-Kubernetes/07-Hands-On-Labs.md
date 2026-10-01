# Kubernetes Hands-On Labs

## Lab 1: Simulating and Debugging CrashLoopBackOff
1. Deploy a pod with an invalid command:
   ```bash
   kubectl run broken-pod --image=busybox -- /bin/sh -c "exit 1"
   ```
2. Observe status transition: `Pending -> Error -> CrashLoopBackOff`.
3. Triage:
   * `kubectl describe pod broken-pod` (Observe `Back-off restarting failed container`).
   * `kubectl logs broken-pod` (Observe exit behavior).
4. Cleanup: `kubectl delete pod broken-pod`
