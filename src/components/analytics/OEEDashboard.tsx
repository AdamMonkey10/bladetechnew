import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useOEESettings } from '@/hooks/useOEESettings';
import { useOEECalculations } from '@/hooks/useOEECalculations';
import { OEESettingsDialog } from './OEESettingsDialog';
import { Settings, TrendingUp, TrendingDown, Clock, Zap, Target, Loader2 } from 'lucide-react';

interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
}

interface OEEDashboardProps {
  filters?: AnalyticsFilters;
}

export const OEEDashboard = ({ filters }: OEEDashboardProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { 
    targetRates, 
    updateAllRates, 
    resetToDefaults, 
    defaultRates 
  } = useOEESettings();
  
  const { data: oeeData, isLoading, error } = useOEECalculations(targetRates, targetRates, filters);

  const getOEEColor = (oee: number) => {
    if (oee >= 85) return 'text-green-700 bg-green-50 border-green-200';
    if (oee >= 70) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const getOEEBadgeVariant = (oee: number): "default" | "secondary" | "destructive" | "outline" => {
    if (oee >= 85) return 'default';
    if (oee >= 70) return 'secondary';
    return 'destructive';
  };

  const formatMetric = (value: number, suffix: string = '%') => {
    return `${value.toFixed(1)}${suffix}`;
  };

  const formatLargeNumber = (value: number): string => {
    return value.toLocaleString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Overall Equipment Effectiveness (OEE)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Calculating OEE metrics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Overall Equipment Effectiveness (OEE)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Error loading OEE data. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  if (!oeeData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Overall Equipment Effectiveness (OEE)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No production data available for OEE calculation.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Settings */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Overall Equipment Effectiveness (OEE)
          </h2>
          <p className="text-muted-foreground">
            Production efficiency across 24/7 theoretical capacity and actual booked time
          </p>
          {oeeData?.summary.periodDescription && (
            <p className="text-sm text-blue-600 font-medium mt-1">
              <Clock className="h-4 w-4 inline mr-1" />
              Period: {oeeData.summary.periodDescription} ({oeeData.summary.periodHours}h)
            </p>
          )}
        </div>
        <Button variant="outline" onClick={() => setSettingsOpen(true)} className="gap-2">
          <Settings className="h-4 w-4" />
          Configure Rates
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Units</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatLargeNumber(oeeData.summary.totalUnits)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Booked Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{oeeData.summary.totalBookedHours.toFixed(1)}h</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Business Week Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{oeeData.summary.periodHours}h</div>
          </CardContent>
        </Card>
      </div>

      {/* SKU and Process Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Units Produced by SKU & Process</CardTitle>
          <p className="text-sm text-muted-foreground">
            Breakdown of {formatLargeNumber(oeeData.summary.totalUnits)} total units by product and manufacturing process
          </p>
        </CardHeader>
        <CardContent>
          {oeeData.skuProcessBreakdown.length > 0 ? (
            <div className="space-y-4">
              {oeeData.skuProcessBreakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono text-xs">
                      {item.sku}
                    </Badge>
                    <span className="font-medium">{item.process}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-lg">{formatLargeNumber(item.units)}</div>
                      <div className="text-xs text-muted-foreground">units</div>
                    </div>
                    {item.timeSpent > 0 && (
                      <div className="text-right">
                        <div className="font-medium">{item.timeSpent.toFixed(1)}h</div>
                        <div className="text-xs text-muted-foreground">time</div>
                      </div>
                    )}
                    {item.scrap > 0 && (
                      <div className="text-right">
                        <div className="font-medium text-red-600">{formatLargeNumber(item.scrap)}</div>
                        <div className="text-xs text-muted-foreground">scrap</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No production data available for breakdown</p>
          )}
        </CardContent>
      </Card>

      {/* Activity-Specific OEE */}
      <Card>
        <CardHeader>
          <CardTitle>Activity-Specific OEE Breakdown</CardTitle>
          <p className="text-sm text-muted-foreground">
            OEE metrics for individual production activities with separate target rates
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {oeeData.activityOEE.map((activity) => (
              <Card key={activity.activityType} className="relative">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{activity.activityType}</CardTitle>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        Ran: {activity.timeSpent.toFixed(1)}h / {oeeData.summary.periodHours}h
                      </Badge>
                      <Badge variant="outline" className={activity.oee24_7.availability < 50 ? "border-amber-500 text-amber-600" : ""}>
                        {formatMetric(activity.oee24_7.availability)} availability
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        Target: {formatLargeNumber(activity.target247Rate * (oeeData.summary.periodHours || 168))} units
                      </Badge>
                      <Badge variant="outline">
                        Actual: {formatLargeNumber(activity.actualUnits)} units
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* 24/7 OEE */}
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {formatMetric(activity.oee24_7.oee)}
                      </div>
                      <Badge variant={getOEEBadgeVariant(activity.oee24_7.oee)}>
                        {activity.actualRate > activity.target247Rate ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        24/7 OEE
                      </Badge>
                    </div>
                    
                    {/* Booked Time OEE */}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">
                        {formatMetric(activity.oeeBookedTime.performance)}
                      </div>
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Booked OEE
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs bg-muted/30 px-2 py-1 rounded">
                      <span className="font-medium">OEE Formula:</span>
                      <span>A × P × Q</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Availability (A):</span>
                      <span className={activity.oee24_7.availability < 50 ? "text-amber-600 font-medium" : ""}>{formatMetric(activity.oee24_7.availability)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Performance (P):</span>
                      <span>{formatMetric(activity.oee24_7.performance)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Quality (Q):</span>
                      <span>{formatMetric(activity.oee24_7.quality)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <OEESettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        targetRates={targetRates}
        defaultRates={defaultRates}
        onUpdateAllRates={updateAllRates}
        onResetToDefaults={resetToDefaults}
      />
    </div>
  );
};
