import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClockStatus {
  operatorId: string;
  isActive: boolean;
  clockIn: string | null;
  clockOut: string | null;
  hoursWorked: number;
  employeeName?: string;
  needsTimesheet: boolean;
  overdueTimesheets: number;
  highestEscalation: 'none' | 'warning' | 'urgent' | 'critical';
}

export function useClockStatus(operatorId?: string) {
  const [status, setStatus] = useState<ClockStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (operatorId) {
      fetchSingleOperatorStatus(operatorId);
    }
  }, [operatorId]);

  const fetchSingleOperatorStatus = async (opId: string) => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's time events for this operator
      const { data: todayTimeEvents, error: timeEventsError } = await supabase
        .from('clockfy_time_events')
        .select(`
          clock_in,
          clock_out,
          total_hours,
          clockfy_employees!inner(
            name,
            mapped_operator_id
          )
        `)
        .eq('operator_id', opId)
        .gte('clock_in', today)
        .lt('clock_in', today + 'T23:59:59')
        .order('clock_in', { ascending: false });

      if (timeEventsError) throw timeEventsError;

      // Also get any active clock-ins (where clock_out is null) from any date for this operator
      const { data: activeTimeEvents, error: activeEventsError } = await supabase
        .from('clockfy_time_events')
        .select(`
          clock_in,
          clock_out,
          total_hours,
          clockfy_employees!inner(
            name,
            mapped_operator_id
          )
        `)
        .eq('operator_id', opId)
        .is('clock_out', null)
        .order('clock_in', { ascending: false });

      if (activeEventsError) throw activeEventsError;

      // Combine today's events with active events, avoiding duplicates
      const timeEvents = [...(todayTimeEvents || [])];
      activeTimeEvents?.forEach(activeEvent => {
        if (!timeEvents.some(event => event.clock_in === activeEvent.clock_in)) {
          timeEvents.push(activeEvent);
        }
      });

      // Sort by clock_in descending to get the latest event first
      timeEvents.sort((a, b) => new Date(b.clock_in).getTime() - new Date(a.clock_in).getTime());

      // Check if there's a timesheet for today
      const { data: shiftRecords, error: shiftError } = await supabase
        .from('shift_records')
        .select('id')
        .eq('operator_id', opId)
        .eq('shift_date', today)
        .limit(1);

      if (shiftError) throw shiftError;

      const hasTimesheet = (shiftRecords && shiftRecords.length > 0);
      const hasTimeEvents = timeEvents && timeEvents.length > 0;
      const needsTimesheet = hasTimeEvents && !hasTimesheet;

      // Get overdue timesheet info
      const { data: overdueData, error: overdueError } = await supabase
        .from('timesheet_tracking')
        .select('escalation_level, days_overdue')
        .eq('operator_id', opId)
        .eq('timesheet_submitted', false)
        .gt('days_overdue', 0);

      if (overdueError) {
        console.error('Error fetching overdue data:', overdueError);
      }

      const overdueTimesheets = overdueData?.length || 0;
      const highestEscalation = overdueData?.reduce((highest, current) => {
        const escalationPriority = { 'none': 0, 'warning': 1, 'urgent': 2, 'critical': 3 };
        return escalationPriority[current.escalation_level as keyof typeof escalationPriority] > escalationPriority[highest] 
          ? current.escalation_level as 'none' | 'warning' | 'urgent' | 'critical'
          : highest;
      }, 'none' as 'none' | 'warning' | 'urgent' | 'critical') || 'none';

      if (timeEvents && timeEvents.length > 0) {
        // Get the latest event (first in the ordered list)
        const latestEvent = timeEvents[0];
        const clockIn = new Date(latestEvent.clock_in);
        const now = new Date();
        const isActive = !latestEvent.clock_out;
        const hoursWorked = isActive 
          ? (now.getTime() - clockIn.getTime()) / (1000 * 60 * 60)
          : latestEvent.total_hours || 0;
        
        setStatus({
          operatorId: opId,
          isActive,
          clockIn: latestEvent.clock_in,
          clockOut: latestEvent.clock_out,
          hoursWorked: Math.max(0, hoursWorked),
          employeeName: latestEvent.clockfy_employees?.name,
          needsTimesheet,
          overdueTimesheets,
          highestEscalation
        });
      } else {
        setStatus({
          operatorId: opId,
          isActive: false,
          clockIn: null,
          clockOut: null,
          hoursWorked: 0,
          needsTimesheet: false,
          overdueTimesheets,
          highestEscalation
        });
      }
    } catch (error) {
      console.error('Error fetching clock status:', error);
        setStatus({
          operatorId: opId,
          isActive: false,
          clockIn: null,
          clockOut: null,
          hoursWorked: 0,
          needsTimesheet: false,
          overdueTimesheets: 0,
          highestEscalation: 'none'
        });
    } finally {
      setLoading(false);
    }
  };

  return { status, loading, refetch: () => operatorId && fetchSingleOperatorStatus(operatorId) };
}

