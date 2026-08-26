# Backup & Disaster Recovery Plan

## Overview

This document outlines the backup protocols, recovery strategies, and Disaster Recovery (DR) targets for CandyEco (`candy_client`).

---

## Service Recovery Objectives

- **Recovery Point Objective (RPO)**: Maximum acceptable data loss period = **1 Hour**.
- **Recovery Time Objective (RTO)**: Maximum acceptable downtime = **30 Minutes**.

---

## Backup Targets & Schedules

| Asset / Layer | Storage Location | Backup Method | Frequency | Retention |
|---|---|---|---|---|
| **PostgreSQL Database** | Managed DB Host / S3 Storage | `pg_dump` & WAL Archiving | Daily Full + Hourly Incremental | 30 Days |
| **Redis In-Memory State** | Redis Server / Disk | RDB Snapshots & AOF | Every 6 Hours | 7 Days |
| **Media Assets** | Cloudinary Cloud | Cloudinary Managed Backups | Automatic Multi-Region | Persistent |
| **Database Migrations** | Git Repository (`prisma/migrations`) | Version Control | On Every Commit | Permanent |
| **Application State & Config** | Environment Variables Vault | Encrypted Vault Backup | On Modification | Permanent |

---

## PostgreSQL Backup Procedures

### Automated Backup Script (`scripts/backup-db.sh`)

```bash
#!/usr/bin/env bash
set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/candyeco"
BACKUP_FILE="${BACKUP_DIR}/candyeco_db_${TIMESTAMP}.sql.gz"

mkdir -p ${BACKUP_DIR}

echo "Starting PostgreSQL backup..."
pg_dump "${DATABASE_URL}" | gzip > "${BACKUP_FILE}"

echo "Backup created successfully: ${BACKUP_FILE}"

# Retention cleanup: Remove backups older than 30 days
find ${BACKUP_DIR} -type f -name "candyeco_db_*.sql.gz" -mtime +30 -delete
```

---

## Recovery & Restoration Playbook

### 1. Database Disaster Restoration

In the event of database corruption or hardware failure:

1. Provision a clean PostgreSQL instance.
2. Download the latest backup `.sql.gz` artifact.
3. Decompress and restore schema/data:
   ```bash
   gunzip -c candyeco_db_20260823_120000.sql.gz | psql "${NEW_DATABASE_URL}"
   ```
4. Run Prisma schema synchronization to verify indices:
   ```bash
   npx prisma db pull
   npx prisma generate
   ```
5. Execute product tag verification:
   ```bash
   npm run db:ensure-tags
   ```

### 2. Migration Rollback Procedure

If a deployed database migration fails or introduces schema degradation:

1. Refer to `rollback.sql` in the repository root or migration directory.
2. Execute the inverse DDL commands in SQL console:
   ```bash
   psql "${DATABASE_URL}" -f rollback.sql
   ```
3. Re-deploy the previous stable commit application build.

### 3. Redis Cache Reconstruction

Since Redis stores ephemeral data (user presence, transient session counters), a corrupted Redis instance can be safely restarted or flushed:

1. Flush corrupted keys: `redis-cli flushall`
2. Restart application process: `pm2 restart candy-client`
3. Presence state and query caches will automatically re-populate on user activity.

---

## Backup Integrity Testing

1. **Monthly Restore Drills**: On the first Monday of every month, perform a full database restore onto a staging environment.
2. **Checksum Verification**: Validate MD5/SHA256 checksums of backup archives post-generation.
