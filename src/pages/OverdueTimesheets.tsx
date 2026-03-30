import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTimesheetTracking } from '@/hooks/useTimesheetTracking';
import { AlertTriangle, Clock, User, Calendar, Plus, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDate } from '@/utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const escalationColors = {
  none: 'bg-gray-100 text-gray-800',
  late: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const escalationIcons = {
  none: Clock,
  late: AlertTriangle,
  critical: AlertTriangle
};

const dismissReasons = [
  { value: 'no_production', label: 'No production work' },
  { value: 'holiday', label: 'Holiday / Day off' },
  { value: 'data_error', label: 'Data entry error' },
  { value: 'other', label: 'Other' },
];

interface DismissDialogState {
  open: boolean;
  operatorId: string;
  operatorName: string;
  workDate: string;
}

export default function OverdueTimesheets() {
  const { overdueRecords, operatorStats, loading, markTimesheetSubmitted, refetch } = useTimesheetTracking();
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [dismissDialog, setDismissDialog] = useState<DismissDialogState>({
    open: false,
    operatorId: '',
    operatorName: '',
    workDate: '',
  });
  const [dismissReason, setDismissReason] = useState<string>('no_production');
  const navigate = useNavigate();

  const openDismissDialog = (operatorId: string, operatorName: string, workDate: string) => {
    setDismissDialog({
      open: true,
      operatorId,
      operatorName,
      workDate,
    });
    setDismissReason('no_production');
  };

  const handleDismiss = async () => {
    const { operatorId, workDate } = dismissDialog;
    setSubmittingId(`${operatorId}-${workDate}`);
    setDismissDialog({ ...dismissDialog, open: false });
    
    try {
      await markTimesheetSubmitted(operatorId, workDate);
      toast({
        title: "Record Dismissed",
        description: `Timesheet removed from overdue list (${dismissReasons.find(r => r.value === dismissReason)?.label})`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to dismiss record",
        variant: "destructive",
      });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleCreateTimesheet = (operatorCode: string, workDate: string) => {
    navigate(`/shifts/${operatorCode}/${workDate}`);
  };

  const totalOverdue = overdueRecords.length;
  const criticalCount = overdueRecords.filter(r => r.escalation_level === 'critical').length;
  const lateCount = overdueRecords.filter(r => r.escalation_level === 'late').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-pulse">Loading overdue timesheets...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Overdue Timesheets</h1>
        <p className="text-muted-foreground">Manage missing timesheets and track compliance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOverdue}</div>
            <p className="text-xs text-muted-foreground">Missing timesheets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lateCount}</div>
            <p className="text-xs text-muted-foreground">1 day overdue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
            <p className="text-xs text-muted-foreground">2+ days overdue</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="by-record" className="space-y-4">
        <TabsList>
          <TabsTrigger value="by-record">By Record</TabsTrigger>
          <TabsTrigger value="by-operator">By Operator</TabsTrigger>
        </TabsList>

        <TabsContent value="by-record" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Overdue Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overdueRecords.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No overdue timesheets found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operator</TableHead>
                      <TableHead>Work Date</TableHead>
                      <TableHead>Days Overdue</TableHead>
                      <TableHead>Escalation</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueRecords.map((record) => {
                      const EscalationIcon = escalationIcons[record.escalation_level];
                      const isSubmitting = submittingId === `${record.operator_id}-${record.work_date}`;
                      return (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{record.operators?.operator_name}</div>
                              <div className="text-sm text-muted-foreground">{record.operators?.operator_code}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <button 
                              className="text-left hover:text-primary underline-offset-4 hover:underline cursor-pointer"
                              onClick={() => navigate(`/shifts/${record.operators?.operator_code}/${record.work_date}`)}
                            >
                              {formatDate(record.work_date)}
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {record.days_overdue} days
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={escalationColors[record.escalation_level]}>
                              <EscalationIcon className="h-3 w-3 mr-1" />
                              {record.escalation_level.charAt(0).toUpperCase() + record.escalation_level.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleCreateTimesheet(record.operators?.operator_code || '', record.work_date)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Create Timesheet
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDismissDialog(
                                  record.operator_id, 
                                  record.operators?.operator_name || 'Unknown',
                                  record.work_date
                                )}
                                disabled={isSubmitting}
                              >
                                <X className="h-4 w-4 mr-1" />
                                {isSubmitting ? 'Dismissing...' : 'Dismiss'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-operator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Operator Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {operatorStats.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No overdue timesheets found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operator</TableHead>
                      <TableHead>Total Overdue</TableHead>
                      <TableHead>Highest Level</TableHead>
                      <TableHead>Oldest Date</TableHead>
                      <TableHead>Breakdown</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operatorStats.map((stat) => {
                      const EscalationIcon = escalationIcons[stat.highest_escalation];
                      return (
                        <TableRow key={stat.operator_id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{stat.operator_name}</div>
                              <div className="text-sm text-muted-foreground">{stat.operator_code}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-lg font-semibold">{stat.total_overdue}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={escalationColors[stat.highest_escalation]}>
                              <EscalationIcon className="h-3 w-3 mr-1" />
                              {stat.highest_escalation.charAt(0).toUpperCase() + stat.highest_escalation.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {stat.oldest_overdue_date ? formatDate(stat.oldest_overdue_date) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {stat.critical_count > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {stat.critical_count} Critical
                                </Badge>
                              )}
                              {stat.late_count > 0 && (
                                <Badge className="bg-orange-100 text-orange-800 text-xs">
                                  {stat.late_count} Late
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Last updated: {formatDate(new Date(), 'dd/MM/yyyy HH:mm')}
            </p>
            <Button onClick={refetch} variant="outline">
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dismiss Confirmation Dialog */}
      <AlertDialog open={dismissDialog.open} onOpenChange={(open) => setDismissDialog({ ...dismissDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dismiss Overdue Timesheet?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                This will remove the timesheet for <strong>{dismissDialog.operatorName}</strong> on{' '}
                <strong>{formatDate(dismissDialog.workDate)}</strong> from the overdue list{' '}
                <strong>without creating a shift record</strong>.
              </p>
              <p className="text-sm">
                Use this when no timesheet is needed (e.g., day off, data error).
              </p>
              <div className="pt-2">
                <label className="text-sm font-medium text-foreground">Reason (optional)</label>
                <Select value={dismissReason} onValueChange={setDismissReason}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {dismissReasons.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDismiss}>
              Dismiss Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
