import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { getBatchCacheDuration, localStorageCache } from '@/utils/cacheUtils';
import { PrintedLabel } from './usePrintedLabels';

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  hasMore: boolean;
  nextOffset?: number;
}

export function usePaginatedPrintedLabels(
  dateFrom?: Date, 
  dateTo?: Date, 
  pageSize = 100,
  page = 0
) {
  const offset = page * pageSize;
  
  return useQuery({
    queryKey: ['printed-labels-paginated', dateFrom, dateTo, pageSize, page],
    queryFn: async (): Promise<PaginatedResult<PrintedLabel>> => {
      const cacheKey = `paginated_labels_${dateFrom?.toISOString()}_${dateTo?.toISOString()}_${pageSize}_${page}`;
      
      // Try localStorage cache for old data
      const cachedData = localStorageCache.get<PaginatedResult<PrintedLabel>>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Get total count first (cached separately for efficiency)
      let countQuery = supabase
        .from('printed_labels')
        .select('*', { count: 'exact', head: true });

      if (dateFrom) {
        countQuery = countQuery.gte('print_date', format(dateFrom, 'yyyy-MM-dd'));
      }
      if (dateTo) {
        countQuery = countQuery.lte('print_date', format(dateTo, 'yyyy-MM-dd'));
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;

      // Get paginated data with optimized columns
      let dataQuery = supabase
        .from('printed_labels')
        .select('id, customer, po, sku, operator, laser, quantity, print_date, box_number, created_at, invoice')
        .order('print_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (dateFrom) {
        dataQuery = dataQuery.gte('print_date', format(dateFrom, 'yyyy-MM-dd'));
      }
      if (dateTo) {
        dataQuery = dataQuery.lte('print_date', format(dateTo, 'yyyy-MM-dd'));
      }

      const { data, error } = await dataQuery;
      if (error) throw error;

      const result: PaginatedResult<PrintedLabel> = {
        data: data as PrintedLabel[],
        count: count || 0,
        hasMore: (offset + pageSize) < (count || 0),
        nextOffset: (offset + pageSize) < (count || 0) ? offset + pageSize : undefined,
      };

      // Cache old data in localStorage
      if (localStorageCache.shouldUseLocalStorage(result.data || [])) {
        localStorageCache.set(cacheKey, result);
      }

      return result;
    },
    enabled: !!dateFrom,
    ...getBatchCacheDuration([], { 
      multiplier: 3, // Triple cache times for paginated data
      minStaleTime: 5 * 60 * 1000 // Minimum 5 minutes
    }),
    refetchOnWindowFocus: false,
  });
}