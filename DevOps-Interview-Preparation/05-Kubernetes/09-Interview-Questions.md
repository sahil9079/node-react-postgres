# Kubernetes Interview Question Bank

### Q1: What is the difference between a Liveness Probe and a Readiness Probe?
**Answer:**
* **Liveness Probe:** Determines if the container is healthy and running. If the liveness probe fails, the kubelet kills the container and initiates a restart according to the Pod's `restartPolicy`.
* **Readiness Probe:** Determines if the container is ready to accept incoming network traffic. If the readiness probe fails, Kubernetes removes the Pod's IP address from the Service's active **Endpoints**, stopping traffic until the probe passes again. The container is NOT restarted.
