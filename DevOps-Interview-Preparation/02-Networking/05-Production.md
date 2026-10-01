# Networking Fundamentals - Level 4: Production

## 1. Troubleshooting HTTP Status Codes
* **400 Bad Request:** Malformed JSON payload or invalid request syntax from client.
* **401 Unauthorized:** Missing or expired authentication token (JWT / Bearer token).
* **403 Forbidden:** Authenticated, but user lacks IAM/RBAC permissions to resource.
* **404 Not Found:** Route or resource does not exist.
* **500 Internal Server Error:** Unhandled exception in application backend code.
* **502 Bad Gateway:** Reverse Proxy/ALB received invalid or connection-refused from upstream container.
* **503 Service Unavailable:** Upstream server overloaded or backend target unhealthy.
* **504 Gateway Timeout:** Upstream application took too long to process and breached reverse proxy timeout limit.

## 2. Network Packet Capture with TCPDUMP
```bash
# Capture HTTP traffic on eth0 and inspect headers
sudo tcpdump -i eth0 -nn -A -s 0 'tcp port 80 and (((ip[2:2] - ((ip[0]&0xf)<<2)) - ((tcp[12:2]&0xf0)>>2)) != 0)'

# Save binary capture file for Wireshark inspection
sudo tcpdump -i any -w /tmp/outage_trace.pcap port 443 or port 80
```
