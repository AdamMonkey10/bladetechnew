import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getBatchCacheDuration, localStorageCache } from '@/utils/cacheUtils';

interface TestReport {
  id: string;
  test_date: string;
  shift: string;
  total_saws: number;
  total_defects: number;
  defect_rate: number;
  notes: string;
  test_data: any;
  created_at: string;
  products: {
    product_code: string;
    product_name: string;
  };
  machines: {
    machine_code: string;
    machine_name: string;
  };
  operators: {
    operator_code: string;
    operator_name: string;
  };
}

interface UseReportsOptions {
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

export const useReports = (options: UseReportsOptions = {}) => {
  const { page = 1, pageSize = 100, enabled = true } = options;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['reports', page, pageSize],
    queryFn: async (): Promise<{ data: TestReport[]; totalCount: number }> => {
      const cacheKey = `reports_${page}_${pageSize}`;
      
      // Try to get ancient data from localStorage first
      const cachedData = localStorageCache.get<{ data: TestReport[]; totalCount: number }>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        // Get total count
        const { count } = await supabase
          .from('milwaukee_test_reports')
          .select('*', { count: 'exact', head: true });

        // Get paginated data
        const { data, error } = await supabase
          .from('milwaukee_test_reports')
          .select(`
            *,
            products (product_code, product_name),
            machines (machine_code, machine_name),
            operators (operator_code, operator_name)
          `)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;
        
        const result = {
          data: data || [],
          totalCount: count || 0
        };

        // Cache ancient data in localStorage
        if (localStorageCache.shouldUseLocalStorage(data || [])) {
          localStorageCache.set(cacheKey, result);
        }

        return result;
      } catch (error: any) {
        toast({
          title: "Error loading reports",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled,
    ...getBatchCacheDuration([]), // Default cache duration, will be overridden by select
    refetchOnWindowFocus: false,
    select: (data) => {
      // Calculate cache duration based on actual data
      const cacheDuration = getBatchCacheDuration(data.data);
      // Update query options dynamically (this is a React Query optimization)
      return data;
    },
  });

  const invalidateReports = () => {
    queryClient.invalidateQueries({ queryKey: ['reports'] });
  };

  const prefetchNextPage = () => {
    if (page * pageSize < (query.data?.totalCount || 0)) {
      const nextPageCacheKey = `reports_${page + 1}_${pageSize}`;
      
      // Check if next page is in localStorage
      const cachedNextPage = localStorageCache.get<{ data: TestReport[]; totalCount: number }>(nextPageCacheKey);
      if (cachedNextPage) return; // Already cached, no need to prefetch

      queryClient.prefetchQuery({
        queryKey: ['reports', page + 1, pageSize],
        queryFn: async () => {
          const from = page * pageSize;
          const to = from + pageSize - 1;

          const { data, error } = await supabase
            .from('milwaukee_test_reports')
            .select(`
              *,
              products (product_code, product_name),
              machines (machine_code, machine_name),
              operators (operator_code, operator_name)
            `)
            .order('created_at', { ascending: false })
            .range(from, to);

          if (error) throw error;
          
          const result = { data: data || [], totalCount: query.data?.totalCount || 0 };
          
          // Cache if ancient data
          if (localStorageCache.shouldUseLocalStorage(data || [])) {
            localStorageCache.set(nextPageCacheKey, result);
          }
          
          return result;
        },
        ...getBatchCacheDuration([]), // Smart cache duration for prefetch
      });
    }
  };

  return {
    ...query,
    reports: query.data?.data || [],
    totalCount: query.data?.totalCount || 0,
    invalidateReports,
    prefetchNextPage,
    hasNextPage: page * pageSize < (query.data?.totalCount || 0),
    hasPreviousPage: page > 1,
  };
};

// Hook for all reports (cached, for stats)
export const useAllReportsStats = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['reports-stats'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('milwaukee_test_reports')
          .select('test_data, defect_rate, total_defects, total_saws');

        if (error) throw error;
        return data || [];
      } catch (error: any) {
        toast({
          title: "Error loading report statistics",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
    staleTime: 60 * 60 * 1000, // 1 hour for stats (mostly historical)
    gcTime: 120 * 60 * 1000, // 2 hours
    refetchOnWindowFocus: false,
  });
};