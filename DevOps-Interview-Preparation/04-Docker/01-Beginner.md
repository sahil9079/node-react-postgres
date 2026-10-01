# Docker Fundamentals - Level 0: Beginner

## 1. What is Docker?
Docker is an open-source platform that packages an application and all its dependencies (runtime, system libraries, configuration files) into a lightweight, standalone executable unit called a **Container**.

## 2. Why do we need it?
* **Eliminates "It works on my machine":** Ensures software runs identically in development, testing, staging, and AWS production.
* **Fast Startup:** Containers launch in milliseconds compared to minutes for Virtual Machines.
* **High Density:** Containers share the host OS kernel, allowing dozens of services to run on a single host.

## 3. Real-World Analogy
Think of shipping cargo:
* **Before Containers:** Cargo was loaded loose in ships—barrels, boxes, and sacks had to be manually re-packed at every port (analogous to installing software libraries manually on every server).
* **With Standard Shipping Containers:** Standardized steel boxes fit on any ship, train, or truck without inspecting the contents (analogous to Docker container images running anywhere Docker Engine is installed).
