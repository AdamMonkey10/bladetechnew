import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClockfyTimeEvent {
  id: string;
  clockfy_record_id: string;
  employee_id: string;
  operator_id: string | null;
  clock_in: string;
  clock_out: string | null;
  total_hours: number | null;
  created_at: string;
  updated_at: string;
}

export interface ClockfyEmployee {
  id: string;
  clockfy_employee_id: string;
  name: string;
  email: string | null;
  pin: string | null;
  is_active: boolean;
  mapped_operator_id: string | null;
  deactivated_at: string | null;
  created_at: string;
  updated_at: string;
}

// Hook to get current clock status for an operator
export const useOperatorClockStatus = (operatorId: string | null) => {
  return useQuery({
    queryKey: ['operator-clock-status', operatorId],
    queryFn: async () => {
      if (!operatorId) return null;

      // Get the most recent time event for this operator that doesn't have a clock_out
      const { data, error } = await supabase
        .from('clockfy_time_events')
        .select(`
          *,
          clockfy_employees!inner(
            name,
            email,
            mapped_operator_id
          )
        `)
        .eq('operator_id', operatorId)
        .is('clock_out', null)
        .order('clock_in', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching clock status:', error);
        return null;
      }

      return data?.[0] || null;
    },
    enabled: !!operatorId,
    refetchInterval: 30000, // Refetch every 30 seconds to stay updated
  });
};

// Hook to get time events for a specific date and operator
export const useOperatorTimeEvents = (operatorId: string | null, date: string) => {
  return useQuery({
    queryKey: ['operator-time-events', operatorId, date],
    queryFn: async () => {
      if (!operatorId) return [];

      const startOfDay = `${date}T00:00:00.000Z`;
      const endOfDay = `${date}T23:59:59.999Z`;

      const { data, error } = await supabase
        .from('clockfy_time_events')
        .select(`
          *,
          clockfy_employees!inner(
            name,
            email,
            mapped_operator_id
          )
        `)
        .eq('operator_id', operatorId)
        .gte('clock_in', startOfDay)
        .lte('clock_in', endOfDay)
        .order('clock_in', { ascending: true });

      if (error) {
        console.error('Error fetching time events:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!operatorId && !!date,
  });
};

// Hook to get all Clockfy employees with their mappings
export const useClockfyEmployees = () => {
  return useQuery({
    queryKey: ['clockfy-employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clockfy_employees')
        .select(`
          *,
          operators(
            operator_name,
            operator_code
          )
        `)
        .order('name');

      if (error) {
        console.error('Error fetching Clockfy employees:', error);
        return [];
      }

      return data || [];
    },
  });
};

// Helper function to calculate shift times from clock events
export const calculateShiftTimes = (timeEvents: ClockfyTimeEvent[]) => {
  if (timeEvents.length === 0) return null;

  // Find the earliest clock_in and latest clock_out (if exists)
  const sortedEvents = [...timeEvents].sort((a, b) => 
    new Date(a.clock_in).getTime() - new Date(b.clock_in).getTime()
  );

  const firstClockIn = sortedEvents[0].clock_in;
  const lastEvent = sortedEvents[sortedEvents.length - 1];
  const lastClockOut = lastEvent.clock_out;

  // Format times for the shift form (HH:MM format)
  // Always format in the user's local timezone for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  const startTime = formatTime(firstClockIn);
  const endTime = lastClockOut ? formatTime(lastClockOut) : null;

  // Calculate total hours
  let totalHours = 0;
  if (lastClockOut) {
    const start = new Date(firstClockIn);
    const end = new Date(lastClockOut);
    totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }

  // Determine shift type based on start time
  const startHour = new Date(firstClockIn).getHours();
  const shiftType = startHour < 12 ? 'Days' : 'Nights';

  return {
    startTime,
    endTime,
    totalHours,
    shiftType,
    isCurrentlyWorking: !lastClockOut,
    firstClockIn,
    lastClockOut
  };
};