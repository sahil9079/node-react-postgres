# Networking Fundamentals - Level 2: Intermediate

## 1. CIDR Subnetting & IP Calculations
CIDR (Classless Inter-Domain Routing) defines network and host portions:
* `/24` = 256 total IPs ($2^{32-24}$) -> 251 usable in AWS VPC (AWS reserves 5 IPs: Network, Router, DNS, Future, Broadcast).
* `/16` = 65,536 total IPs (Ideal VPC CIDR block, e.g., `10.0.0.0/16`).
* `/28` = 16 total IPs -> 11 usable in AWS.

## 2. Load Balancing: Layer 4 vs Layer 7
* **Layer 4 (Transport / NLB):** Routes based on IP and Port only. Extremely high throughput, ultra-low latency, handles millions of requests/sec. Does not inspect HTTP headers or URLs.
* **Layer 7 (Application / ALB):** Routes based on HTTP/HTTPS content (Host header, URL path, query params, cookies). Supports SSL termination, WebSocket, sticky sessions.

## 3. Hands-On Lab: Multi-Subnet Routing & Port Triage
```bash
# 1. Create a network namespace to simulate a private subnet:
sudo ip netns add privatenet

# 2. Create a veth (virtual ethernet) pair:
sudo ip link add veth-host type veth peer name veth-guest

# 3. Attach guest end to namespace and assign IPs:
sudo ip link set veth-guest netns privatenet
sudo ip addr add 10.10.0.1/24 dev veth-host
sudo ip link set veth-host up
sudo ip netns exec privatenet ip addr add 10.10.0.2/24 dev veth-guest
sudo ip netns exec privatenet ip link set veth-guest up

# 4. Verify connectivity across namespace boundary:
ping -c 2 10.10.0.2
sudo ip netns exec privatenet ping -c 2 10.10.0.1
```
