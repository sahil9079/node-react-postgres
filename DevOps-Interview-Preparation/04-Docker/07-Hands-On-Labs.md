# Docker Hands-On Labs

## Lab 1: Multi-Stage Image Optimization Benchmark
1. Build a monolithic Node.js Dockerfile copying entire source code in one stage. Check size: `docker images | grep mono` (Size: ~950MB).
2. Build optimized multi-stage Alpine Dockerfile with `npm ci --only=production`. Check size: `docker images | grep multi` (Size: ~110MB).
3. Record 88% reduction in image size and build time.
