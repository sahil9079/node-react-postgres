# Networking Hands-On Labs

## Lab 1: SSL Certificate Generation & Nginx HTTPS Setup
* **Objective:** Generate a self-signed TLS cert, configure Nginx SSL termination, and test using curl.
* **Steps:**
  1. Generate private key and cert:
     `openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /tmp/server.key -out /tmp/server.crt -subj "/CN=localhost"`
  2. Configure Nginx server block with `ssl_certificate` and `ssl_certificate_key`.
  3. Validate handshake: `curl -Iv https://localhost --cacert /tmp/server.crt`
