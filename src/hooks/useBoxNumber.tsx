import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useGenerateBoxNumber() {
  return useMutation({
    mutationFn: async (): Promise<string> => {
      const { data, error } = await supabase.rpc('generate_next_box_number');
      
      if (error) {
        throw new Error(`Failed to generate box number: ${error.message}`);
      }
      
      return data as string;
    },
  });
}