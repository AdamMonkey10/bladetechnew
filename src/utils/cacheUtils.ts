import { differenceInDays, differenceInWeeks } from 'date-fns';

/**
 * Calculate cache duration based on data age
 * - Data > 2 weeks old: Cache for 24 hours (essentially permanent)
 * - Data 1-2 weeks old: Cache for 4 hours  
 * - Data < 1 week old: Cache for 30 minutes
 * - Live/current data: Cache for 5 minutes
 */
export const getAgeBasisedCacheDuration = (dateString: string) => {
  const dataDate = new Date(dateString);
  const now = new Date();
  const daysOld = differenceInDays(now, dataDate);
  
  if (daysOld >= 14) {
    // Data > 2 weeks old: Cache for 24 hours
    return {
      staleTime: 24 * 60 * 60 * 1000, // 24 hours
      gcTime: 48 * 60 * 60 * 1000,    // 48 hours
    };
  } else if (daysOld >= 7) {
    // Data 1-2 weeks old: Cache for 4 hours
    return {
      staleTime: 4 * 60 * 60 * 1000,  // 4 hours
      gcTime: 8 * 60 * 60 * 1000,     // 8 hours
    };
  } else if (daysOld >= 1) {
    // Data < 1 week old: Cache for 30 minutes
    return {
      staleTime: 30 * 60 * 1000,      // 30 minutes
      gcTime: 60 * 60 * 1000,         // 1 hour
    };
  } else {
    // Live/current data: Cache for 5 minutes
    return {
      staleTime: 5 * 60 * 1000,       // 5 minutes
      gcTime: 10 * 60 * 1000,         // 10 minutes
    };
  }
};

/**
 * Calculate cache duration for a batch of data based on oldest record
 */
export const getBatchCacheDuration = (
  data: Array<{ created_at?: string; test_date?: string; print_date?: string; }>,
  options?: { multiplier?: number; minStaleTime?: number; maxStaleTime?: number }
) => {
  const { multiplier = 1, minStaleTime = 0, maxStaleTime = 24 * 60 * 60 * 1000 } = options || {};
  
  if (!data || data.length === 0) {
    return {
      staleTime: Math.max(minStaleTime, 5 * 60 * 1000 * multiplier),  // Extended default
      gcTime: Math.max(minStaleTime * 2, 10 * 60 * 1000 * multiplier),
    };
  }

  // Find the oldest date from any of the possible date fields
  const dates = data.map(item => {
    const dateStr = item.created_at || item.test_date || item.print_date;
    return dateStr ? new Date(dateStr) : new Date();
  });
  
  const oldestDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const baseDuration = getAgeBasisedCacheDuration(oldestDate.toISOString());
  
  return {
    staleTime: Math.min(maxStaleTime, Math.max(minStaleTime, baseDuration.staleTime * multiplier)),
    gcTime: Math.min(maxStaleTime * 2, Math.max(minStaleTime * 2, baseDuration.gcTime * multiplier)),
  };
};

/**
 * Local storage utilities for ancient data (> 1 month old)
 */
export const localStorageCache = {
  key: (queryKey: string) => `bt_cache_${queryKey}`,
  
  get: <T>(queryKey: string): T | null => {
    try {
      const cached = localStorage.getItem(localStorageCache.key(queryKey));
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      
      // Check if cache is still valid (48 hours for ancient data)
      if (Date.now() - timestamp > 48 * 60 * 60 * 1000) {
        localStorage.removeItem(localStorageCache.key(queryKey));
        return null;
      }
      
      return data;
    } catch {
      return null;
    }
  },
  
  set: <T>(queryKey: string, data: T): void => {
    try {
      localStorage.setItem(
        localStorageCache.key(queryKey),
        JSON.stringify({ data, timestamp: Date.now() })
      );
    } catch {
      // Ignore localStorage errors (quota exceeded, etc.)
    }
  },
  
  shouldUseLocalStorage: (data: Array<{ created_at?: string; test_date?: string; print_date?: string; }>) => {
    if (!data || data.length === 0) return false;
    
    // Check if all data is > 1 month old
    return data.every(item => {
      const dateStr = item.created_at || item.test_date || item.print_date;
      if (!dateStr) return false;
      
      const daysOld = differenceInDays(new Date(), new Date(dateStr));
      return daysOld > 30;
    });
  }
};