export function useAllOperatorsClockStatus() {
  const [statuses, setStatuses] = useState<Record<string, ClockStatus>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllOperatorsStatus();
  }, []);

  const fetchAllOperatorsStatus = async () => {
    try {
      setLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      
      // Get all active operators
      const { data: operators, error: operatorsError } = await supabase
        .from('operators')
        .select('id, operator_name, operator_code')
        .eq('active', true);

      if (operatorsError) throw operatorsError;

      // Get ALL time events for today AND any active clock-ins (clock_out is null)
      const { data: todayTimeEvents, error: timeEventsError } = await supabase
        .from('clockfy_time_events')
        .select(`
          operator_id,
          clock_in,
          clock_out,
          total_hours,
          clockfy_employees!inner(
            name,
            mapped_operator_id
          )
        `)
        .gte('clock_in', today)
        .lt('clock_in', today + 'T23:59:59')
        .order('clock_in', { ascending: false });

      if (timeEventsError) throw timeEventsError;

      // Also get any active clock-ins (where clock_out is null) from any date
      const { data: activeTimeEvents, error: activeEventsError } = await supabase
        .from('clockfy_time_events')
        .select(`
          operator_id,
          clock_in,
          clock_out,
          total_hours,
          clockfy_employees!inner(
            name,
            mapped_operator_id
          )
        `)
        .is('clock_out', null)
        .order('clock_in', { ascending: false });

      if (activeEventsError) throw activeEventsError;

      // Combine today's events with active events, avoiding duplicates
      const allTimeEvents = [...(todayTimeEvents || [])];
      activeTimeEvents?.forEach(activeEvent => {
        if (!allTimeEvents.some(event => 
          event.operator_id === activeEvent.operator_id && 
          event.clock_in === activeEvent.clock_in
        )) {
          allTimeEvents.push(activeEvent);
        }
      });


      // Get shift records for today to check if timesheets have been submitted
      const { data: shiftRecords, error: shiftError } = await supabase
        .from('shift_records')
        .select('operator_id')
        .eq('shift_date', today);

      if (shiftError) throw shiftError;

      const operatorsWithTimesheets = new Set(
        shiftRecords?.map(record => record.operator_id) || []
      );

      const statusMap: Record<string, ClockStatus> = {};
      const now = new Date();

      // Get overdue timesheet data for all operators
      const { data: overdueData, error: overdueError } = await supabase
        .from('timesheet_tracking')
        .select('operator_id, escalation_level, days_overdue')
        .eq('timesheet_submitted', false)
        .gt('days_overdue', 0);

      if (overdueError) {
        console.error('Error fetching overdue data:', overdueError);
      }

      // Process overdue data by operator
      const overdueMap: Record<string, { count: number; highestEscalation: 'none' | 'warning' | 'urgent' | 'critical' }> = {};
      
      overdueData?.forEach(record => {
        if (!overdueMap[record.operator_id]) {
          overdueMap[record.operator_id] = { count: 0, highestEscalation: 'none' };
        }
        overdueMap[record.operator_id].count += 1;
        
        const escalationPriority = { 'none': 0, 'warning': 1, 'urgent': 2, 'critical': 3 };
        if (escalationPriority[record.escalation_level as keyof typeof escalationPriority] > escalationPriority[overdueMap[record.operator_id].highestEscalation]) {
          overdueMap[record.operator_id].highestEscalation = record.escalation_level as 'none' | 'warning' | 'urgent' | 'critical';
        }
      });

      // Initialize all operators
      operators?.forEach(operator => {
        const overdueInfo = overdueMap[operator.id] || { count: 0, highestEscalation: 'none' as const };
        statusMap[operator.id] = {
          operatorId: operator.id,
          isActive: false,
          clockIn: null,
          clockOut: null,
          hoursWorked: 0,
          needsTimesheet: false,
          overdueTimesheets: overdueInfo.count,
          highestEscalation: overdueInfo.highestEscalation
        };
      });

      // Process time events to determine status
      const operatorLatestEvent: Record<string, any> = {};
      
      allTimeEvents?.forEach(event => {
        if (event.operator_id && (!operatorLatestEvent[event.operator_id] || 
            new Date(event.clock_in) > new Date(operatorLatestEvent[event.operator_id].clock_in))) {
          operatorLatestEvent[event.operator_id] = event;
        }
      });

      // Update status for operators with time events
      Object.entries(operatorLatestEvent).forEach(([operatorId, event]) => {
        const clockIn = new Date(event.clock_in);
        const isActive = !event.clock_out;
        const hoursWorked = isActive 
          ? (now.getTime() - clockIn.getTime()) / (1000 * 60 * 60)
          : event.total_hours || 0;
        
        // Check if timesheet is needed: has time events but no submitted timesheet
        const hasTimeEvents = allTimeEvents?.some(e => e.operator_id === operatorId);
        const hasTimesheet = operatorsWithTimesheets.has(operatorId);
        const needsTimesheet = hasTimeEvents && !hasTimesheet;

        const overdueInfo = overdueMap[operatorId] || { count: 0, highestEscalation: 'none' as const };
        statusMap[operatorId] = {
          operatorId,
          isActive,
          clockIn: event.clock_in,
          clockOut: event.clock_out,
          hoursWorked: Math.max(0, hoursWorked),
          employeeName: event.clockfy_employees?.name,
          needsTimesheet,
          overdueTimesheets: overdueInfo.count,
          highestEscalation: overdueInfo.highestEscalation
        };
      });

      setStatuses(statusMap);
    } catch (error) {
      console.error('Error fetching all operators clock status:', error);
      setStatuses({});
    } finally {
      setLoading(false);
    }
  };

  return { 
    statuses, 
    loading, 
    refetch: fetchAllOperatorsStatus,
    getOperatorStatus: (operatorId: string) => statuses[operatorId]
  };
}