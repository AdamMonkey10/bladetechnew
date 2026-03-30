import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TimesheetTrackingRecord {
  id: string;
  operator_id: string | null;
  operator_name?: string | null;
  week_number: number;
  year: number;
  actual_shifts?: number | null;
  expected_shifts?: number | null;
  missing_shifts?: number | null;
  compliance_rate?: number | null;
  status?: string | null;
  timesheet_submitted?: boolean;
  timesheet_submitted_at?: string | null;
  days_overdue?: number;
  escalation_level?: string;
  created_at: string;
  last_updated?: string | null;
  operators?: {
    operator_name: string;
    operator_code: string;
  };
  shift_records?: {
    production_data: any;
  }[];
}

export interface OperatorComplianceStats {
  operator_id: string;
  operator_name: string;
  operator_code: string;
  total_overdue: number;
  highest_escalation: 'none' | 'late' | 'critical';
  oldest_overdue_date: string | null;
  critical_count: number;
  late_count: number;
  is_compliant: boolean;
  total_tracking_records: number;
}

export function useTimesheetTracking() {
  const [overdueRecords, setOverdueRecords] = useState<TimesheetTrackingRecord[]>([]);
  const [allRecords, setAllRecords] = useState<TimesheetTrackingRecord[]>([]);
  const [operatorStats, setOperatorStats] = useState<OperatorComplianceStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOverdueRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('timesheet_tracking')
        .select(`
          *,
          operators (
            operator_name,
            operator_code
          )
        `)
        .eq('timesheet_submitted', false)
        .gt('days_overdue', 0)
        .order('days_overdue', { ascending: false });

      if (error) throw error;
      setOverdueRecords((data || []) as unknown as TimesheetTrackingRecord[]);
    } catch (error) {
      console.error('Error fetching overdue records:', error);
    }
  };

  const fetchAllRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('timesheet_tracking')
        .select(`
          *,
          operators (
            operator_name,
            operator_code
          )
        `)
        .order('created_at', { ascending: false })
        .limit(500); // Limit to prevent excessive data

      if (error) throw error;
      
      if (!data || data.length === 0) {
        setAllRecords([]);
        return;
      }

      // Get unique operator_id and work_date combinations
      const uniqueKeys = new Set<string>();
      const operatorIds = new Set<string>();
      const workDates = new Set<string>();
      
      data.forEach(record => {
        const workDate = record.last_updated || record.created_at;
        uniqueKeys.add(`${record.operator_id}_${workDate}`);
        if (record.operator_id) operatorIds.add(record.operator_id);
        if (workDate) workDates.add(workDate.split('T')[0]);
      });

      // Batch fetch all relevant shift records in a single query
      const { data: shiftRecords } = await supabase
        .from('shift_records')
        .select('operator_id, shift_date, production_data')
        .in('operator_id', Array.from(operatorIds))
        .in('shift_date', Array.from(workDates));

      // Create a lookup map for shift records
      const shiftRecordMap = new Map<string, any>();
      shiftRecords?.forEach(shift => {
        const key = `${shift.operator_id}_${shift.shift_date}`;
        shiftRecordMap.set(key, shift);
      });

      // Match shift records to timesheet tracking records
      const recordsWithShiftData = data.map(record => {
        const workDate = (record.last_updated || record.created_at || '').split('T')[0];
        const key = `${record.operator_id}_${workDate}`;
        const shiftData = shiftRecordMap.get(key);
        return {
          ...record,
          shift_records: shiftData ? [{ production_data: shiftData.production_data }] : []
        };
      });

      setAllRecords(recordsWithShiftData as unknown as TimesheetTrackingRecord[]);
    } catch (error) {
      console.error('Error fetching all records:', error);
    }
  };

  const fetchOperatorStats = async () => {
    try {
      // Get rolling 28-day date range
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 28);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Get ALL timesheet tracking records for the last 28 days
      const { data: allTrackingData, error } = await supabase
        .from('timesheet_tracking')
        .select(`
          operator_id,
          escalation_level,
          work_date,
          days_overdue,
          timesheet_submitted,
          operators (
            operator_name,
            operator_code
          )
        `)
        .gte('work_date', startDateStr)
        .lte('work_date', endDateStr);

      if (error) throw error;

      // Process data to create comprehensive operator stats
      const statsMap = new Map<string, OperatorComplianceStats>();
      
      allTrackingData?.forEach(record => {
        const operatorId = record.operator_id;
        const existing = statsMap.get(operatorId);
        
        if (!existing) {
          statsMap.set(operatorId, {
            operator_id: operatorId,
            operator_name: record.operators?.operator_name || 'Unknown',
            operator_code: record.operators?.operator_code || 'Unknown',
            total_overdue: record.timesheet_submitted ? 0 : (record.days_overdue > 0 ? 1 : 0),
            highest_escalation: record.escalation_level as 'none' | 'late' | 'critical',
            oldest_overdue_date: record.timesheet_submitted ? null : record.work_date,
            critical_count: record.escalation_level === 'critical' && !record.timesheet_submitted ? 1 : 0,
            late_count: record.escalation_level === 'late' && !record.timesheet_submitted ? 1 : 0,
            is_compliant: record.timesheet_submitted || record.days_overdue === 0,
            total_tracking_records: 1
          });
        } else {
          existing.total_tracking_records += 1;
          
          if (!record.timesheet_submitted && record.days_overdue > 0) {
            existing.total_overdue += 1;
            
            // Update highest escalation level
            const escalationPriority = { 'none': 0, 'late': 1, 'critical': 2 };
            if (escalationPriority[record.escalation_level as keyof typeof escalationPriority] > escalationPriority[existing.highest_escalation]) {
              existing.highest_escalation = record.escalation_level as 'none' | 'late' | 'critical';
            }
            
            // Update oldest date
            if (!existing.oldest_overdue_date || record.work_date < existing.oldest_overdue_date) {
              existing.oldest_overdue_date = record.work_date;
            }
            
            // Update counts
            if (record.escalation_level === 'critical') existing.critical_count += 1;
            if (record.escalation_level === 'late') existing.late_count += 1;
          }
          
          // Update compliance status
          existing.is_compliant = existing.total_overdue === 0;
        }
      });

      setOperatorStats(Array.from(statsMap.values()));
    } catch (error) {
      console.error('Error fetching operator stats:', error);
    }
  };

  const markTimesheetSubmitted = async (operatorId: string, workDate: string) => {
    try {
      const { error } = await supabase
        .from('timesheet_tracking')
        .update({
          timesheet_submitted: true,
          timesheet_submitted_at: new Date().toISOString(),
          days_overdue: 0,
          escalation_level: 'none'
        })
        .eq('operator_id', operatorId)
        .eq('work_date', workDate);

      if (error) throw error;
      
      // Refresh data
      await Promise.all([fetchOverdueRecords(), fetchAllRecords(), fetchOperatorStats()]);
    } catch (error) {
      console.error('Error marking timesheet as submitted:', error);
      throw error;
    }
  };

  const getOperatorOverdueCount = (operatorId: string) => {
    const stats = operatorStats.find(s => s.operator_id === operatorId);
    return stats ? stats.total_overdue : 0;
  };

  const getOperatorHighestEscalation = (operatorId: string) => {
    const stats = operatorStats.find(s => s.operator_id === operatorId);
    return stats ? stats.highest_escalation : 'none';
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchOverdueRecords(), fetchAllRecords(), fetchOperatorStats()]);
      setLoading(false);
    };

    fetchData();
  }, []);

  const getOperatorMissingTimesheets = async (operatorId: string) => {
    try {
      // Get timesheet tracking records for this operator
      const { data: trackingData, error: trackingError } = await supabase
        .from('timesheet_tracking')
        .select('*')
        .eq('operator_id', operatorId)
        .eq('timesheet_submitted', false);

      if (trackingError) throw trackingError;

      // Get corresponding time events with details
      const missingTimesheets = [];
      
      for (const tracking of trackingData || []) {
        // Format dates with UTC timezone markers for proper comparison
        const startOfDay = `${tracking.work_date}T00:00:00Z`;
        const endOfDay = `${tracking.work_date}T23:59:59Z`;
        
        const { data: timeEvents, error: timeError } = await supabase
          .from('clockfy_time_events')
          .select('clock_in, clock_out, total_hours')
          .eq('operator_id', operatorId)
          .gte('clock_in', startOfDay)
          .lt('clock_in', endOfDay)
          .order('clock_in', { ascending: false })
          .limit(1);

        if (timeError) {
          console.error('Error fetching time events:', timeError);
          continue;
        }

        if (timeEvents && timeEvents.length > 0) {
          const timeEvent = timeEvents[0];
          const clockIn = new Date(timeEvent.clock_in);
          const clockOut = timeEvent.clock_out ? new Date(timeEvent.clock_out) : null;
          const hoursWorked = clockOut 
            ? (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)
            : timeEvent.total_hours || 0;

          missingTimesheets.push({
            work_date: tracking.work_date,
            clock_in: timeEvent.clock_in,
            clock_out: timeEvent.clock_out,
            hours_worked: hoursWorked,
            escalation_level: tracking.escalation_level,
            days_overdue: tracking.days_overdue
          });
        }
      }

      return missingTimesheets.sort((a, b) => new Date(b.work_date).getTime() - new Date(a.work_date).getTime());
    } catch (error) {
      console.error('Error fetching missing timesheets:', error);
      return [];
    }
  };

  return {
    overdueRecords,
    allRecords,
    operatorStats,
    loading,
    refetch: () => Promise.all([fetchOverdueRecords(), fetchAllRecords(), fetchOperatorStats()]),
    markTimesheetSubmitted,
    getOperatorOverdueCount,
    getOperatorHighestEscalation,
    getOperatorMissingTimesheets
  };
}