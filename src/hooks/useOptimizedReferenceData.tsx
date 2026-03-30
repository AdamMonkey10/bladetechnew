import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Extended cache durations for reference data that changes infrequently
const REFERENCE_CACHE_DURATION = {
  staleTime: 10 * 60 * 1000, // 10 minutes (was 24 hours, but being more conservative)
  gcTime: 30 * 60 * 1000,    // 30 minutes
};

export const useOptimizedOperators = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['operators-optimized'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('operators')
          .select('id, operator_name, operator_code, active')
          .eq('active', true)
          .order('operator_name');

        if (error) throw error;
        return data || [];
      } catch (error: any) {
        toast({
          title: "Error loading operators",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
    ...REFERENCE_CACHE_DURATION,
    refetchOnWindowFocus: false,
  });
};

export const useOptimizedMachines = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['machines-optimized'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('machines')
          .select('id, machine_name, machine_code, machine_type, active')
          .eq('active', true)
          .order('machine_name');

        if (error) throw error;
        return data || [];
      } catch (error: any) {
        toast({
          title: "Error loading machines",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
    ...REFERENCE_CACHE_DURATION,
    refetchOnWindowFocus: false,
  });
};

export const useOptimizedCustomerPOs = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['customer-pos-minimal'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('customer_pos')
          .select('id, po_number, customer_name, status, delivery_date, progress_percentage')
          .order('po_date', { ascending: false })
          .limit(200); // Reduced from unlimited

        if (error) throw error;
        return data || [];
      } catch (error: any) {
        toast({
          title: "Error loading customer POs",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for customer POs (more dynamic)
    gcTime: 5 * 60 * 1000,    // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useOptimizedProducts = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['products-optimized'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, product_code, product_name, box_amount')
          .order('product_name');

        if (error) throw error;
        return data || [];
      } catch (error: any) {
        toast({
          title: "Error loading products",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
    ...REFERENCE_CACHE_DURATION,
    refetchOnWindowFocus: false,
  });
};