# Networking Fundamentals - Level 1: Foundation

## 1. The OSI vs TCP/IP Model
```
OSI 7 LAYERS                     TCP/IP MODEL              DEVOPS PROTOCOLS
+-------------------------+     +-------------------+     +-------------------------+
| 7. Application Layer    | --> | Application Layer | --> | HTTP, HTTPS, DNS, SSH   |
| 6. Presentation Layer   |     |                   |     | TLS/SSL Encryption      |
| 5. Session Layer        |     |                   |     | Session Management      |
+-------------------------+     +-------------------+     +-------------------------+
| 4. Transport Layer      | --> | Transport Layer   | --> | TCP, UDP (Ports)        |
+-------------------------+     +-------------------+     +-------------------------+
| 3. Network Layer        | --> | Internet Layer    | --> | IP, ICMP, Routing       |
+-------------------------+     +-------------------+     +-------------------------+
| 2. Data Link Layer      | --> | Network Interface | --> | Ethernet, MAC, Switches |
| 1. Physical Layer       |     |                   |     | Fiber, Cables           |
+-------------------------+     +-------------------+     +-------------------------+
```

## 2. TCP vs UDP
* **TCP (Transmission Control Protocol):** Connection-oriented, reliable, ordered data stream with error checking and retransmission (HTTP/HTTPS, SSH, Database connections).
* **UDP (User Datagram Protocol):** Connectionless, lightweight, low-latency protocol with no retransmission guarantees (DNS queries, Video streaming, VoIP).

## 3. Essential Diagnostic Commands
```bash
# Test Connectivity and Latency
ping -c 4 8.8.8.8

# Test Port Reachability
nc -zv 10.0.1.50 5432       # Netcat test to PostgreSQL port
telnet 10.0.1.50 80

# DNS Lookup Diagnostics
nslookup api.company.internal
dig +trace api.company.internal

# Active Socket and Routing Inspection
ss -tulpn                   # Fast socket inspection (replaces netstat)
ip route show               # View default gateway and routing table
curl -Iv https://example.com# Detailed HTTP response headers and SSL handshake
```
