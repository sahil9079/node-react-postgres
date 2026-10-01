# Networking Interview Question Bank

### Q1: What happens when you type `https://api.company.com` in your browser?
**Answer:**
1. **DNS Resolution:** Browser checks local cache, OS cache, `/etc/hosts`, then queries recursive DNS servers to resolve `api.company.com` to an IP.
2. **TCP 3-Way Handshake:** Client initiates connection to target IP on port 443 (SYN -> SYN-ACK -> ACK).
3. **TLS Handshake:** Client and server negotiate cipher suite, authenticate server X.509 certificate, and derive symmetric session keys.
4. **HTTP Request:** Client sends encrypted `GET / HTTP/1.1` request with Host headers.
5. **Reverse Proxy / Load Balancer:** ALB or Nginx terminates TLS and forwards request to backend container.
6. **Application Response:** Backend returns JSON response with status code 200 OK.
7. **Connection Teardown:** TCP connection closes gracefully or is reused via HTTP Keep-Alive.
