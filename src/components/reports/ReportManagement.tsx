import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  Users, 
  Settings, 
  Plus,
  Trash2,
  Edit,
  Send,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useWeeklyReports, useReportRecipients, useReportGroups } from '@/hooks/useWeeklyReports';
import { RecipientManagement } from '@/components/weekly-reports/RecipientManagement';

interface ScheduledReport {
  id: string;
  name: string;
  type: 'qc' | 'production' | 'timesheet' | 'oee';
  schedule: string;
  recipients: string[];
  lastRun: string;
  nextRun: string;
  active: boolean;
}

export function ReportManagement() {
  const { toast } = useToast();
  const [view, setView] = useState<'history' | 'schedule' | 'recipients'>('history');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const { data: weeklyReports, isLoading: reportsLoading } = useWeeklyReports();
  const { data: recipients } = useReportRecipients();
  const { data: groups } = useReportGroups();

  // Mock scheduled reports
  const scheduledReports: ScheduledReport[] = [
    {
      id: '1',
      name: 'Weekly Production Summary',
      type: 'production',
      schedule: 'Weekly - Monday 8:00 AM',
      recipients: ['Management Team', 'Production Team'],
      lastRun: '2024-01-15T08:00:00Z',
      nextRun: '2024-01-22T08:00:00Z',
      active: true
    },
    {
      id: '2',
      name: 'Daily QC Report',
      type: 'qc',
      schedule: 'Daily - 6:00 PM',
      recipients: ['QC Team'],
      lastRun: '2024-01-19T18:00:00Z',
      nextRun: '2024-01-20T18:00:00Z',
      active: true
    },
    {
      id: '3',
      name: 'Monthly OEE Analysis',
      type: 'oee',
      schedule: 'Monthly - 1st @ 9:00 AM',
      recipients: ['Management Team'],
      lastRun: '2024-01-01T09:00:00Z',
      nextRun: '2024-02-01T09:00:00Z',
      active: false
    }
  ];

  const exportReport = (report: any) => {
    // Export logic would go here
    toast({
      title: "Report Downloaded",
      description: `${report.type} report has been downloaded`,
    });
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'qc': return 'bg-blue-500';
      case 'production': return 'bg-green-500';
      case 'timesheet': return 'bg-orange-500';
      case 'oee': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'completed' ? (
      <Badge className="bg-green-500 hover:bg-green-600">
        Completed
      </Badge>
    ) : (
      <Badge variant="secondary">
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Report Management</h2>
          <p className="text-muted-foreground">Manage generated reports, schedules, and recipients</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={view === 'history' ? 'default' : 'outline'}
            onClick={() => setView('history')}
          >
            History
          </Button>
          <Button 
            variant={view === 'schedule' ? 'default' : 'outline'}
            onClick={() => setView('schedule')}
          >
            Schedules
          </Button>
          <Button 
            variant={view === 'recipients' ? 'default' : 'outline'}
            onClick={() => setView('recipients')}
          >
            Recipients
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reports</p>
                <p className="text-3xl font-bold">{weeklyReports?.length || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Schedules</p>
                <p className="text-3xl font-bold text-green-600">
                  {scheduledReports.filter(r => r.active).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recipients</p>
                <p className="text-3xl font-bold">{recipients?.length || 0}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Report Groups</p>
                <p className="text-3xl font-bold">{groups?.length || 0}</p>
              </div>
              <Settings className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {view === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Report History</CardTitle>
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-pulse">Loading reports...</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date Generated</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Generated By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weeklyReports?.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {format(new Date(report.generated_at), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getReportTypeColor('production')}>
                            Production
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(report.week_start_date), 'MMM dd')} - {format(new Date(report.week_end_date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell>System</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedReport(report)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => exportReport(report)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Export
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No reports generated yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {view === 'schedule' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Scheduled Reports</CardTitle>
                <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Schedule Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Schedule New Report</DialogTitle>
                      <DialogDescription>
                        Set up automated report generation and delivery
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="report-name">Report Name</Label>
                          <Input id="report-name" placeholder="e.g. Daily QC Summary" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="report-type">Report Type</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="qc">QC & Test Reports</SelectItem>
                              <SelectItem value="production">Production Reports</SelectItem>
                              <SelectItem value="timesheet">Timesheet Reports</SelectItem>
                              <SelectItem value="oee">OEE Reports</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Schedule</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Recipients</Label>
                        <div className="space-y-2">
                          {groups?.map((group) => (
                            <div key={group.id} className="flex items-center space-x-2">
                              <Checkbox id={group.id} />
                              <Label htmlFor={group.id}>{group.name}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => {
                          setScheduleDialogOpen(false);
                          toast({
                            title: "Schedule Created",
                            description: "Report schedule has been created successfully",
                          });
                        }}>
                          Create Schedule
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Last Run</TableHead>
                      <TableHead>Next Run</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.name}</TableCell>
                        <TableCell>
                          <Badge className={getReportTypeColor(report.type)}>
                            {report.type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{report.schedule}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {report.recipients.map((recipient, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {recipient}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(report.lastRun), 'MMM dd, HH:mm')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(report.nextRun), 'MMM dd, HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={report.active ? 'default' : 'secondary'}>
                            {report.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Send className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {view === 'recipients' && (
        <RecipientManagement />
      )}
    </div>
  );
}