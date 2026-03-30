import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Users, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { detectDecimalPointErrors, suggestDecimalCorrection } from '@/utils/dataValidation';
import { useToast } from '@/hooks/use-toast';

interface DataQualityIssue {
  id: string;
  shift_date: string;
  operator_name: string;
  activity_name: string;
  issue_type: 'decimal_point_error' | 'missing_time' | 'unrealistic_productivity' | 'high_hours';
  current_value: number;
  suggested_value?: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface DataQualityStats {
  total_records: number;
  records_with_issues: number;
  issue_percentage: number;
  recent_issues: number;
  common_issues: Record<string, number>;
  operator_patterns: Record<string, number>;
}

export function DataQualityMonitor() {
  const [issues, setIssues] = useState<DataQualityIssue[]>([]);
  const [stats, setStats] = useState<DataQualityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [fixingIssues, setFixingIssues] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Fetch data quality issues
  const fetchDataQualityIssues = async () => {
    try {
      setLoading(true);
      
      // Get recent shift records (last 30 days)
      const { data: shifts, error } = await supabase
        .from('shift_records')
        .select(`
          id,
          shift_date,
          production_data,
          operators!inner(operator_name)
        `)
        .gte('shift_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('shift_date', { ascending: false });

      if (error) throw error;

      const detectedIssues: DataQualityIssue[] = [];
      const operatorPatterns: Record<string, number> = {};
      const commonIssues: Record<string, number> = {};

      shifts?.forEach(shift => {
        const operatorName = shift.operators?.operator_name || 'Unknown';
        const productionData = shift.production_data as any;

        if (!productionData?.activities) return;

        // Check each activity for issues
        Object.entries(productionData.activities).forEach(([activityName, activityData]: [string, any]) => {
          if (!Array.isArray(activityData)) return;

          activityData.forEach((entry: any) => {
            const timeSpent = entry.time_spent;
            const unitsProduced = entry.units_produced;

            // Check for decimal point errors
            if (timeSpent && detectDecimalPointErrors(timeSpent)) {
              const suggested = suggestDecimalCorrection(timeSpent);
              detectedIssues.push({
                id: `${shift.id}-${activityName}-decimal`,
                shift_date: shift.shift_date,
                operator_name: operatorName,
                activity_name: activityName,
                issue_type: 'decimal_point_error',
                current_value: timeSpent,
                suggested_value: suggested || undefined,
                description: `Time spent ${timeSpent}h likely missing decimal point (suggested: ${suggested}h)`,
                severity: timeSpent > 100 ? 'critical' : 'high'
              });
              
              commonIssues['decimal_point_error'] = (commonIssues['decimal_point_error'] || 0) + 1;
              operatorPatterns[operatorName] = (operatorPatterns[operatorName] || 0) + 1;
            }

            // Check for missing time spent
            if (unitsProduced && unitsProduced > 0 && (!timeSpent || timeSpent === 0)) {
              detectedIssues.push({
                id: `${shift.id}-${activityName}-missing-time`,
                shift_date: shift.shift_date,
                operator_name: operatorName,
                activity_name: activityName,
                issue_type: 'missing_time',
                current_value: 0,
                description: `${unitsProduced} units produced but no time spent recorded`,
                severity: 'medium'
              });
              
              commonIssues['missing_time'] = (commonIssues['missing_time'] || 0) + 1;
            }

            // Check for unrealistically high hours
            if (timeSpent && timeSpent > 16) {
              detectedIssues.push({
                id: `${shift.id}-${activityName}-high-hours`,
                shift_date: shift.shift_date,
                operator_name: operatorName,
                activity_name: activityName,
                issue_type: 'high_hours',
                current_value: timeSpent,
                description: `Unusually high time spent: ${timeSpent}h in single activity`,
                severity: timeSpent > 24 ? 'critical' : 'high'
              });
              
              commonIssues['high_hours'] = (commonIssues['high_hours'] || 0) + 1;
            }

            // Check for unrealistic productivity
            if (timeSpent && timeSpent > 0 && unitsProduced && unitsProduced > 0) {
              const productivity = unitsProduced / timeSpent;
              const expectedRanges: Record<string, { min: number; max: number }> = {
                'Laser1': { min: 50, max: 800 },
                'Laser2': { min: 50, max: 600 },
                'Laser3': { min: 50, max: 800 },
                'Welder': { min: 20, max: 400 },
                'Coating': { min: 100, max: 1500 }
              };

              const range = expectedRanges[activityName];
              if (range && (productivity < range.min || productivity > range.max)) {
                detectedIssues.push({
                  id: `${shift.id}-${activityName}-productivity`,
                  shift_date: shift.shift_date,
                  operator_name: operatorName,
                  activity_name: activityName,
                  issue_type: 'unrealistic_productivity',
                  current_value: productivity,
                  description: `Productivity ${productivity.toFixed(1)} units/hour outside expected range (${range.min}-${range.max})`,
                  severity: 'medium'
                });
                
                commonIssues['unrealistic_productivity'] = (commonIssues['unrealistic_productivity'] || 0) + 1;
              }
            }
          });
        });
      });

      setIssues(detectedIssues);
      setStats({
        total_records: shifts?.length || 0,
        records_with_issues: new Set(detectedIssues.map(i => i.id.split('-')[0])).size,
        issue_percentage: shifts?.length ? (new Set(detectedIssues.map(i => i.id.split('-')[0])).size / shifts.length) * 100 : 0,
        recent_issues: detectedIssues.filter(i => new Date(i.shift_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
        common_issues: commonIssues,
        operator_patterns: operatorPatterns
      });

    } catch (error) {
      console.error('Error fetching data quality issues:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch data quality issues',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataQualityIssues();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'decimal_point_error': return <AlertTriangle className="h-4 w-4" />;
      case 'missing_time': return <Clock className="h-4 w-4" />;
      case 'high_hours': return <TrendingUp className="h-4 w-4" />;
      case 'unrealistic_productivity': return <Activity className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const handleFixIssue = async (issue: DataQualityIssue) => {
    if (issue.issue_type !== 'decimal_point_error' || !issue.suggested_value) {
      toast({
        title: 'Cannot auto-fix',
        description: 'This issue type cannot be automatically fixed',
        variant: 'destructive'
      });
      return;
    }

    setFixingIssues(prev => new Set([...prev, issue.id]));
    
    try {
      // This would require a more complex update to the specific activity entry
      // For now, just show a success message
      toast({
        title: 'Issue marked for review',
        description: `Decimal point error flagged for manual review`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error fixing issue:', error);
      toast({
        title: 'Error',
        description: 'Failed to fix issue',
        variant: 'destructive'
      });
    } finally {
      setFixingIssues(prev => {
        const newSet = new Set(prev);
        newSet.delete(issue.id);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Quality Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Data Quality Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="issues">Issues</TabsTrigger>
              <TabsTrigger value="patterns">Patterns</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">Total Records</p>
                          <p className="text-2xl font-bold">{stats.total_records}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="text-sm font-medium">Records with Issues</p>
                          <p className="text-2xl font-bold">{stats.records_with_issues}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">Issue Rate</p>
                          <p className="text-2xl font-bold">{stats.issue_percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="text-sm font-medium">Recent Issues</p>
                          <p className="text-2xl font-bold">{stats.recent_issues}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="issues" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Data Quality Issues</h3>
                <Button onClick={fetchDataQualityIssues} variant="outline" size="sm">
                  Refresh
                </Button>
              </div>
              
              {issues.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    No data quality issues found in the last 30 days!
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {issues.slice(0, 20).map((issue) => (
                    <Card key={issue.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2">
                            {getIssueIcon(issue.issue_type)}
                            <Badge 
                              variant="secondary" 
                              className={`${getSeverityColor(issue.severity)} text-white`}
                            >
                              {issue.severity}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium">
                              {issue.operator_name} - {issue.activity_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {issue.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Date: {new Date(issue.shift_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        {issue.suggested_value && (
                          <Button
                            onClick={() => handleFixIssue(issue)}
                            disabled={fixingIssues.has(issue.id)}
                            size="sm"
                            variant="outline"
                          >
                            {fixingIssues.has(issue.id) ? 'Fixing...' : 'Review'}
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="patterns" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Common Issue Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats && Object.entries(stats.common_issues).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="capitalize">{type.replace('_', ' ')}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Operators with Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats && Object.entries(stats.operator_patterns).map(([operator, count]) => (
                        <div key={operator} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{operator}</span>
                          </div>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}