# Linux Production Troubleshooting Guide

## Troubleshooting Matrix

| Issue | Potential Cause | Diagnostic Command | Permanent Solution |
| :--- | :--- | :--- | :--- |
| **No space left on device** (df -h shows free space) | Inode Exhaustion | `df -i` | Remove unused files; cleanup old logs/sessions. |
| **Too many open files** | Process hit ulimit | `cat /proc/<PID>/limits` | Increase `nofile` in `/etc/security/limits.conf` |
| **Process Killed unexpectedly** | Linux OOM Killer invoked | `dmesg -T \| grep -i oom` | Optimize memory usage or increase swap/RAM. |
| **Service fails to bind to port** | Port already in use | `sudo netstat -tulpn \| grep :<PORT>` | Stop conflicting process or change port. |
| **Permission Denied for sudo user** | User not in sudoers group | `id <username>` | `sudo usermod -aG sudo <username>` |
