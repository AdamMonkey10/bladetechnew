import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface POLineItem {
  sku: string;
  quantity: number;
  dispatch_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface LineItemProgress {
  sku: string;
  printed: number;
  required: number;
  progress: number;
}

export interface CustomerPO {
  id: string;
  customer_name: string;
  customer_template_id?: string;
  po_number: string;
  po_date: string;
  delivery_date?: string;
  status: boolean;
  items: POLineItem[];
  notes?: string;
  total_printed?: number;
  boxes_printed?: number;
  progress_percentage?: number;
  line_item_progress?: Record<string, LineItemProgress>;
  created_at: string;
  updated_at: string;
}

export const useCustomerPOs = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['customer-pos'],
    queryFn: async (): Promise<CustomerPO[]> => {
      try {
        const { data, error } = await supabase
          .from('customer_pos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        return (data || []).map(po => ({
          ...po,
          items: Array.isArray(po.items) ? po.items : []
        })) as unknown as CustomerPO[];
      } catch (error: any) {
        toast({
          title: "Error loading customer POs",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const createPO = useMutation({
    mutationFn: async (po: Omit<CustomerPO, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User must be authenticated to create a PO');
      }

      const { data, error } = await supabase
        .from('customer_pos')
        .insert({
          customer_name: po.customer_name,
          customer_template_id: po.customer_template_id || null,
          po_number: po.po_number,
          po_date: po.po_date,
          delivery_date: po.delivery_date,
          status: po.status as string,
          items: po.items as any,
          notes: po.notes,
          user_id: user.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-pos'] });
      toast({
        title: "Success",
        description: "Customer PO created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating PO",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePO = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CustomerPO> & { id: string }) => {
      // Validate ID
      if (!id) {
        throw new Error('PO ID is required for update');
      }

      // Prepare update data and remove fields that shouldn't be updated
      const updateData: any = { ...updates };
      delete updateData.id;
      delete updateData.created_at;
      delete updateData.updated_at;
      delete updateData.user_id;
      
      const { data, error } = await supabase
        .from('customer_pos')
        .update(updateData)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        throw new Error('PO not found or you do not have permission to update it');
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-pos'] });
      toast({
        title: "Success",
        description: "Customer PO updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating PO",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const completePO = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('customer_pos')
        .update({ status: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-pos'] });
      toast({
        title: "Success",
        description: "PO marked as completed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error completing PO",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    pos: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createPO,
    updatePO,
    completePO,
    refetch: query.refetch,
  };
};