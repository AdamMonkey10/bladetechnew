import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { localStorageCache } from '@/utils/cacheUtils';

// Products hook
export const useProducts = (enabled = true) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      // Try localStorage first for ultra-fast loading
      const cachedData = localStorageCache.get<any[]>('products');
      if (cachedData) {
        return cachedData;
      }

      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, product_code, product_name, description, box_amount')
          .order('product_code')
          .limit(1000);

        if (error) throw error;
        
        // Cache in localStorage for 48 hours (reference data)
        localStorageCache.set('products', data || []);
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
    enabled,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - reference data rarely changes
    gcTime: 48 * 60 * 60 * 1000, // 48 hours
    refetchOnWindowFocus: false,
  });
};

// Machines hook
export const useMachines = (enabled = true) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['machines'],
    queryFn: async () => {
      // Try localStorage first for ultra-fast loading
      const cachedData = localStorageCache.get<any[]>('machines');
      if (cachedData) {
        return cachedData;
      }

      try {
        const { data, error } = await supabase
          .from('machines')
          .select('id, machine_code, machine_name, machine_type, active')
          .eq('active', true)
          .order('machine_code')
          .limit(500);

        if (error) throw error;
        
        // Cache in localStorage for 48 hours (reference data)
        localStorageCache.set('machines', data || []);
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
    enabled,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - reference data rarely changes
    gcTime: 48 * 60 * 60 * 1000, // 48 hours
    refetchOnWindowFocus: false,
  });
};

// Operators hook
export const useOperators = (enabled = true) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['operators'],
    queryFn: async () => {
      // Try localStorage first for ultra-fast loading
      const cachedData = localStorageCache.get<any[]>('operators');
      if (cachedData) {
        return cachedData;
      }

      try {
        const { data, error } = await supabase
          .from('operators')
          .select('id, operator_code, operator_name, active')
          .eq('active', true)
          .order('operator_name')
          .limit(500);

        if (error) throw error;
        
        // Cache in localStorage for 48 hours (reference data)
        localStorageCache.set('operators', data || []);
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
    enabled,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - reference data rarely changes
    gcTime: 48 * 60 * 60 * 1000, // 48 hours
    refetchOnWindowFocus: false,
  });
};

// Suppliers hook
export const useSuppliers = (enabled = true) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      // Try localStorage first for ultra-fast loading
      const cachedData = localStorageCache.get<any[]>('suppliers');
      if (cachedData) {
        return cachedData;
      }

      try {
        const { data, error } = await supabase
          .from('suppliers')
          .select('id, name')
          .order('name')
          .limit(500);

        if (error) throw error;
        
        // Cache in localStorage for 48 hours (reference data)
        localStorageCache.set('suppliers', data || []);
        return data || [];
      } catch (error: any) {
        toast({
          title: "Error loading suppliers",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - reference data rarely changes
    gcTime: 48 * 60 * 60 * 1000, // 48 hours
    refetchOnWindowFocus: false,
  });
};

// Raw Materials hook
export const useRawMaterials = (enabled = true) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['rawMaterials'],
    queryFn: async () => {
      // Try localStorage first for ultra-fast loading
      const cachedData = localStorageCache.get<any[]>('rawMaterials');
      if (cachedData) {
        return cachedData;
      }

      try {
        const { data, error } = await supabase
          .from('raw_materials')
          .select('id, material_code, material_name, description')
          .order('material_code')
          .limit(500);

        if (error) throw error;
        
        // Cache in localStorage for 48 hours (reference data)
        localStorageCache.set('rawMaterials', data || []);
        return data || [];
      } catch (error: any) {
        toast({
          title: "Error loading raw materials",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - reference data rarely changes
    gcTime: 48 * 60 * 60 * 1000, // 48 hours
    refetchOnWindowFocus: false,
  });
};

// Combined hook for all reference data
export const useReferenceData = () => {
  const queryClient = useQueryClient();
  const products = useProducts();
  const machines = useMachines();
  const operators = useOperators();
  const suppliers = useSuppliers();
  const rawMaterials = useRawMaterials();

  const invalidateReferenceData = () => {
    // Clear localStorage cache
    localStorageCache.set('products', null);
    localStorageCache.set('machines', null);
    localStorageCache.set('operators', null);
    localStorageCache.set('suppliers', null);
    localStorageCache.set('rawMaterials', null);
    
    // Invalidate React Query cache
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['machines'] });
    queryClient.invalidateQueries({ queryKey: ['operators'] });
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    queryClient.invalidateQueries({ queryKey: ['rawMaterials'] });
  };

  return {
    products: products.data || [],
    machines: machines.data || [],
    operators: operators.data || [],
    suppliers: suppliers.data || [],
    rawMaterials: rawMaterials.data || [],
    isLoading: products.isLoading || machines.isLoading || operators.isLoading || suppliers.isLoading || rawMaterials.isLoading,
    error: products.error || machines.error || operators.error || suppliers.error || rawMaterials.error,
    refetch: () => {
      products.refetch();
      machines.refetch();
      operators.refetch();
      suppliers.refetch();
      rawMaterials.refetch();
    },
    invalidateReferenceData,
  };
};