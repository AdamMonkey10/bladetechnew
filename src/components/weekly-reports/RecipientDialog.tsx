import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateRecipient, useUpdateRecipient } from '@/hooks/useWeeklyReports';
import { Loader2 } from 'lucide-react';

interface RecipientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient?: any;
  groups: any[];
}

export function RecipientDialog({ open, onOpenChange, recipient, groups }: RecipientDialogProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: '',
    active: true,
    groupIds: [] as string[],
  });

  const createRecipient = useCreateRecipient();
  const updateRecipient = useUpdateRecipient();

  useEffect(() => {
    if (recipient) {
      // Extract group IDs from recipient data
      const groupIds = recipient.recipient_group_members?.map((member: any) => member.report_groups?.id).filter(Boolean) || [];
      
      setFormData({
        email: recipient.email || '',
        name: recipient.name || '',
        role: recipient.role || '',
        active: recipient.active ?? true,
        groupIds,
      });
    } else {
      setFormData({
        email: '',
        name: '',
        role: '',
        active: true,
        groupIds: [],
      });
    }
  }, [recipient, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (recipient) {
        await updateRecipient.mutateAsync({
          id: recipient.id,
          ...formData,
        });
      } else {
        await createRecipient.mutateAsync(formData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving recipient:', error);
    }
  };

  const handleGroupChange = (groupId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      groupIds: checked 
        ? [...prev.groupIds, groupId]
        : prev.groupIds.filter(id => id !== groupId)
    }));
  };

  const isLoading = createRecipient.isPending || updateRecipient.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {recipient ? 'Edit Recipient' : 'Add New Recipient'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role (Optional)</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              placeholder="e.g., Production Manager, QC Lead"
            />
          </div>

          <div className="space-y-3">
            <Label>Report Groups</Label>
            <div className="space-y-2">
              {groups.map((group) => (
                <div key={group.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={group.id}
                    checked={formData.groupIds.includes(group.id)}
                    onCheckedChange={(checked) => handleGroupChange(group.id, !!checked)}
                  />
                  <Label htmlFor={group.id} className="text-sm font-normal">
                    {group.name}
                    {group.description && (
                      <span className="text-muted-foreground ml-1">
                        - {group.description}
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
            />
            <Label htmlFor="active">Active (receives reports)</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {recipient ? 'Update' : 'Add'} Recipient
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}