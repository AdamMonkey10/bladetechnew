import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getBatchCacheDuration } from '@/utils/cacheUtils';

// Optimized Customer POs hook with selective columns and caching
export const useOptimizedCustomerPOs = (enabled = true) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['customer-pos-optimized'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('customer_pos')
          .select('id, po_number, customer_name, status, delivery_date, items, progress_percentage')
          .neq('status', 'completed') // Only open POs
          .order('po_date', { ascending: false })
          .limit(100);

        if (error) throw error;
        return data || [];
      } catch (error: any) {
        toast({
          title: "Error loading customer POs",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled,
    ...getBatchCacheDuration([]), // Use smart caching
    refetchOnWindowFocus: false,
  });
};

// Optimized printed labels for SKU/invoice filtering
export const useOptimizedPrintedLabels = (operatorCode?: string, dateRange?: { start: string; end: string }) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['printed-labels-optimized', operatorCode, dateRange],
    queryFn: async () => {
      try {
        let query = supabase
          .from('printed_labels')
          .select('id, sku, invoice, po, quantity, date_printed, box_number');

        if (operatorCode) {
          query = query.eq('operator', operatorCode);
        }

        if (dateRange) {
          query = query
            .gte('print_date', dateRange.start)
            .lte('print_date', dateRange.end);
        }

        const { data, error } = await query
          .order('print_date', { ascending: false })
          .limit(1000);

        if (error) throw error;
        return data || [];
      } catch (error: any) {
        toast({
          title: "Error loading printed labels",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled: Boolean(operatorCode || dateRange),
    ...getBatchCacheDuration([]), // Use smart caching
    refetchOnWindowFocus: false,
  });
};

// Optimized analytics data hook
export const useOptimizedAnalytics = (dateRange: { start: string; end: string }, enabled = true) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['analytics-optimized', dateRange],
    queryFn: async () => {
      try {
        // Single query with aggregated data instead of multiple queries
        const { data, error } = await supabase
          .from('shift_records')
          .select(`
            id,
            operator_id,
            shift_date,
            production_data,
            operators!inner(operator_name, operator_code)
          `)
          .gte('shift_date', dateRange.start)
          .lte('shift_date', dateRange.end)
          .order('shift_date', { ascending: false })
          .limit(500);

        if (error) throw error;
        return data || [];
      } catch (error: any) {
        toast({
          title: "Error loading analytics data",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled,
    ...getBatchCacheDuration([]), // Use smart caching based on date range
    refetchOnWindowFocus: false,
  });
};

// Optimized shift records for specific operator
export const useOptimizedShiftRecords = (operatorId: string, enabled = true) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['shift-records-optimized', operatorId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('shift_records')
          .select('id, shift_date, shift_type, production_data, notes')
          .eq('operator_id', operatorId)
          .order('shift_date', { ascending: false })
          .limit(100);

        if (error) throw error;
        return data || [];
      } catch (error: any) {
        toast({
          title: "Error loading shift records",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled: enabled && Boolean(operatorId),
    staleTime: 5 * 60 * 1000, // 5 minutes for current data
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};