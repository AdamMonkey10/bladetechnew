import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { getBatchCacheDuration, localStorageCache } from '@/utils/cacheUtils';

export interface PrintedLabel {
  id: string;
  po?: string | null;
  sku: string;
  invoice?: string | null;
  quantity?: number | null;
  date_printed?: string | null;
  box_number?: number | null;
  line_item_index?: number | null;
  line_number?: number | null;
  created_at: string;
  user_id?: string | null;
  session_id?: string | null;
  goods_received_id?: string | null;
}

export interface PrintedLabelInsert {
  sku: string;
  po?: string;
  invoice?: string;
  quantity?: number;
  date_printed?: string;
  box_number?: number;
  line_item_index?: number;
  user_id?: string;
}

export function usePrintedLabels(dateFrom?: Date, dateTo?: Date, limit = 100, offset = 0) {
  return useQuery({
    queryKey: ['printed-labels', dateFrom, dateTo, limit, offset],
    queryFn: async () => {
      const cacheKey = `printed_labels_${dateFrom?.toISOString()}_${dateTo?.toISOString()}_${limit}_${offset}`;
      
      // Try to get ancient data from localStorage first
      const cachedData = localStorageCache.get<PrintedLabel[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Optimize query - select only essential columns for listings
      let query = supabase
        .from('printed_labels')
        .select('id, po, sku, quantity, date_printed, box_number, created_at, invoice')
        .order('date_printed', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (dateFrom) {
        query = query.gte('date_printed', format(dateFrom, 'yyyy-MM-dd'));
      }
      if (dateTo) {
        query = query.lte('date_printed', format(dateTo, 'yyyy-MM-dd'));
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const result = (data || []) as unknown as PrintedLabel[];
      
      // Cache ancient data in localStorage with extended duration
      if (localStorageCache.shouldUseLocalStorage(result || [])) {
        localStorageCache.set(cacheKey, result);
      }
      
      return result;
    },
    enabled: !!dateFrom, // Only run query when date is selected
    ...getBatchCacheDuration([], { 
      // Extend cache durations for cost reduction
      multiplier: 2, // Double cache times
      minStaleTime: 2 * 60 * 1000 // Minimum 2 minutes
    }),
    refetchOnWindowFocus: false,
  });
}

export function usePrintedQuantities(po?: string, sku?: string, lineItemIndex?: number) {
  return useQuery({
    queryKey: ['printed-quantities', po, sku, lineItemIndex],
    queryFn: async () => {
      if (!po || !sku) return { totalPrinted: 0, totalBoxes: 0 };

      // Optimize query - only select quantity, not full records
      let query = supabase
        .from('printed_labels')
        .select('quantity')
        .eq('po', po)
        .eq('sku', sku);

      // If lineItemIndex is provided, filter by it
      if (lineItemIndex !== undefined) {
        query = query.eq('line_item_index', lineItemIndex);
      }

      const { data, error } = await query;
      if (error) throw error;

      const totalPrinted = data?.reduce((sum, label) => sum + label.quantity, 0) || 0;
      const totalBoxes = data?.length || 0;

      return { totalPrinted, totalBoxes };
    },
    enabled: !!po && !!sku,
    staleTime: 2 * 60 * 1000, // Extended to 2 minutes
    gcTime: 10 * 60 * 1000, // Extended to 10 minutes
  });
}

export function useInsertPrintedLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (label: PrintedLabelInsert) => {
      const { data, error } = await supabase
        .from('printed_labels')
        .insert([label])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries to trigger re-fetch
      queryClient.invalidateQueries({ queryKey: ['printed-labels'] });
      queryClient.invalidateQueries({ queryKey: ['printed-quantities'] });
      queryClient.invalidateQueries({ queryKey: ['customer-pos'] });
    },
  });
}

export function usePrintedLabelsByOperatorDate(operatorName?: string, date?: string) {
  return useQuery({
    queryKey: ['printed-labels-by-operator-date', operatorName, date],
    queryFn: async () => {
      console.log('usePrintedLabelsByOperatorDate called with:', { operatorName, date });
      
      if (!operatorName || !date) {
        console.log('Missing operatorName or date, returning empty array');
        return [];
      }

      // Optimize query - select only needed columns
      const { data, error } = await supabase
        .from('printed_labels')
        .select('id, customer, po, sku, quantity, laser, print_date, invoice, created_at')
        .eq('operator', operatorName)
        .eq('print_date', date)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching printed labels:', error);
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} printed labels for operator ${operatorName} on ${date}:`, data);
      return data as PrintedLabel[];
    },
    enabled: !!operatorName && !!date,
    ...getBatchCacheDuration([], { 
      multiplier: 2, // Extended cache
      minStaleTime: 30 * 1000 // Minimum 30 seconds
    }),
  });
}

export function useImportPrintedLabels() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (labels: PrintedLabelInsert[]) => {
      const { data, error } = await supabase
        .from('printed_labels')
        .insert(labels)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printed-labels'] });
      queryClient.invalidateQueries({ queryKey: ['printed-quantities'] });
      queryClient.invalidateQueries({ queryKey: ['customer-pos'] });
    },
  });
}