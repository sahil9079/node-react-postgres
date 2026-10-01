# Docker Cross-Questioning Drill

### Initial Question: "How do you reduce Docker image size?"
* **Candidate Answer:** *"I use Alpine base images and multi-stage builds."*
* **Cross-Question 1:** *"What are the potential risks or trade-offs of using Alpine Linux in production Java or Python applications?"*
  * **Strong Answer:** *"Alpine uses `musl libc` instead of `glibc`. For Python with C-extensions (e.g. pandas, numpy) or certain Java native integrations, this requires compiling wheels from source, which can slow down build times or cause subtle binary incompatibilities. In those cases, a Debian-slim or Distroless image is safer while maintaining a minimal security footprint."*
