import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DataQualityMetrics {
  total_records: number;
  records_with_corrections: number;
  correction_percentage: number;
  activities_corrected: any;
}

interface CorrectionRecord {
  record_id: string;
  activity_type: string;
  units_produced: number;
  original_hours: number;
  estimated_hours: number;
  corrected: boolean;
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
      
      setCorrections(data || []);
      
      toast({
        title: "Data corrections applied",
        description: `Fixed ${data?.length || 0} records with missing hours`,
        variant: "default",
      });

      // Refresh metrics after correction
      await getDataQualityMetrics();
      
      return data || [];
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