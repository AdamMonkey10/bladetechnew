

# Migrate Schema to Lovable Cloud and Remove External Supabase

## Context

Your project currently connects to an **external Supabase project** (`bujljvgiskdxzahztybs`). You have **130+ migration files** already in `supabase/migrations/` that define ~35 tables, 2 views, 12+ functions, RLS policies, triggers, and foreign key relationships.

## Important Caveat

**This will migrate only the schema (structure), not the data.** If you need to migrate existing data from the old Supabase project, that would be a separate step after the schema is in place.

## Plan

### Step 1: Enable Lovable Cloud
- Activate Lovable Cloud for this project via the Cloud tab. This spins up a new Supabase-backed database.
- The existing 130+ migration files in `supabase/migrations/` will be applied automatically, recreating all tables, views, functions, RLS policies, and triggers.

### Step 2: Update Supabase Client Configuration
- Update `src/integrations/supabase/client.ts` to use the new Lovable Cloud URL and anon key (these are auto-generated when Cloud is enabled).
- Update `.env` to reflect the new `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_SUPABASE_PROJECT_ID`.
- Update `supabase/config.toml` with the new project ID.

### Step 3: Re-deploy Edge Functions
- The existing edge functions in `supabase/functions/` (clockfy-webhook, customer-api, analyze-weekly-breakdown, etc.) will automatically deploy to the new Lovable Cloud backend.
- Re-add the secrets (`CUSTOMER_API_KEYS`, `OPENAI_API_KEY`, `QC_API_ENDPOINT`) to the new Cloud instance.

### Step 4: Verify
- Confirm all tables are created in the new Cloud database.
- Test authentication flow.
- Verify edge functions respond correctly.

### Technical Details

**Tables being migrated (35):** archive_shift_records, audit_log, box_number_sequences, calibration_records, clockfy_employee_mapping, clockfy_employees, clockfy_shift_assignments, clockfy_sync_log, clockfy_time_events, customer_pos, customers, equipment, goods_out, goods_received, label_printing_sessions, machines, milwaukee_test_reports, oee_daily_summary, operators, pallet_assignments, pallet_number_sequences, pallets, printed_labels, printer_settings, product_materials, product_specifications, products, raw_material_specifications, raw_materials, recipient_group_members, report_groups, report_recipients, shift_records, stock_items, suppliers, timesheet_tracking, warehouse_aisles, warehouse_bays, warehouse_layouts, warehouse_levels, warehouse_locations, warehouse_products, warehouse_slot_inventory, warehouse_stock_movements, weekly_reports

**Views:** analytics_summary, goods_movements

**Functions (12+):** calculate_daily_oee_summary, delete_pallets_by_numbers, delete_printed_labels_by_date, fix_missing_hours, generate_next_box_number, generate_next_pallet_number, generate_weekly_production_report, get_data_quality_metrics, get_stock_levels, populate_oee_summaries, update_po_progress, update_timesheet_tracking

**Files modified:** `src/integrations/supabase/client.ts`, `.env`, `supabase/config.toml`

