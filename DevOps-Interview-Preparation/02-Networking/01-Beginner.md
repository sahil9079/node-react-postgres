# Networking Fundamentals - Level 0: Beginner

## 1. What is Computer Networking?
Computer networking is the practice of connecting computing devices (servers, containers, databases, users) so they can exchange data and share resources over standardized communication protocols.

## 2. Why do we need it in DevOps?
* **Microservice Communication:** Containers and Pods constantly talk to each other over internal networks.
* **External Client Access:** Directing user traffic securely from the public internet through firewalls and load balancers to backend applications.
* **Security Isolation:** Isolating databases in private subnets without public internet exposure.

## 3. Real-World Analogy
* **IP Address:** A physical house address (tells postal services where you live).
* **Port Number:** An apartment door number (tells mail handlers which specific room/service to deliver to).
* **Router / Gateway:** The neighborhood post office directing mail outside the city.
* **DNS:** The phonebook (maps friendly names like `google.com` to numeric IP addresses like `142.250.190.46`).

## 4. Basic Terminology
* **IP Address (IPv4):** A 32-bit numeric identifier (e.g., `192.168.1.100`).
* **Port:** A communication endpoint (e.g., 80 for HTTP, 443 for HTTPS, 22 for SSH, 5432 for Postgres).
* **DNS (Domain Name System):** Translates human-readable domain names into IP addresses.
* **NAT (Network Address Translation):** Allows multiple private IPs to share a single public IP to access the internet.
