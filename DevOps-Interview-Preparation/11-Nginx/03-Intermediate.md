# Nginx - Level 2: Production Reverse Proxy Configuration
```nginx
# /etc/nginx/conf.d/app.conf
upstream backend_cluster {
    least_conn;
    server 10.0.2.10:3000 max_fails=3 fail_timeout=10s;
    server 10.0.2.11:3000 max_fails=3 fail_timeout=10s;
    keepalive 32;
}

server {
    listen 80;
    server_name api.company.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.company.com;

    ssl_certificate /etc/ssl/certs/app.crt;
    ssl_certificate_key /etc/ssl/private/app.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://backend_cluster;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 5s;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```
