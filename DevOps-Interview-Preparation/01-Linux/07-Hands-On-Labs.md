# Linux Hands-On Labs

## Lab 1: Simulating and Resolving Out of Inodes Outage
* **Objective:** Experience and fix an inode exhaustion outage.
* **Steps:**
  1. Create a 10MB test image: `dd if=/dev/zero of=/tmp/disk.img bs=1M count=10`
  2. Format with low inodes: `mkfs.ext4 -N 200 /tmp/disk.img`
  3. Mount: `sudo mkdir -p /mnt/inodelab && sudo mount -o loop /tmp/disk.img /mnt/inodelab`
  4. Exhaust inodes: `sudo bash -c 'for i in $(seq 1 300); do touch /mnt/inodelab/f_$i.txt; done'`
  5. Diagnose using `df -h` vs `df -i`.
  6. Batch clean: `find /mnt/inodelab -type f -name "f_*.txt" -print0 | xargs -0 sudo rm -f`

## Lab 2: Diagnosing "Ghost" Disk Leaks (Unlinked File Descriptors)
* **Objective:** Reclaim disk space locked by a deleted file without restarting the application.
* **Steps:**
  1. Start a python script holding a huge file open:
     `python3 -c 'import time; f=open("/tmp/bigleak.log","w"); f.write("0"*100000000); time.sleep(600)' &`
  2. Note the PID. Delete the file: `rm /tmp/bigleak.log`
  3. Notice `df -h` does not free space.
  4. Run `lsof +L1` to locate PID and FD number.
  5. Truncate FD: `sudo truncate -s 0 /proc/<PID>/fd/<FD_NUM>`
  6. Verify space is reclaimed in `df -h`.
