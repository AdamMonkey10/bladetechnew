import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { FileText, BarChart3, ClipboardCheck, Settings, Cog } from 'lucide-react';
import { QCTestReports } from './QCTestReports';
import { ProductionReports } from './ProductionReports';
import { TimesheetReports } from './TimesheetReports';
import { OEEReports } from './OEEReports';
import { ReportManagement } from './ReportManagement';

export default function UnifiedReportsDashboard() {
  const [activeTab, setActiveTab] = useState('qc-test');

  const reportTabs = [
    {
      id: 'qc-test',
      name: 'QC & Test Reports',
      icon: <FileText className="h-4 w-4" />,
      description: 'Quality control test results and analysis',
      component: QCTestReports
    },
    {
      id: 'production',
      name: 'Production Reports',
      icon: <BarChart3 className="h-4 w-4" />,
      description: 'Weekly production summaries and metrics',
      component: ProductionReports
    },
    {
      id: 'timesheet',
      name: 'Timesheet & Compliance',
      icon: <ClipboardCheck className="h-4 w-4" />,
      description: 'Compliance tracking and productivity analysis',
      component: TimesheetReports
    },
    {
      id: 'oee',
      name: 'OEE & Performance',
      icon: <Settings className="h-4 w-4" />,
      description: 'Overall equipment effectiveness analysis',
      component: OEEReports
    },
    {
      id: 'management',
      name: 'Report Management',
      icon: <Cog className="h-4 w-4" />,
      description: 'Generated reports and scheduling',
      component: ReportManagement
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive reporting and analytics center</p>
        </div>
        
        <Badge variant="secondary" className="text-sm">
          {reportTabs.find(tab => tab.id === activeTab)?.name}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {reportTabs.map((tab) => (
          <Card 
            key={tab.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              activeTab === tab.id ? 'ring-2 ring-primary bg-primary/5' : ''
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                {tab.icon}
                <CardTitle className="text-sm">{tab.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{tab.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {(() => {
          const activeTabData = reportTabs.find(tab => tab.id === activeTab);
          if (activeTabData) {
            const Component = activeTabData.component;
            return <Component />;
          }
          return null;
        })()}
      </div>
    </div>
  );
}