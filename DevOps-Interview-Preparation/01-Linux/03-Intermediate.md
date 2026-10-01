# Linux Fundamentals - Level 2: Intermediate

## 1. Users, Groups, and Linux Permissions
Linux permissions are based on Owner (u), Group (g), and Others (o).
* **Read (r = 4):** View file contents or list directory contents.
* **Write (w = 2):** Modify file contents or create/delete files in directory.
* **Execute (x = 1):** Execute file as a binary/script or `cd` into directory.

```bash
# Changing Permissions & Ownership
chmod 755 script.sh      # rwxr-xr-x (Owner full, group/others read+execute)
chmod 600 id_rsa         # rw------- (Strict permission for private SSH keys)
chmod -R 750 /app        # Recursive permission change
chown -R appuser:appgroup /var/www/html # Change owner and group
```

## 2. Process Management & Systemd Services
Every running program in Linux is a **Process** with a unique **PID** (Process ID).
```bash
# Inspecting Processes
ps aux | grep node       # List all running Node.js processes
top / htop               # Real-time process and resource monitor
kill -15 <PID>           # SIGTERM (Graceful shutdown request)
kill -9 <PID>            # SIGKILL (Forced immediate termination by kernel)

# Systemd Service Management
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx       # Zero-downtime configuration reload
sudo systemctl status nginx
sudo systemctl enable nginx       # Enable auto-start on boot
```

## 3. Intermediate Hands-On Project: Custom Systemd Daemon
Create a production-like background service for a Node.js application:

```ini
# /etc/systemd/system/nodeapp.service
[Unit]
Description=Node.js Production Application
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/nodeapp
ExecStart=/usr/bin/node /var/www/nodeapp/server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```
* **Activation commands:**
  ```bash
  sudo systemctl daemon-reload
  sudo systemctl start nodeapp
  sudo systemctl enable nodeapp
  ```
