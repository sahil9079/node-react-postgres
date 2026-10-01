# Networking Fundamentals - Level 3: Advanced

## 1. Deep Dive: TCP 3-Way Handshake & Teardown
```
      CLIENT                                  SERVER
         |                                       |
         | -------- 1. SYN (Seq=x) ------------> | (Listen State)
         |                                       |
         | <--- 2. SYN-ACK (Seq=y, Ack=x+1) ---- | (SYN_RECEIVED)
         |                                       |
         | -------- 3. ACK (Ack=y+1) ----------> | (ESTABLISHED)
         |                                       |
      (Data Transmission: HTTP Requests / Responses)
         |                                       |
         | -------- 4. FIN --------------------> | (Initiate Close)
         | <------- 5. ACK --------------------- |
         | <------- 6. FIN --------------------- |
         | -------- 7. ACK --------------------> |
      (TIME_WAIT: 60s)                           | (CLOSED)
```

## 2. SSL/TLS 1.3 Handshake Mechanics
1. **Client Hello:** Sends supported cipher suites and key share.
2. **Server Hello + Certificate + Key Share:** Server presents X.509 Certificate and public key.
3. **Key Derivation:** Both parties generate shared symmetric session key using Diffie-Hellman.
4. **Encrypted Application Data:** All subsequent communication encrypted with AES-256-GCM.
