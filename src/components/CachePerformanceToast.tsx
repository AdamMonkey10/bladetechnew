import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface CacheStats {
  totalQueries: number;
  cacheHits: number;
  avgLoadTime: number;
  dataAge: 'current' | 'week' | 'month' | 'ancient';
}

// Simple in-memory cache stats tracker
class CacheStatsTracker {
  private stats = {
    totalQueries: 0,
    cacheHits: 0,
    totalLoadTime: 0,
  };

  recordQuery(loadTime: number, fromCache: boolean = false) {
    this.stats.totalQueries++;
    this.stats.totalLoadTime += loadTime;
    if (fromCache) {
      this.stats.cacheHits++;
    }
  }

  getStats(): CacheStats {
    return {
      totalQueries: this.stats.totalQueries,
      cacheHits: this.stats.cacheHits,
      avgLoadTime: this.stats.totalQueries > 0 ? this.stats.totalLoadTime / this.stats.totalQueries : 0,
      dataAge: 'current', // This will be determined by the caller
    };
  }

  getCacheHitRate(): number {
    return this.stats.totalQueries > 0 ? (this.stats.cacheHits / this.stats.totalQueries) * 100 : 0;
  }
}

export const cacheStatsTracker = new CacheStatsTracker();

interface CachePerformanceToastProps {
  show?: boolean;
  onShow?: () => void;
}

export const CachePerformanceToast = ({ show = false, onShow }: CachePerformanceToastProps) => {
  const { toast } = useToast();

  useEffect(() => {
    if (show && onShow) {
      const stats = cacheStatsTracker.getStats();
      const hitRate = cacheStatsTracker.getCacheHitRate();

      if (stats.totalQueries > 5 && hitRate > 50) {
        toast({
          title: "⚡ Cache Performance",
          description: `${hitRate.toFixed(0)}% cache hit rate - Loading ${stats.totalQueries} queries faster!`,
          duration: 3000,
        });
        onShow();
      }
    }
  }, [show, onShow, toast]);

  return null;
};