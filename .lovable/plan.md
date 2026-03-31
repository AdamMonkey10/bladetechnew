

## Plan: Apply Schema Migration

The `label_printing_sessions` table is currently missing `customer_name`, `po_number`, `operator_name`, `laser_name` columns. The `pallets` table is missing `customer`. No code changes needed — only the migration.

### Steps

1. Run the provided SQL migration via the database migration tool to add:
   - `customer_name`, `po_number`, `operator_name`, `laser_name` to `label_printing_sessions`
   - `customer` to `pallets`

2. Confirm the columns exist after migration completes.

No TypeScript files will be touched.

