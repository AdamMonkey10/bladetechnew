import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target } from 'lucide-react';
// Import types directly from the hook file
interface WeeklyBreakdownData {
  weekStart: string;
  weekEnd: string;
  summary: {
    totalProduction: number;
    totalRuntime: number;
    operatorsWorked: number;
    machinesUtilized: number;
    skusProduced: number;
    overallEfficiency: number;
  };
  machines: Array<{
    machine: string;
    totalRuntime: number;
    totalUnits: number;
    totalScrap: number;
    utilization: number;
    efficiency: number;
  }>;
  operators: Array<{
    operatorName: string;
    operatorCode: string;
    totalRuntime: number;
    totalUnits: number;
    totalScrap: number;
    averageEfficiency: number;
    machines: string[];
  }>;
  detailedRecords: Array<{
    date: string;
    shiftType: string;
    sku: string;
    units: number;
    runtime: number;
    scrap: number;
    rate: number;
    efficiency: number;
  }>;
}

interface ExecutiveSummaryCardProps {
  data: WeeklyBreakdownData;
}

export function ExecutiveSummaryCard({ data }: ExecutiveSummaryCardProps) {
  // Calculate insights
  const topPerformers = [...data.operators]
    .sort((a, b) => b.averageEfficiency - a.averageEfficiency)
    .slice(0, 3);
    
  const poorPerformers = [...data.operators]
    .sort((a, b) => a.averageEfficiency - b.averageEfficiency)
    .filter(op => op.averageEfficiency < 70)
    .slice(0, 3);

  const topMachines = [...data.machines]
    .sort((a, b) => b.efficiency - a.efficiency)
    .slice(0, 3);

  const criticalIssues = [];
  const achievements = [];

  // Analyze performance
  if (data.summary.overallEfficiency < 70) {
    criticalIssues.push(`Overall efficiency at ${data.summary.overallEfficiency.toFixed(1)}% - below target`);
  } else if (data.summary.overallEfficiency >= 85) {
    achievements.push(`Excellent overall efficiency of ${data.summary.overallEfficiency.toFixed(1)}%`);
  }

  // Check machine utilization issues
  const lowUtilizationMachines = data.machines.filter(m => m.utilization < 60);
  if (lowUtilizationMachines.length > 0) {
    criticalIssues.push(`${lowUtilizationMachines.length} machine(s) with low utilization`);
  }

  // Check high production
  if (data.summary.totalProduction > 50000) {
    achievements.push(`High production week: ${data.summary.totalProduction.toLocaleString()} units`);
  }

  const getStatusIcon = () => {
    if (criticalIssues.length > achievements.length) {
      return <AlertTriangle className="h-5 w-5 text-destructive" />;
    } else if (achievements.length > 0) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <Target className="h-5 w-5 text-primary" />;
  };

  const getStatusBadge = () => {
    if (criticalIssues.length > achievements.length) {
      return <Badge variant="destructive">Needs Attention</Badge>;
    } else if (achievements.length > 0) {
      return <Badge className="bg-green-600 hover:bg-green-600/80">Excellent</Badge>;
    }
    return <Badge variant="secondary">Satisfactory</Badge>;
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-r from-background to-muted/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-xl">Executive Summary</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Achievements */}
          {achievements.length > 0 && (
            <div>
              <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Key Achievements
              </h4>
              <ul className="space-y-1">
                {achievements.map((achievement, idx) => (
                  <li key={idx} className="text-sm text-green-600 flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {achievement}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Critical Issues */}
          {criticalIssues.length > 0 && (
            <div>
              <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Areas of Concern
              </h4>
              <ul className="space-y-1">
                {criticalIssues.map((issue, idx) => (
                  <li key={idx} className="text-sm text-destructive flex items-start gap-2">
                    <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Performance Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
          {/* Top Performers */}
          <div>
            <h4 className="font-medium mb-3">Top Performing Operators</h4>
            <div className="space-y-2">
              {topPerformers.map((operator, idx) => (
                <div key={`${operator.operatorName}_${operator.operatorCode}`} className="flex justify-between items-center text-sm">
                  <span className="font-medium">
                    #{idx + 1} {operator.operatorName}
                  </span>
                  <Badge variant="default" className="text-xs">
                    {operator.averageEfficiency.toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Top Machines */}
          <div>
            <h4 className="font-medium mb-3">Best Performing Machines</h4>
            <div className="space-y-2">
              {topMachines.map((machine, idx) => (
                <div key={machine.machine} className="flex justify-between items-center text-sm">
                  <span className="font-medium">
                    #{idx + 1} {machine.machine}
                  </span>
                  <Badge variant="default" className="text-xs">
                    {machine.efficiency.toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}