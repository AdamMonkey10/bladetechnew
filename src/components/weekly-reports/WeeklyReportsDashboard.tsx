import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useWeeklyReports, useGenerateWeeklyReport } from '@/hooks/useWeeklyReports';
import { ReportsHistory } from './ReportsHistory';
import { RecipientManagement } from './RecipientManagement';
import { GenerateReportDialog } from './GenerateReportDialog';
import { Loader2, FileText, Users, Plus } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';

export default function WeeklyReportsDashboard() {
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const { data: reports, isLoading } = useWeeklyReports();
  const generateReport = useGenerateWeeklyReport();

  const handleGenerateReport = async (params: {
    weekStartDate?: string;
    recipientGroupIds?: string[];
  }) => {
    await generateReport.mutateAsync(params);
    setShowGenerateDialog(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Weekly Reports</h1>
          <p className="text-muted-foreground">Automated production reporting system</p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading reports...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Weekly Reports</h1>
          <p className="text-muted-foreground">Automated production reporting and recipient management</p>
        </div>

        <Button 
          onClick={() => setShowGenerateDialog(true)}
          disabled={generateReport.isPending}
          className="gap-2"
        >
          {generateReport.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Generate Report
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              All time generated reports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Report</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports?.[0] 
                ? formatDate(reports[0].week_start_date, 'dd/MM')
                : 'None'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Most recent report generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automation Status</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">
              Scheduled for Monday 8:00 AM
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reports">Reports History</TabsTrigger>
          <TabsTrigger value="recipients">Recipients</TabsTrigger>
        </TabsList>

        <TabsContent value="reports">
          <ReportsHistory reports={reports || []} />
        </TabsContent>

        <TabsContent value="recipients">
          <RecipientManagement />
        </TabsContent>
      </Tabs>

      <GenerateReportDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        onGenerate={handleGenerateReport}
        isGenerating={generateReport.isPending}
      />
    </div>
  );
}