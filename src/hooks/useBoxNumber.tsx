import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GenerateBoxNumberParams {
  sku?: string;
  po?: string;
}

export function useGenerateBoxNumber() {
  return useMutation({
    mutationFn: async (params?: GenerateBoxNumberParams): Promise<string> => {
      const { data, error } = await supabase.rpc('generate_next_box_number', {
        p_sku: params?.sku || '',
        p_po: params?.po || '',
      });
      
      if (error) {
        throw new Error(`Failed to generate box number: ${error.message}`);
      }
      
      return String(data);
    },
  });
}