# Linux Fundamentals - Level 3: Advanced

## 1. Linux Kernel Internals: Inodes, VFS & File Descriptors
* **Inode Structure:** Every file has an Inode containing metadata (size, permissions, timestamps, pointer to disk blocks). The directory simply maps `filename -> Inode number`.
* **Inode Exhaustion (`df -i`):** If a system runs out of Inodes, new files cannot be created even if `df -h` shows 500GB of free space.
* **File Descriptors (FDs):** An integer assigned to an open file or socket. Standard FDs: `0` (stdin), `1` (stdout), `2` (stderr).

## 2. Memory Internals: Virtual Memory, Page Cache & Swappiness
* **Virtual Memory:** Allows processes to access contiguous address spaces mapped by the MMU to physical RAM or swap disk.
* **Page Cache:** Free RAM automatically used by the kernel to cache recently accessed disk blocks.
* **Swappiness (`/proc/sys/vm/swappiness`):** A value from 0 to 100 indicating kernel preference to swap memory pages to disk. (Set to `1` or `10` on database and Kubernetes nodes).

## 3. Advanced Diagnostic & Tracing Commands
```bash
# Trace System Calls of a Hanging Process
strace -p <PID> -s 2000 -f -e trace=network,file

# List Open Files and Sockets
lsof -i :8080            # Find which process is listening on port 8080
lsof -u appuser          # List all files opened by a specific user
lsof +L1                 # Identify deleted files still consuming disk via open FDs

# Memory and CPU Diagnostics
free -m                  # View allocated, free, buff/cache, and available RAM
vmstat 1 5               # Monitor CPU context switches, run queue, and memory paging
iostat -xz 1 5           # Monitor disk I/O utilization and service times
```
