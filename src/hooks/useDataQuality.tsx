import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DataQualityMetrics {
  total_records: number;
  records_with_hours: number;
  records_without_hours: number;
  records_with_sku: number;
  records_without_sku: number;
  avg_hours: number;
  data_completeness: number;
}

export const useDataQuality = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [corrections, setCorrections] = useState<CorrectionRecord[]>([]);
  const [metrics, setMetrics] = useState<DataQualityMetrics | null>(null);
  const { toast } = useToast();

  const getDataQualityMetrics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_data_quality_metrics');
      if (error) throw error;
      setMetrics(data[0] || null);
      return data[0] || null;
    } catch (error: any) {
      toast({
        title: "Error fetching data quality metrics",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const fixMissingHours = async () => {
    setIsFixing(true);
    try {
      const { data, error } = await supabase.rpc('fix_missing_hours');
      if (error) throw error;
      
      const fixedCount = typeof data === 'number' ? data : 0;
      
      toast({
        title: "Data corrections applied",
        description: `Fixed ${fixedCount} records with missing hours`,
        variant: "default",
      });

      // Refresh metrics after correction
      await getDataQualityMetrics();
      
      return fixedCount;
    } catch (error: any) {
      toast({
        title: "Error applying corrections",
        description: error.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setIsFixing(false);
    }
  };

  return {
    isFixing,
    corrections,
    metrics,
    fixMissingHours,
    getDataQualityMetrics,
  };
};