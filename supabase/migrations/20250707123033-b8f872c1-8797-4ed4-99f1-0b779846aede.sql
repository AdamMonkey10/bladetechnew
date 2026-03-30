-- Phase 1: Add missing date indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_shift_records_date ON public.shift_records (shift_date);
CREATE INDEX IF NOT EXISTS idx_goods_received_date ON public.goods_received (received_date);
CREATE INDEX IF NOT EXISTS idx_calibration_records_date ON public.calibration_records (calibration_date);
CREATE INDEX IF NOT EXISTS idx_milwaukee_test_reports_date ON public.milwaukee_test_reports (test_date);
CREATE INDEX IF NOT EXISTS idx_printed_labels_date ON public.printed_labels (print_date);

-- Phase 2: Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_milwaukee_test_reports_composite ON public.milwaukee_test_reports (test_date DESC, product_id, operator_id, machine_id);
CREATE INDEX IF NOT EXISTS idx_printed_labels_composite ON public.printed_labels (print_date DESC, po, customer);
CREATE INDEX IF NOT EXISTS idx_shift_records_composite ON public.shift_records (shift_date DESC, operator_id, machine_id);
CREATE INDEX IF NOT EXISTS idx_goods_received_composite ON public.goods_received (received_date DESC, raw_material_id, supplier);

-- Phase 3: Add indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_milwaukee_test_reports_analytics ON public.milwaukee_test_reports (created_at DESC, defect_rate, total_saws) WHERE defect_rate IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shift_records_analytics ON public.shift_records (created_at DESC, shift_type) WHERE production_data IS NOT NULL;