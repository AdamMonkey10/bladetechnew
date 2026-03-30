-- Phase 1: Add Essential Database Indexes for Performance Optimization

-- Index on machines.active (frequently filtered)
CREATE INDEX IF NOT EXISTS idx_machines_active ON public.machines(active);

-- Index on operators.active (frequently filtered) 
CREATE INDEX IF NOT EXISTS idx_operators_active ON public.operators(active);

-- Composite index on printed_labels for shift form queries
CREATE INDEX IF NOT EXISTS idx_printed_labels_operator_date ON public.printed_labels(operator, print_date);

-- Index on customer_pos.status for filtering open POs
CREATE INDEX IF NOT EXISTS idx_customer_pos_status ON public.customer_pos(status);

-- Composite index on shift_records for analytics queries
CREATE INDEX IF NOT EXISTS idx_shift_records_operator_date ON public.shift_records(operator_id, shift_date);

-- Index on printed_labels.sku for SKU-based filtering
CREATE INDEX IF NOT EXISTS idx_printed_labels_sku ON public.printed_labels(sku);

-- Index on customer_pos.po_number for PO lookups
CREATE INDEX IF NOT EXISTS idx_customer_pos_po_number ON public.customer_pos(po_number);

-- Composite index for timesheet tracking performance
CREATE INDEX IF NOT EXISTS idx_timesheet_tracking_operator_date ON public.timesheet_tracking(operator_id, work_date);

-- Index on clockfy_time_events for clock status queries
CREATE INDEX IF NOT EXISTS idx_clockfy_time_events_operator_date ON public.clockfy_time_events(operator_id, clock_in);