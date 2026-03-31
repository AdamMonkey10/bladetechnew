import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Pallet {
  id: string;
  pallet_number: string;
  customer?: string | null;
  po?: string | null;
  sku?: string | null;
  status?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  user_id?: string | null;
}

export interface PalletAssignment {
  id: string;
  pallet_id: string | null;
  printed_label_id: string | null;
  assigned_at: string;
}

export interface CreatePalletData {
  pallet_number: string;
  customer?: string;
  po?: string;
  sku?: string;
}

export interface AssignLabelToPalletData {
  pallet_id: string;
  printed_label_id: string;
}

// Hook to get all pallets
export function usePallets() {
  return useQuery({
    queryKey: ['pallets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pallets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Pallet[];
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook to get active pallets for a specific customer/PO
export function useActivePallets(customer?: string, po_number?: string) {
  return useQuery({
    queryKey: ['active-pallets', customer, po_number],
    queryFn: async () => {
      let query = supabase
        .from('pallets')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (customer) {
        query = query.eq('sku', customer);
      }
      if (po_number) {
        query = query.eq('po', po_number);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Pallet[];
    },
    enabled: !!customer || !!po_number,
    staleTime: 30 * 1000,
  });
}

// Hook to get pallet details with assigned labels
export function usePalletDetails(palletId: string) {
  return useQuery({
    queryKey: ['pallet-details', palletId],
    queryFn: async () => {
      const [palletResponse, assignmentsResponse] = await Promise.all([
        supabase
          .from('pallets')
          .select('*')
          .eq('id', palletId)
          .single(),
        supabase
          .from('pallet_assignments')
          .select(`
            *,
            printed_labels (*)
          `)
          .eq('pallet_id', palletId)
          .order('assigned_at', { ascending: true })
      ]);

      if (palletResponse.error) throw palletResponse.error;
      if (assignmentsResponse.error) throw assignmentsResponse.error;

      return {
        pallet: palletResponse.data as Pallet,
        assignments: assignmentsResponse.data
      };
    },
    enabled: !!palletId,
    staleTime: 30 * 1000,
  });
}

// Hook to create a new pallet
export function useCreatePallet() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePalletData) => {
      // Generate pallet number
      const { data: palletNumber, error: numberError } = await supabase.rpc('generate_next_pallet_number');
      if (numberError) throw numberError;

      // Create pallet
      const { data: pallet, error } = await supabase
        .from('pallets')
        .insert([{
          pallet_number: palletNumber,
          customer: data.customer,
          po: data.po,
          sku: data.sku,
          user_id: (await supabase.auth.getUser()).data.user?.id!
        }])
        .select()
        .single();

      if (error) throw error;
      return pallet as Pallet;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pallets'] });
      queryClient.invalidateQueries({ queryKey: ['active-pallets'] });
      toast({
        title: "Pallet Created",
        description: `Pallet ${data.pallet_number} created successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating Pallet",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook to assign a label to a pallet
export function useAssignLabelToPallet() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AssignLabelToPalletData) => {
      const { data: assignment, error } = await supabase
        .from('pallet_assignments')
        .insert([{
          pallet_id: data.pallet_id,
          printed_label_id: data.printed_label_id,
          assigned_by: (await supabase.auth.getUser()).data.user?.id!
        }])
        .select()
        .single();

      if (error) throw error;
      return assignment as PalletAssignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pallets'] });
      queryClient.invalidateQueries({ queryKey: ['active-pallets'] });
      queryClient.invalidateQueries({ queryKey: ['pallet-details'] });
      toast({
        title: "Label Assigned",
        description: "Label assigned to pallet successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Assigning Label",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook to update pallet status
export function useUpdatePalletStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ palletId, status }: { palletId: string; status: 'active' | 'completed' | 'shipped' }) => {
      const updateData: any = { status };
      if (status === 'completed' || status === 'shipped') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('pallets')
        .update(updateData)
        .eq('id', palletId)
        .select()
        .single();

      if (error) throw error;
      return data as Pallet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pallets'] });
      queryClient.invalidateQueries({ queryKey: ['active-pallets'] });
      queryClient.invalidateQueries({ queryKey: ['pallet-details'] });
      toast({
        title: "Pallet Updated",
        description: "Pallet status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating Pallet",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook to unassign a label from pallet
export function useUnassignLabelFromPallet() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('pallet_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pallets'] });
      queryClient.invalidateQueries({ queryKey: ['active-pallets'] });
      queryClient.invalidateQueries({ queryKey: ['pallet-details'] });
      toast({
        title: "Label Unassigned",
        description: "Label unassigned from pallet successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Unassigning Label",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}