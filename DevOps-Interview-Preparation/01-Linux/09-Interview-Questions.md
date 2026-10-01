# Linux Interview Question Bank (With Model Answers)

### Q1: What is the difference between hard links and soft links?
**Answer:** A hard link points directly to the Inode number of the file, sharing the same metadata, permissions, and data blocks. Deleting the original name does not delete the data until all hard links are removed (`nlink = 0`). Hard links cannot cross filesystems. A soft link (symbolic link) is an independent file with its own Inode containing a string path pointing to another file. If the target is moved or deleted, the soft link breaks.

### Q2: What is the Linux OOM Killer and how does it choose which process to kill?
**Answer:** The Out of Memory (OOM) Killer is a kernel mechanism that activates when the system runs out of physical RAM and swap space. To prevent a complete kernel panic, it terminates processes based on their `oom_score` (found in `/proc/<PID>/oom_score`). The score is calculated based on RAM consumption percentage and runtime length. High-memory processes that are recently spawned receive the highest `oom_score` and get terminated with SIGKILL (Exit Code 137).

### Q3: How do you identify which process is causing high disk I/O?
**Answer:** I use `iotop -o` or `pidstat -d 1` to view real-time read and write rates per process. I also use `iostat -xz 1` to monitor disk utilization (`%util`) and average wait time (`await`).
