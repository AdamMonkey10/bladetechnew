import * as z from 'zod';

// Activity types constant
export const ACTIVITY_TYPES = ['Laser1', 'Laser2', 'Laser3', 'Welder', 'Auto Welding', 'Coating', 'Stacking', 'OperatorActivity'];

// Zod schemas
export const activityEntrySchema = z.object({
  units_produced: z.number().min(0).optional(),
  scrap: z.number().min(0).optional(),
  sku: z.string().optional(),
  time_spent: z.number().min(0.1, 'Time spent must be at least 0.1 hours').optional(),
  invoice_number: z.string().optional(),
  boxes_complete: z.number().min(0).optional(),
  machine_id: z.string().optional(),
  downtime_duration: z.number().min(0).optional(),
  downtime_reason: z.string().optional(),
  downtime_description: z.string().optional()
});

export const activitySchema = z.object({
  name: z.string(),
  entries: z.array(activityEntrySchema).min(1)
});

export const uptimeDowntimeEntrySchema = z.object({
  machine_id: z.string().min(1, 'Machine is required'),
  type: z.enum(['uptime', 'downtime']),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  duration_minutes: z.number().min(0),
  reason: z.string().optional(),
  description: z.string().optional()
});

export const shiftFormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  shift: z.enum(['Days', 'Nights'], {
    required_error: 'Shift is required'
  }),
  operator: z.string().min(1, 'Operator is required'),
  timeStart: z.string().min(1, 'Start time is required'),
  timeFinish: z.string().min(1, 'End time is required'),
  comments: z.string().optional(),
  activities: z.array(activitySchema)
});

// Type exports
export type ShiftFormData = z.infer<typeof shiftFormSchema>;
export type ActivityEntry = z.infer<typeof activityEntrySchema>;
export type Activity = z.infer<typeof activitySchema>;
export type UptimeDowntimeEntry = z.infer<typeof uptimeDowntimeEntrySchema>;

// Interface definitions
export interface Operator {
  id: string;
  operator_name: string;
  operator_code: string;
}

export interface Machine {
  id: string;
  machine_name: string;
  machine_code: string;
}

export interface Product {
  id: string;
  product_name: string;
  product_code: string;
  box_amount: number | null;
}

export interface ShiftFormProps {
  onSuccess?: () => void;
  preselectedOperator?: {
    id: string;
    operator_name: string;
    operator_code: string;
  };
  preselectedDate?: string;
}

export interface PendingTimeSpentEntry {
  activityIndex: number;
  entryIndex: number;
  isLaserActivity: boolean;
  laserName?: string;
  sku?: string;
  unitsProduced?: number;
}

export interface LaserTimeEntry {
  laserName: string;
  activityIndex: number;
  entryIndex: number;
  sku: string;
  unitsProduced: number;
  timeSpent: string;
  scrap: string;
  invoice?: string;
  downtime_duration?: string;
  downtime_reason?: string;
}