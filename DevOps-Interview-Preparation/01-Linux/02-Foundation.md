# Linux Fundamentals - Level 1: Foundation

## 1. Architecture & Components
Linux architecture is divided into two primary memory spaces:
```
+-------------------------------------------------------------+
|                         USER SPACE                          |
|  User Apps (Node.js, Nginx) | Shell (Bash) | Libraries      |
+-------------------------------------------------------------+
                              | System Calls (open, fork, read)
                              v
+-------------------------------------------------------------+
|                        KERNEL SPACE                         |
|  Process Mgmt | Memory Mgmt | VFS / Storage | Network Stack |
+-------------------------------------------------------------+
                              | Device Drivers
                              v
+-------------------------------------------------------------+
|                          HARDWARE                           |
|                 CPU  |  RAM  |  Disk  |  NIC                |
+-------------------------------------------------------------+
```

## 2. Linux Filesystem Hierarchy (FHS)
* `/` : The root directory from which all other paths branch.
* `/etc` : System-wide configuration files (e.g., `/etc/nginx/nginx.conf`, `/etc/fstab`).
* `/var` : Variable data that changes during operation (`/var/log`, `/var/lib/docker`).
* `/proc` & `/sys` : Virtual filesystems presenting kernel and process states in memory.
* `/home` : User home directories.
* `/bin` & `/usr/bin` : Executable binary programs.
* `/tmp` : Temporary files (cleared upon reboot).

## 3. Essential Foundation Commands
```bash
# Navigation & File Operations
ls -lha              # Detailed listing with hidden files and human sizes
pwd                  # Print working directory
mkdir -p a/b/c       # Recursive directory creation
cp -r src/ dest/     # Recursive copy
rm -rf old_dir/      # Forceful recursive deletion (use with extreme care)

# File Viewing & Inspection
cat /etc/os-release  # Display distribution info
head -n 20 app.log   # First 20 lines
tail -n 20 -f app.log# Last 20 lines with live streaming follow
less /var/log/syslog # Interactive file pager
```

## 4. Beginner Hands-On Lab
1. Create a workspace: `mkdir -p ~/devops_lab && cd ~/devops_lab`
2. Create test files and subdirectories: `touch server_{1..5}.log && mkdir logs`
3. Move all log files into `logs/`: `mv *.log logs/`
4. Inspect the directory structure using `ls -la logs/`
