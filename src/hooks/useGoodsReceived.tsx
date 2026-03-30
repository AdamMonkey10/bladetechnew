import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useGoodsReceived = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: goodsReceived = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['goods-received'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goods_received')
        .select('*')
        .order('received_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Query for QC-approved goods available for warehouse putaway
  const {
    data: qcApprovedGoods = [],
    isLoading: isLoadingApproved,
    refetch: refetchApproved
  } = useQuery({
    queryKey: ['qc-approved-goods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goods_received')
        .select('*')
        .eq('good_status', true)
        .in('warehouse_status', ['pending', 'partial'])
        .order('received_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, good_status }: { id: string; good_status: boolean }) => {
      const { error } = await supabase
        .from('goods_received')
        .update({ good_status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goods-received'] });
      queryClient.invalidateQueries({ queryKey: ['qc-approved-goods'] });
      toast({
        title: "Status updated",
        description: "Item status has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    goodsReceived,
    qcApprovedGoods,
    isLoading,
    isLoadingApproved,
    error,
    refetch,
    refetchApproved,
    updateStatus: updateStatusMutation.mutate,
    isUpdating: updateStatusMutation.isPending
  };
};