# PostgreSQL & MySQL Administration for DevOps
## 1. PostgreSQL Essential Operations
```bash
# Connect to PostgreSQL CLI
psql -h localhost -U postgres -d appdb

# Automated Backup (Dump)
pg_dump -h localhost -U postgres -Fc appdb > appdb_$(date +%F).dump

# Restore Backup
pg_restore -h localhost -U postgres -d appdb -v appdb_2026-10-01.dump

# Connection Pool & Active Queries Diagnostics
SELECT pid, usename, client_addr, state, query, age(clock_timestamp(), query_start) 
FROM pg_stat_activity 
WHERE state != 'idle';
```
