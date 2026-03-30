import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Customer {
  id: string;
  name: string;
  customer_name?: string;
  template_name?: string;
  logo_url?: string;
  logo_position?: any;
  zpl_code?: string;
  is_active?: boolean;
  active?: boolean;
  code?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerData {
  name: string;
  customer_name?: string;
  template_name?: string;
  logo_url?: string;
  logo_position?: any;
  zpl_code?: string;
}

export function useCustomers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return (data || []).map(d => ({ ...d, customer_name: d.customer_name || d.name })) as unknown as Customer[];
    },
  });

  const createCustomer = useMutation({
    mutationFn: async (customerData: CreateCustomerData) => {
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: "Customer created successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error creating customer",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const updateCustomer = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Customer> & { id: string }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: "Customer updated successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error updating customer",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const uploadLogo = async (file: File, customerId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${customerId}-${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('customer-logos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('customer-logos')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  return {
    customers,
    isLoading,
    createCustomer: createCustomer.mutate,
    updateCustomer: updateCustomer.mutate,
    uploadLogo,
    isCreating: createCustomer.isPending,
    isUpdating: updateCustomer.isPending,
  };
}