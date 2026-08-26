# Level 1: Linux & Server Administration Fundamentals

> **Experience Target:** 1-Year Junior/Associate DevOps Engineer  
> **Topic Scope:** OS concepts, CLI diagnostics, CPU/Memory/Disk inspection, process lifecycle, signal handling, SSH troubleshooting, and Linux filesystem internals.

---

## 1. Core Linux Diagnostics & Resource Monitoring

### Q1. What Linux distribution are you using in your project containers and why?
* **Real Project Answer:**
  * In my project, I chose **`node:18-slim`** (Debian-based) for the backend API and **`nginx:1.29-alpine`** (Alpine Linux) for the React frontend runtime.
  * **Why Alpine for Nginx:** It has an ultra-small base footprint (~5MB), resulting in a tiny **23MB final production image**. It serves static assets with minimal attack surface and rapid image pull times.
  * **Why Debian-Slim for Node.js:** Node.js applications with native C++ dependencies (such as `sharp` for image resizing and `bcryptjs` for password hashing used in this codebase) require standard **`glibc`**. Alpine uses `musl libc`, which can cause compatibility issues and slower compilation of native binaries during `npm ci`.

---

### Q2. How do you inspect CPU utilization and identify CPU bottlenecks?
* **Commands:**
  ```bash
  top                  # Real-time process viewer. Press '1' to view per-core CPU breakdown.
  htop                 # Colorized, interactive process monitor showing CPU, memory, and thread trees.
  uptime               # Shows system uptime and load averages over 1, 5, and 15 minutes.
  mpstat -P ALL 1      # Detailed CPU metrics (user, sys, iowait, idle) per core updated every 1s.
  ```
* **Understanding Load Average:**
  * Load average is the average number of processes in a **runnable** or **uninterruptible sleep (I/O wait)** state.
  * On a 4-core server:
    * Load of `2.0` $\implies$ 50% CPU capacity utilized.
    * Load of `4.0` $\implies$ 100% capacity (fully utilized).
    * Load of `8.0` $\implies$ System overloaded; 4 processes are waiting in queue for CPU time.
* **Diagnosing High CPU:**
  ```bash
  ps aux --sort=-%cpu | head -n 10   # Find top 10 CPU-consuming processes by PID
  top -p <PID>                       # Monitor single process in isolation
  ```

---

### Q3. How do you inspect Memory utilization and identify swapping?
* **Commands:**
  ```bash
  free -m              # RAM summary in Megabytes (Total, Used, Free, Shared, Buff/Cache, Available)
  vmstat 1 5           # Reports memory, paging (si/so), block I/O (bi/bo), and context switches
  cat /proc/meminfo    # Kernel-level detailed memory allocation metrics
  ```
* **Key Fields in `free -m`:**
  * **`used`:** Memory actively allocated by user processes.
  * **`buff/cache`:** Memory used by Linux kernel for disk caching and file buffers. Linux automatically reclaims this memory if processes request more RAM.
  * **`available`:** The **real metric** to watch—indicates how much RAM can be allocated without causing the system to swap.
* **Detecting Out of Memory (OOM):**
  ```bash
  dmesg -T | grep -i oom       # Check kernel ring buffer for OOM killer invocations
  grep -i "killed process" /var/log/syslog
  ```

---

### Q4. How do you inspect Disk space, Inodes, and Disk I/O?
* **Commands:**
  ```bash
  df -h                # Human-readable disk space usage by filesystem mount
  df -i                # Inode usage percentage (important: 100% inodes blocks file creation even with GBs free)
  du -sh /var/log/*    # Directory sizes sorted to identify runaway log files
  lsblk                # Lists block devices, partitions, UUIDs, and mount points
  iostat -xz 1         # Reports disk I/O metrics (%util, await, r/s, w/s)
  ```
* **Troubleshooting 100% Disk Space:**
  1. Identify the largest directories:
     ```bash
     du -ahx / | sort -rh | head -n 20
     ```
  2. Safely truncate large active log files without breaking active file descriptors:
     ```bash
     > /var/log/syslog          # Truncates file to 0 bytes instantly
     journalctl --vacuum-time=2d # Removes systemd logs older than 2 days
     ```
  3. Clean Docker dangling images and cache:
     ```bash
     docker system prune -af --volumes
     ```
  4. Identify open unlinked files holding space:
     ```bash
     lsof +L1
     # If an open file was deleted with 'rm', the space isn't freed until the process is restarted.
     ```

---

## 2. Process Management & Signal Handling

### Q1. How do you terminate processes gracefully vs forcefully?
* **SIGTERM (`kill -15 <PID>`):**
  * Asks the process to shut down **gracefully**.
  * The application intercepts `process.on('SIGTERM')`, closes active database connections (Sequelize `sampledb.close()`), finishes in-flight HTTP requests, and exits cleanly.
* **SIGKILL (`kill -9 <PID>`):**
  * Sent directly to the Linux kernel; the process cannot catch or ignore it.
  * Immediately kills the process. Can leave corrupt temporary files or orphan database transactions. Always try `kill -15` first.
* **SIGINT (`kill -2 <PID>` or `Ctrl + C`):**
  * Terminal interrupt signal.

---

### Q2. How do systemd services work and how do you manage them?
```bash
sudo systemctl start <service_name>
sudo systemctl stop <service_name>
sudo systemctl restart <service_name>
sudo systemctl reload <service_name>      # Reloads configuration without dropping connections (e.g. Nginx)
sudo systemctl status <service_name>
sudo systemctl enable <service_name>      # Configures service to start on system boot
journalctl -u <service_name> -f           # Follow live logs for specific systemd unit
```

---

## 3. Linux Networking & SSH Troubleshooting

### Q1. Which commands do you use to troubleshoot network connectivity and open ports?
```bash
ip addr show                         # View network interfaces and assigned IP addresses
netstat -tulpn                       # List all listening TCP/UDP ports with corresponding PIDs
ss -tulpn                            # Modern, faster alternative to netstat
lsof -i :8010                        # Identify which process is listening on port 8010
curl -Iv http://localhost:8010/health # Check HTTP status and response headers
nc -zv 10.0.1.50 5432                # Test TCP connection to PostgreSQL on port 5432
traceroute <host>                    # Trace network hops to destination
nslookup <domain>                    # Check DNS resolution
dig <domain> +trace                  # Detailed DNS resolution path
```

---

### Q2. Walk me step-by-step through troubleshooting an SSH connection failure.
1. **Run verbose SSH debug output:**
   ```bash
   ssh -vvv -i ~/.ssh/my-key.pem ubuntu@<IP_ADDRESS>
   ```
2. **Check private key permissions:**
   * SSH client rejects keys with loose permissions:
     ```bash
     chmod 400 ~/.ssh/my-key.pem
     ```
3. **Verify AWS Security Group Ingress:**
   * Ensure port 22 allows inbound traffic from your current public IP.
4. **Verify Subnet Route Table:**
   * Ensure the instance is in a public subnet with `0.0.0.0/0` routed to an Internet Gateway (`igw-xxxx`).
5. **Verify AWS Network ACL (NACL):**
   * NACLs are stateless. Ensure inbound allows port 22 and outbound allows ephemeral ports (`1024–65535`).
