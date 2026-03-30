import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WeeklyReport {
  id: string;
  week_number: number;
  year: number;
  week_start_date?: string;
  week_end_date?: string;
  report_data: any;
  generated_at?: string;
  generated_by?: string | null;
  sent_to?: any;
  status?: string | null;
  created_at: string;
  updated_at: string;
}

interface ReportRecipient {
  id: string;
  email: string;
  name: string;
  role?: string;
  active?: boolean | null;
  created_at: string;
  updated_at?: string;
}

interface ReportGroup {
  id: string;
  name: string;
  description: string;
}

export const useWeeklyReports = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['weekly-reports'],
    queryFn: async (): Promise<WeeklyReport[]> => {
      const { data, error } = await supabase
        .from('weekly_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error loading weekly reports",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return (data || []) as unknown as WeeklyReport[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useReportRecipients = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['report-recipients'],
    queryFn: async (): Promise<ReportRecipient[]> => {
      const { data, error } = await supabase
        .from('report_recipients')
        .select(`
          *,
          recipient_group_members(
            report_groups(id, name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error loading recipients",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useReportGroups = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['report-groups'],
    queryFn: async (): Promise<ReportGroup[]> => {
      const { data, error } = await supabase
        .from('report_groups')
        .select('*')
        .order('name');

      if (error) {
        toast({
          title: "Error loading report groups",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - groups don't change often
  });
};

export const useGenerateWeeklyReport = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      weekStartDate?: string;
      recipientGroupIds?: string[];
    }) => {
      const { data, error } = await supabase.functions.invoke('weekly-production-report', {
        body: {
          weekStartDate: params.weekStartDate,
          manualTrigger: true,
          recipientGroupIds: params.recipientGroupIds,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['weekly-reports'] });
      toast({
        title: "Report Generated Successfully",
        description: `Report sent to ${data.emailResults?.sent || 0} recipients`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Generating Report",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useCreateRecipient = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipient: {
      email: string;
      name: string;
      role?: string;
      groupIds: string[];
    }) => {
      // Create recipient
      const { data: newRecipient, error: recipientError } = await supabase
        .from('report_recipients')
        .insert({
          email: recipient.email,
          name: recipient.name,
          role: recipient.role,
        })
        .select()
        .single();

      if (recipientError) throw recipientError;

      // Add to groups
      if (recipient.groupIds.length > 0) {
        const groupMemberships = recipient.groupIds.map(groupId => ({
          recipient_id: newRecipient.id,
          group_id: groupId,
        }));

        const { error: membershipError } = await supabase
          .from('recipient_group_members')
          .insert(groupMemberships);

        if (membershipError) throw membershipError;
      }

      return newRecipient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-recipients'] });
      toast({
        title: "Recipient Added",
        description: "New recipient has been added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Adding Recipient",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateRecipient = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      email: string;
      name: string;
      role?: string;
      active: boolean;
      groupIds: string[];
    }) => {
      // Update recipient
      const { error: updateError } = await supabase
        .from('report_recipients')
        .update({
          email: params.email,
          name: params.name,
          role: params.role,
          active: params.active,
        })
        .eq('id', params.id);

      if (updateError) throw updateError;

      // Update group memberships
      // First, remove existing memberships
      const { error: deleteError } = await supabase
        .from('recipient_group_members')
        .delete()
        .eq('recipient_id', params.id);

      if (deleteError) throw deleteError;

      // Then add new memberships
      if (params.groupIds.length > 0) {
        const groupMemberships = params.groupIds.map(groupId => ({
          recipient_id: params.id,
          group_id: groupId,
        }));

        const { error: membershipError } = await supabase
          .from('recipient_group_members')
          .insert(groupMemberships);

        if (membershipError) throw membershipError;
      }

      return params.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-recipients'] });
      toast({
        title: "Recipient Updated",
        description: "Recipient has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating Recipient",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteRecipient = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipientId: string) => {
      const { error } = await supabase
        .from('report_recipients')
        .delete()
        .eq('id', recipientId);

      if (error) throw error;
      return recipientId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-recipients'] });
      toast({
        title: "Recipient Deleted",
        description: "Recipient has been removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting Recipient",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};