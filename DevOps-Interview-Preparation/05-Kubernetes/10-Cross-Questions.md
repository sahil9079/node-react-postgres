# Kubernetes Cross-Questioning Drill

### Initial Question: "What happens if a Pod's memory exceeds its defined limit?"
* **Candidate Answer:** *"The pod gets OOMKilled."*
* **Cross-Question 1:** *"What happens if a Pod's CPU exceeds its defined limit?"*
  * **Strong Answer:** *"CPU is a compressible resource. Unlike memory, exceeding CPU limits does **not** terminate the pod. Instead, the Linux CFS (Completely Fair Scheduler) throttles the container's CPU cycles (CPU throttling). The application slows down and response latency spikes, but the process continues running."*
