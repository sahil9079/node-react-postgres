# Linux Interview Cross-Questioning Drill

### Initial Question: "How do you check server memory usage?"
* **Candidate Answer:** *"I run `free -m` to check free and used memory."*
* **Cross-Question 1:** *"If `free` shows only 100MB free, does that mean the server is running out of memory?"*
  * **Strong Answer:** *"No. Linux uses available RAM aggressively for the **Page Cache** and **Buffers** to speed up disk I/O. The crucial metric to look at is the `available` column in `free -m`, which shows memory that can be reclaimed immediately for new processes without swapping."*
* **Cross-Question 2:** *"What if `available` is very low and swap usage is increasing rapidly?"*
  * **Strong Answer:** *"That indicates severe memory pressure. I inspect top memory-consuming processes using `ps aux --sort=-%mem | head -10`, check `/var/log/messages` or `dmesg -T` for OOM Killer invocations, and evaluate tuning application heap limits or adding physical RAM."*
