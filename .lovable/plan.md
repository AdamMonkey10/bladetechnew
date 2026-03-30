

## Data Dump of All Supabase Tables

Export all 45 tables from your Supabase database as CSV files into a single downloadable archive.

### Tables to export (45 total)
archive_shift_records, audit_log, box_number_sequences, calibration_records, clockfy_employee_mapping, clockfy_employees, clockfy_shift_assignments, clockfy_sync_log, clockfy_time_events, customer_pos, customers, equipment, goods_out, goods_received, label_printing_sessions, machines, milwaukee_test_reports, oee_daily_summary, operators, pallet_assignments, pallet_number_sequences, pallets, printed_labels, printer_settings, product_materials, product_specifications, products, raw_material_specifications, raw_materials, recipient_group_members, report_groups, report_recipients, shift_records, stock_items, suppliers, timesheet_tracking, warehouse_aisles, warehouse_bays, warehouse_layouts, warehouse_levels, warehouse_locations, warehouse_products, warehouse_slot_inventory, warehouse_stock_movements, weekly_reports

### Approach
1. Run `psql` COPY commands to export each table as a CSV file to `/mnt/documents/supabase-export/`
2. Each file named `{table_name}.csv` with headers
3. Provide all files for download

### Output
- 45 individual CSV files in `/mnt/documents/supabase-export/`
- No frontend changes

