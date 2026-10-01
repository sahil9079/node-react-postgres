# Networking Production Troubleshooting Matrix

| Issue | Root Cause | Commands to Diagnose | Permanent Fix |
| :--- | :--- | :--- | :--- |
| **Connection Refused** | No process listening on port or bound to localhost | `ss -tulpn \| grep :<PORT>` | Ensure app binds to `0.0.0.0`; verify process is running |
| **Connection Timed Out** | Security Group / Firewall dropping SYN packets silently | `traceroute -T -p <PORT> <IP>` | Open Security Group inbound rule from source CIDR |
| **Host Not Found (DNS)** | `/etc/resolv.conf` misconfigured or CoreDNS down | `dig @8.8.8.8 domain.com` | Update nameserver records or restart CoreDNS pods |
