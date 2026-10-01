# AWS Interview Question Bank

### Q1: What is the difference between an Application Load Balancer (ALB) and Network Load Balancer (NLB)?
**Answer:** An Application Load Balancer operates at Layer 7 (HTTP/HTTPS) and routes traffic based on request attributes like URL paths, host headers, and HTTP methods. It supports SSL termination, redirect rules, and sticky sessions. A Network Load Balancer operates at Layer 4 (TCP/UDP/TLS) and routes based strictly on IP and port. NLB is designed for ultra-high throughput, extreme low latency, supports static Elastic IPs, and handles sudden traffic spikes of millions of requests per second.
