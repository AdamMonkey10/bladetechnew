/**
 * Query optimization utilities for reducing Supabase costs
 */

// Common column selections for different data types
export const OPTIMIZED_COLUMNS = {
  // Essential columns for printed labels listings
  printedLabels: 'id, customer, po, sku, operator, laser, quantity, print_date, box_number, created_at',
  
  // Essential columns for customer POs
  customerPOs: 'id, po_number, customer_name, status, delivery_date, progress_percentage, created_at',
  
  // Essential columns for operators
  operators: 'id, operator_name, operator_code, active',
  
  // Essential columns for machines
  machines: 'id, machine_name, machine_code, machine_type, active',
  
  // Essential columns for shift records
  shiftRecords: 'id, shift_date, shift_type, operator_id, production_data, created_at',
  
  // Minimal columns for reference data
  reference: 'id, name, code',
} as const;

// Default pagination settings
export const PAGINATION_DEFAULTS = {
  pageSize: 100,
  maxPageSize: 500,
  defaultLimit: 100,
} as const;

// Cache multipliers for different data types
export const CACHE_MULTIPLIERS = {
  // Ancient data (> 1 month)
  ancient: 5,
  
  // Historical data (> 1 week)
  historical: 3,
  
  // Recent data (< 1 week)
  recent: 2,
  
  // Live data (today)
  live: 1,
  
  // Reference data (rarely changes)
  reference: 4,
} as const;

/**
 * Determine appropriate cache multiplier based on data age
 */
export const getCacheMultiplier = (dateString?: string): number => {
  if (!dateString) return CACHE_MULTIPLIERS.live;
  
  const dataDate = new Date(dateString);
  const now = new Date();
  const daysOld = Math.floor((now.getTime() - dataDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysOld > 30) return CACHE_MULTIPLIERS.ancient;
  if (daysOld > 7) return CACHE_MULTIPLIERS.historical;
  if (daysOld > 1) return CACHE_MULTIPLIERS.recent;
  return CACHE_MULTIPLIERS.live;
};

/**
 * Build optimized query key with minimal but unique identifiers
 */
export const buildQueryKey = (baseKey: string, ...params: (string | number | boolean | null | undefined)[]): string[] => {
  const filteredParams = params.filter(p => p !== null && p !== undefined);
  return [baseKey, ...filteredParams.map(String)];
};

/**
 * Query performance tracking (for monitoring)
 */
class QueryPerformanceTracker {
  private metrics = new Map<string, { count: number; totalTime: number; avgTime: number }>();
  
  trackQuery(queryKey: string, executionTime: number) {
    const existing = this.metrics.get(queryKey) || { count: 0, totalTime: 0, avgTime: 0 };
    existing.count++;
    existing.totalTime += executionTime;
    existing.avgTime = existing.totalTime / existing.count;
    this.metrics.set(queryKey, existing);
  }
  
  getMetrics() {
    return Array.from(this.metrics.entries()).map(([key, metrics]) => ({
      queryKey: key,
      ...metrics,
    }));
  }
  
  getSlowestQueries(limit = 10) {
    return this.getMetrics()
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, limit);
  }
  
  getMostFrequentQueries(limit = 10) {
    return this.getMetrics()
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}

export const queryPerformanceTracker = new QueryPerformanceTracker();