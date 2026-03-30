import { QueryClient } from '@tanstack/react-query';

// Query deduplication to prevent duplicate requests
const activeQueries = new Map<string, Promise<any>>();

export const createDedupedQuery = <T>(
  queryKey: string[],
  queryFn: () => Promise<T>
): Promise<T> => {
  const key = JSON.stringify(queryKey);
  
  if (activeQueries.has(key)) {
    // Return existing promise if same query is already running
    return activeQueries.get(key)!;
  }
  
  const promise = queryFn().finally(() => {
    // Clean up after query completes
    activeQueries.delete(key);
  });
  
  activeQueries.set(key, promise);
  return promise;
};

// Enhanced QueryClient configuration for better performance
export const createOptimizedQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Reduce network requests with smart defaults
        staleTime: 5 * 60 * 1000, // 5 minutes default
        gcTime: 30 * 60 * 1000, // 30 minutes default
        refetchOnWindowFocus: false,
        refetchOnReconnect: 'always',
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors, but retry on network issues
          if (error?.code >= 400 && error?.code < 500) {
            return false;
          }
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 1,
      },
    },
  });
};

// Batch query prefetching for related data
export const prefetchRelatedData = async (queryClient: QueryClient, operatorId?: string) => {
  const prefetchPromises = [];
  
  // Always prefetch reference data
  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: ['operators'],
      staleTime: 24 * 60 * 60 * 1000, // 24 hours
    }),
    queryClient.prefetchQuery({
      queryKey: ['machines'],
      staleTime: 24 * 60 * 60 * 1000, // 24 hours
    }),
    queryClient.prefetchQuery({
      queryKey: ['products'],
      staleTime: 24 * 60 * 60 * 1000, // 24 hours
    })
  );
  
  // Prefetch operator-specific data if operator is known
  if (operatorId) {
    prefetchPromises.push(
      queryClient.prefetchQuery({
        queryKey: ['shift-records-optimized', operatorId],
        staleTime: 5 * 60 * 1000, // 5 minutes
      })
    );
  }
  
  await Promise.allSettled(prefetchPromises);
};