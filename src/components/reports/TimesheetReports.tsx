import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedTimesheetComplianceReports } from "./EnhancedTimesheetComplianceReports";
import { InteractiveTimesheetReports } from "./InteractiveTimesheetReports";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, FileText, Zap, TrendingUp } from "lucide-react";

export function TimesheetReports() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Timesheet & Compliance Reports</h1>
        <p className="text-muted-foreground">
          Comprehensive reporting suite for timesheet compliance, productivity analysis, and operational insights
        </p>
      </div>

      <Tabs defaultValue="enhanced" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="enhanced" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics Dashboard
          </TabsTrigger>
          <TabsTrigger value="interactive" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Report Builder
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enhanced">
          <EnhancedTimesheetComplianceReports />
        </TabsContent>

        <TabsContent value="interactive">
          <InteractiveTimesheetReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}