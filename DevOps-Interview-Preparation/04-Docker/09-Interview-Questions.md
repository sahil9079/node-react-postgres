# Docker Interview Question Bank

### Q1: What is the difference between `CMD` and `ENTRYPOINT` in a Dockerfile?
**Answer:** `ENTRYPOINT` defines the core executable process that will always run when the container starts. `CMD` provides default arguments to the `ENTRYPOINT` (or acts as the default command if no ENTRYPOINT is specified). Parameters passed to `docker run <image> <args>` will override `CMD`, but will be appended as arguments to `ENTRYPOINT`.
