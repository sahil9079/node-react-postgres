# Linux Fundamentals - Level 4: Production Workflows

## 1. Production Log Analysis with AWK, SED, and GREP
In production DevOps, fast log parsing is critical during outages.

```bash
# 1. Extract Top 10 IP Addresses with 500 Internal Server Errors from Nginx logs
awk '$9 == 500 {print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -10

# 2. Extract specific timestamp range using sed
sed -n '/2026-10-01 10:00:00/,/2026-10-01 10:30:00/p' /var/log/app/production.log

# 3. Search recursively across compressed archive logs
zgrep -i "database connection refused" /var/log/app/app.log*.gz

# 4. Filter systemd journal logs by unit and priority (Error and above)
journalctl -u nginx -p err --since "1 hour ago" --no-pager
```

## 2. Linux Server Hardening Checklist
1. Disable password-based SSH authentication (`PasswordAuthentication no` in `/etc/ssh/sshd_config`).
2. Disable direct root login (`PermitRootLogin no`).
3. Configure UFW or firewalld (open only port 22, 80, 443).
4. Configure Automatic Security Updates (`unattended-upgrades`).
5. Configure system ulimits for high-load applications:
   ```ini
   # /etc/security/limits.conf
   * soft nofile 65535
   * hard nofile 65535
   ```
