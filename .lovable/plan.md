

# Weekly Backup + Time Machine System

## Summary
Automated weekly JSON backups stored in both cloud storage AND the existing GitHub project repo (in a `backups/` folder). Includes a Time Machine UI to browse and selectively restore historical data.

## Architecture

```text
pg_cron (Sunday 3AM)
    │
    ▼
database-backup (Edge Function)
    ├── Export all tables → JSON
    ├── Upload to private storage bucket
    ├── Push to GitHub repo: backups/YYYY-MM-DD/full-backup.json
    └── Log to backup_logs table

Time Machine UI (/backups)
    ├── Browse backup timeline
    ├── View historical table data
    ├── Diff against current live data
    └── Restore selected tables or records
```

## Implementation

### 1. Database Migration
- **`backup_logs`** table: id, backup_date, file_path, github_url, file_size_bytes, tables_included (jsonb), status, action_type (backup/restore/cleanup), error_message, created_at, completed_at
- **Private `backups` storage bucket**
- RLS: authenticated users can read logs

### 2. Edge Function: `database-backup`
- Exports tables: shift_records, operators, machines, products, raw_materials, customers, customer_pos, goods_received, printed_labels, pallets, calibration_records, registered_devices, oee_daily_summary, equipment, stock_items
- Uploads JSON to storage bucket at `backups/YYYY-MM-DD/full-backup.json`
- Pushes same file to GitHub repo at `backups/YYYY-MM-DD/full-backup.json` via GitHub Contents API
- Supports `action=cleanup` to purge cloud storage files older than 30 days (GitHub retains all)
- Requires `GITHUB_BACKUP_TOKEN` secret (PAT with `repo` scope)

### 3. Edge Function: `backup-restore`
- Accepts backup date + optional table name + optional record IDs
- Downloads snapshot from storage (or GitHub for older backups beyond 30 days)
- Takes a pre-restore snapshot of affected table before overwriting
- Table restore: deletes existing rows, inserts from snapshot
- Record restore: upserts individual records by ID
- Logs restore action to `backup_logs`

### 4. Scheduled Jobs (via insert tool, not migration)
- Weekly backup: Sunday 3:00 AM
- Daily cleanup: 4:00 AM (cloud storage only)
- Fix broken legacy `update-timesheet-tracking-daily` cron job URL

### 5. UI: `/backups` Page
- **History tab**: backup log table with status, size, download + GitHub links
- **Time Machine tab**:
  - Timeline/calendar showing available backup points
  - Table browser: pick a date, pick a table, see paginated records
  - Diff view: highlights added/removed/changed rows vs live data
  - Restore controls: restore full table or selected records with confirmation dialog
- Summary cards: last backup, next scheduled, storage used
- Manual "Run Backup Now" button

### 6. Navigation & Routing
- Add `/backups` route in `App.tsx`
- Add "Backups" to Utilities dropdown in `AppHeader.tsx`
- New `useBackups.tsx` hook for log fetching, snapshot browsing, restore triggers

## Files Changed

| File | Action |
|------|--------|
| Migration SQL | `backup_logs` table + storage bucket |
| `supabase/functions/database-backup/index.ts` | New |
| `supabase/functions/backup-restore/index.ts` | New |
| `src/pages/Backups.tsx` | New |
| `src/hooks/useBackups.tsx` | New |
| `src/App.tsx` | Add route |
| `src/components/layout/AppHeader.tsx` | Add nav link |
| Insert SQL | Cron jobs |

## What You Need to Provide
- **GitHub Personal Access Token** with `repo` scope (I'll use the secrets tool to store it securely)

