import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Users, Clock, TrendingUp, Target } from "lucide-react";

interface OperatorShiftData {
  operatorName: string;
  operatorCode: string;
  shiftDate: string;
  shiftType: string;
  activity: string;
  unitsProduced: number;
  timeSpent: number;
  scrap: number;
  actualRate: number;
  targetRate: number;
  efficiency: number;
  qualityRate: number;
}

interface OperatorShiftBreakdownProps {
  data: OperatorShiftData[];
  isLoading?: boolean;
}

const getEfficiencyColor = (efficiency: number) => {
  if (efficiency >= 90) return "text-green-600 dark:text-green-400";
  if (efficiency >= 75) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
};

const getEfficiencyBadge = (efficiency: number) => {
  if (efficiency >= 90) return { variant: "default" as const, label: "Excellent" };
  if (efficiency >= 75) return { variant: "secondary" as const, label: "Good" };
  return { variant: "destructive" as const, label: "Below Target" };
};

export function OperatorShiftBreakdown({ data, isLoading }: OperatorShiftBreakdownProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Operator Shift Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Operator Shift Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No operator shift data available for the selected period.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group data by operator for summary stats
  const operatorSummary = data.reduce((acc, shift) => {
    const key = `${shift.operatorName}-${shift.operatorCode}`;
    if (!acc[key]) {
      acc[key] = {
        operatorName: shift.operatorName,
        operatorCode: shift.operatorCode,
        totalUnits: 0,
        totalTime: 0,
        totalScrap: 0,
        shiftCount: 0,
        activities: new Set<string>(),
      };
    }
    
    acc[key].totalUnits += shift.unitsProduced;
    acc[key].totalTime += shift.timeSpent;
    acc[key].totalScrap += shift.scrap;
    acc[key].shiftCount += 1;
    acc[key].activities.add(shift.activity);
    
    return acc;
  }, {} as Record<string, any>);

  const topPerformers = Object.values(operatorSummary)
    .map((op: any) => ({
      ...op,
      avgRate: op.totalTime > 0 ? op.totalUnits / op.totalTime : 0,
      qualityRate: op.totalUnits > 0 ? ((op.totalUnits - op.totalScrap) / op.totalUnits) * 100 : 100,
    }))
    .sort((a, b) => b.avgRate - a.avgRate)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topPerformers.map((operator, index) => (
          <Card key={operator.operatorCode} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {index === 0 && <Badge variant="default" className="mr-2 text-xs">Top Performer</Badge>}
                  {operator.operatorName}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {operator.operatorCode}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Units/Hour</div>
                    <div className="font-bold text-lg">{operator.avgRate.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Quality Rate</div>
                    <div className={`font-bold text-lg ${getEfficiencyColor(operator.qualityRate)}`}>
                      {operator.qualityRate.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Total Units:</span>
                    <span className="font-medium ml-1">{operator.totalUnits.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Shifts:</span>
                    <span className="font-medium ml-1">{operator.shiftCount}</span>
                  </div>
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Activities:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Array.from(operator.activities).map((activity: string) => (
                      <Badge key={activity} variant="outline" className="text-xs">
                        {activity}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Detailed Shift Breakdown
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Individual shift performance showing production rates and efficiency by operator
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operator</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">Time (h)</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Target</TableHead>
                  <TableHead className="text-right">Efficiency</TableHead>
                  <TableHead className="text-right">Quality</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((shift, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{shift.operatorName}</div>
                        <div className="text-xs text-muted-foreground">{shift.operatorCode}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(shift.shiftDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {shift.shiftType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {shift.activity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {shift.unitsProduced.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {shift.timeSpent.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {shift.actualRate.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {shift.targetRate.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <div className={`font-medium ${getEfficiencyColor(shift.efficiency)}`}>
                          {shift.efficiency.toFixed(1)}%
                        </div>
                        <Progress value={Math.min(shift.efficiency, 100)} className="h-1.5 w-16" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <div className={`font-medium ${getEfficiencyColor(shift.qualityRate)}`}>
                          {shift.qualityRate.toFixed(1)}%
                        </div>
                        <Badge variant={getEfficiencyBadge(shift.qualityRate).variant} className="text-xs">
                          {shift.qualityRate >= 99 ? "Perfect" : shift.qualityRate >= 95 ? "Good" : "Review"}
                        </Badge>
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
  );
}