import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useReportRecipients, useReportGroups, useDeleteRecipient } from '@/hooks/useWeeklyReports';
import { RecipientDialog } from './RecipientDialog';
import { Loader2, Plus, Edit, Trash2, Users, Mail } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';

export function RecipientManagement() {
  const [showRecipientDialog, setShowRecipientDialog] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<any>(null);
  
  const { data: recipients, isLoading: loadingRecipients } = useReportRecipients();
  const { data: groups, isLoading: loadingGroups } = useReportGroups();
  const deleteRecipient = useDeleteRecipient();

  const handleEditRecipient = (recipient: any) => {
    setEditingRecipient(recipient);
    setShowRecipientDialog(true);
  };

  const handleAddRecipient = () => {
    setEditingRecipient(null);
    setShowRecipientDialog(true);
  };

  const handleDeleteRecipient = async (recipientId: string) => {
    if (confirm('Are you sure you want to delete this recipient?')) {
      await deleteRecipient.mutateAsync(recipientId);
    }
  };

  const getRecipientGroups = (recipient: any) => {
    if (!recipient.recipient_group_members) return [];
    return recipient.recipient_group_members.map((member: any) => member.report_groups?.name).filter(Boolean);
  };

  if (loadingRecipients || loadingGroups) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading recipients...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recipients?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all groups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Recipients</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recipients?.filter(r => r.active).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently receiving reports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Report Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Management, Operations, QC
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recipients Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Report Recipients</CardTitle>
          <Button onClick={handleAddRecipient} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Recipient
          </Button>
        </CardHeader>
        <CardContent>
          {!recipients || recipients.length === 0 ? (
            <div className="py-12 text-center">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No recipients configured yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add recipients to start sending automated weekly reports.
              </p>
              <Button onClick={handleAddRecipient} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Add First Recipient
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Groups</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.map((recipient) => (
                  <TableRow key={recipient.id}>
                    <TableCell className="font-medium">{recipient.name}</TableCell>
                    <TableCell>{recipient.email}</TableCell>
                    <TableCell>{recipient.role || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {getRecipientGroups(recipient).map((group) => (
                          <Badge key={group} variant="secondary" className="text-xs">
                            {group}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={recipient.active ? 'default' : 'secondary'}>
                        {recipient.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(recipient.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditRecipient(recipient)}
                          className="gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteRecipient(recipient.id)}
                          disabled={deleteRecipient.isPending}
                          className="gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <RecipientDialog
        open={showRecipientDialog}
        onOpenChange={setShowRecipientDialog}
        recipient={editingRecipient}
        groups={groups || []}
      />
    </div>
  );
}