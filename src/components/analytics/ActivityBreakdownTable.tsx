import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, TrendingUp, TrendingDown, Award, Star } from 'lucide-react';
import { ACTIVITY_TYPES } from '@/components/forms/shift-form-types';

interface ActivityData {
  totalUnits: number;
  totalTime: number;
  totalScrap: number;
  efficiency: number;
  scrapRate: number;
  shifts: number;
}

interface OperatorPerformance {
  operatorName: string;
  operatorCode: string;
  activities: Record<string, ActivityData>;
  laserActivities: ActivityData;
  nonLaserActivities: ActivityData;
  totalShifts: number;
  overallEfficiency: number;
  overallScrapRate: number;
  hoursBooked: number;
  hoursWorked: number;
  attendanceRate: number;
}

interface ActivityBreakdownTableProps {
  operators: OperatorPerformance[];
  trends?: Record<string, {
    currentPeriod: number;
    previousPeriod: number;
    trend: 'up' | 'down' | 'stable';
    percentageChange: number;
  }>;
}

const MINIMUM_SHIFTS = 10; // Minimum shifts required to be included in rankings
const MINIMUM_UNITS = 1000; // Minimum units produced required to be included in rankings

export function ActivityBreakdownTable({ operators, trends = {} }: ActivityBreakdownTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Get all activity types from ACTIVITY_TYPES, with Laser activities first
  const allActivities = ACTIVITY_TYPES
    .filter(activity => activity !== 'OperatorActivity')
    .sort((a, b) => {
      // Put Laser activities first
      const aIsLaser = a.toLowerCase().includes('laser');
      const bIsLaser = b.toLowerCase().includes('laser');
      
      if (aIsLaser && !bIsLaser) return -1;
      if (!aIsLaser && bIsLaser) return 1;
      
      // For non-laser activities or if both are laser, sort alphabetically
      return a.localeCompare(b);
    });

  // Group operators by activity and rank within each activity
  const getOperatorsByActivity = (activityType: string) => {
    const operatorsForActivity = operators
      .filter(op => op.activities[activityType])
      .map(op => ({
        ...op,
        activityData: op.activities[activityType]
      }))
      .filter(op => {
        // Apply minimum shifts filter
        if (op.activityData.shifts < MINIMUM_SHIFTS) {
          return false;
        }
        
        // Apply minimum units filter
        if (op.activityData.totalUnits < MINIMUM_UNITS) {
          return false;
        }

        // Additional safety check: must have both units AND time spent on this activity
        if (op.activityData.totalUnits === 0 && op.activityData.totalTime === 0) {
          return false;
        }
        
        // Then apply search filter if there's a search term
        if (searchTerm.trim() === '') {
          return true; // Show all operators that meet minimum requirements when no search term
        }
        
        const matchesSearch = op.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             op.operatorCode.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesSearch;
      })
      .sort((a, b) => b.activityData.efficiency - a.activityData.efficiency);
    
    return operatorsForActivity;
  };

  const getTrendIcon = (activityType: string) => {
    const trend = trends[activityType];
    if (!trend) return null;
    
    const iconClass = "h-4 w-4";
    if (trend.trend === 'up') {
      return <TrendingUp className={`${iconClass} text-green-600`} />;
    } else if (trend.trend === 'down') {
      return <TrendingDown className={`${iconClass} text-red-600`} />;
    }
    return null;
  };

  const getTrendText = (activityType: string) => {
    const trend = trends[activityType];
    if (!trend || trend.trend === 'stable') return null;
    
    const direction = trend.trend === 'up' ? 'up' : 'down';
    const color = trend.trend === 'up' ? 'text-green-600' : 'text-red-600';
    
    return (
      <span className={`text-sm ${color} font-medium`}>
        {Math.abs(trend.percentageChange).toFixed(1)}% {direction} from previous period
      </span>
    );
  };

  const getActivityRank = (operator: any, activityOperators: any[]) => {
    return activityOperators.findIndex(op => op.operatorCode === operator.operatorCode) + 1;
  };

  const getPerformanceColor = (rank: number, total: number) => {
    const percentage = rank / total;
    if (percentage <= 0.2) return "border-l-4 border-l-green-500 bg-green-50/50";
    if (percentage <= 0.4) return "border-l-4 border-l-blue-500 bg-blue-50/50";
    if (percentage <= 0.6) return "border-l-4 border-l-yellow-500 bg-yellow-50/50";
    if (percentage <= 0.8) return "border-l-4 border-l-orange-500 bg-orange-50/50";
    return "border-l-4 border-l-red-500 bg-red-50/50";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Award className="h-5 w-5 text-yellow-500" />;
    if (rank <= 3) return <Star className="h-5 w-5 text-blue-500" />;
    return null;
  };

  const getRankDisplay = (rank: number) => {
    const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
    return ordinals[rank - 1] || `${rank}th`;
  };

  const getPerformanceBadge = (efficiency: number, scrapRate: number, activityOperators: any[]) => {
    // Find the top performer's efficiency for this activity
    const topEfficiency = Math.max(...activityOperators.map(op => op.activityData.efficiency));
    const avgScrapRate = activityOperators.reduce((sum, op) => sum + op.activityData.scrapRate, 0) / activityOperators.length;
    
    // Calculate performance relative to top performer
    const efficiencyRatio = efficiency / topEfficiency;
    
    // Performance analysis without debug logging
    
    // Rating based on efficiency relative to top performer and scrap rate relative to average
    if (efficiencyRatio >= 0.9 && scrapRate <= avgScrapRate) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Excellent</Badge>;
    } else if (efficiencyRatio >= 0.8 && scrapRate <= avgScrapRate * 1.2) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Good</Badge>;
    } else if (efficiencyRatio >= 0.7 && scrapRate <= avgScrapRate * 1.5) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Average</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Needs Improvement</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Operator Performance by Activity</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search operators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
      </Card>

      {allActivities.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No activity data available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Combined Laser Performance Section */}
          {operators.some(op => op.laserActivities.totalUnits > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Combined Laser Performance Rankings</CardTitle>
                <p className="text-muted-foreground">
                  All laser activities combined (Laser1, Laser2, Laser3, etc.)
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {operators
                    .filter(op => op.laserActivities.totalUnits >= MINIMUM_UNITS && op.laserActivities.shifts >= MINIMUM_SHIFTS)
                    .filter(op => {
                      if (searchTerm.trim() === '') return true;
                      return op.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             op.operatorCode.toLowerCase().includes(searchTerm.toLowerCase());
                    })
                    .sort((a, b) => b.laserActivities.efficiency - a.laserActivities.efficiency)
                    .map((operator, index) => {
                      const rank = index + 1;
                      const colorClass = getPerformanceColor(rank, operators.length);
                      
                      return (
                        <Card key={`laser-${operator.operatorCode}`} className={`${colorClass} animate-fade-in hover-scale`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  {getRankIcon(rank)}
                                  {operator.operatorName}
                                  <Badge variant="outline" className="ml-2">{getRankDisplay(rank)}</Badge>
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">{operator.operatorCode}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-primary">
                                  {operator.laserActivities.efficiency.toFixed(1)} u/h
                                </div>
                                <div className="text-sm text-muted-foreground">Combined Laser Efficiency</div>
                              </div>
                            </div>
                          </CardHeader>
                          
                           <CardContent className="space-y-4">
                             <div className="grid grid-cols-2 gap-4 text-sm">
                               <div>
                                 <span className="text-muted-foreground">Laser Shifts:</span>
                                 <span className="font-medium ml-2">{operator.laserActivities.shifts}</span>
                               </div>
                               <div>
                                 <span className="text-muted-foreground">Scrap Rate:</span>
                                 <span className={`font-medium ml-2 ${operator.laserActivities.scrapRate > 5 ? 'text-red-600' : 'text-green-600'}`}>
                                   {operator.laserActivities.scrapRate.toFixed(1)}%
                                 </span>
                               </div>
                               <div>
                                 <span className="text-muted-foreground">Hours Booked:</span>
                                 <span className="font-medium ml-2">{operator.hoursBooked.toFixed(1)}h</span>
                               </div>
                               <div>
                                 <span className="text-muted-foreground">Hours Worked:</span>
                                 <span className={`font-medium ml-2 ${operator.attendanceRate < 80 ? 'text-red-600' : operator.attendanceRate > 95 ? 'text-green-600' : 'text-yellow-600'}`}>
                                   {operator.hoursWorked.toFixed(1)}h ({operator.attendanceRate.toFixed(1)}%)
                                 </span>
                               </div>
                             </div>

                            <div className="bg-background/50 rounded-lg p-3 border">
                              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                <div>
                                  <div>Total Units: {operator.laserActivities.totalUnits.toLocaleString()}</div>
                                  <div>Total Time: {operator.laserActivities.totalTime.toFixed(1)}h</div>
                                </div>
                                <div>
                                  <div>Avg per Shift: {(operator.laserActivities.totalUnits / operator.laserActivities.shifts).toFixed(0)}</div>
                                  <div>Total Scrap: {operator.laserActivities.totalScrap}</div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Non-Laser Performance Section */}
          {operators.some(op => op.nonLaserActivities.totalUnits > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Non-Laser Performance Rankings</CardTitle>
                <p className="text-muted-foreground">
                  All non-laser activities combined (Welder, Coating, etc.)
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {operators
                    .filter(op => op.nonLaserActivities.totalUnits >= MINIMUM_UNITS && op.nonLaserActivities.shifts >= MINIMUM_SHIFTS)
                    .filter(op => {
                      if (searchTerm.trim() === '') return true;
                      return op.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             op.operatorCode.toLowerCase().includes(searchTerm.toLowerCase());
                    })
                    .sort((a, b) => b.nonLaserActivities.efficiency - a.nonLaserActivities.efficiency)
                    .map((operator, index) => {
                      const rank = index + 1;
                      const colorClass = getPerformanceColor(rank, operators.length);
                      
                      return (
                        <Card key={`non-laser-${operator.operatorCode}`} className={`${colorClass} animate-fade-in hover-scale`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  {getRankIcon(rank)}
                                  {operator.operatorName}
                                  <Badge variant="outline" className="ml-2">{getRankDisplay(rank)}</Badge>
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">{operator.operatorCode}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-primary">
                                  {operator.nonLaserActivities.efficiency.toFixed(1)} u/h
                                </div>
                                <div className="text-sm text-muted-foreground">Non-Laser Efficiency</div>
                              </div>
                            </div>
                          </CardHeader>
                          
                           <CardContent className="space-y-4">
                             <div className="grid grid-cols-2 gap-4 text-sm">
                               <div>
                                 <span className="text-muted-foreground">Non-Laser Shifts:</span>
                                 <span className="font-medium ml-2">{operator.nonLaserActivities.shifts}</span>
                               </div>
                               <div>
                                 <span className="text-muted-foreground">Scrap Rate:</span>
                                 <span className={`font-medium ml-2 ${operator.nonLaserActivities.scrapRate > 5 ? 'text-red-600' : 'text-green-600'}`}>
                                   {operator.nonLaserActivities.scrapRate.toFixed(1)}%
                                 </span>
                               </div>
                               <div>
                                 <span className="text-muted-foreground">Hours Booked:</span>
                                 <span className="font-medium ml-2">{operator.hoursBooked.toFixed(1)}h</span>
                               </div>
                               <div>
                                 <span className="text-muted-foreground">Hours Worked:</span>
                                 <span className={`font-medium ml-2 ${operator.attendanceRate < 80 ? 'text-red-600' : operator.attendanceRate > 95 ? 'text-green-600' : 'text-yellow-600'}`}>
                                   {operator.hoursWorked.toFixed(1)}h ({operator.attendanceRate.toFixed(1)}%)
                                 </span>
                               </div>
                             </div>

                            <div className="bg-background/50 rounded-lg p-3 border">
                              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                <div>
                                  <div>Total Units: {operator.nonLaserActivities.totalUnits.toLocaleString()}</div>
                                  <div>Total Time: {operator.nonLaserActivities.totalTime.toFixed(1)}h</div>
                                </div>
                                <div>
                                  <div>Avg per Shift: {operator.nonLaserActivities.shifts > 0 ? (operator.nonLaserActivities.totalUnits / operator.nonLaserActivities.shifts).toFixed(0) : '0'}</div>
                                  <div>Total Scrap: {operator.nonLaserActivities.totalScrap}</div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Individual Activities Section */}
          {allActivities.map((activity) => {
            const activityOperators = getOperatorsByActivity(activity);
            
            // Show all activities, even if no operators have data
            if (activityOperators.length === 0) {
              return (
                <Card key={activity}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          {activity} Performance Rankings
                          {getTrendIcon(activity)}
                        </CardTitle>
                        <p className="text-muted-foreground">
                          No operators have logged work for this activity yet
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-lg p-8 text-center">
                      <p className="text-muted-foreground">
                        No data available for {activity}. Operators will appear here once they start logging work for this activity.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card key={activity}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        {activity} Performance Rankings
                        {getTrendIcon(activity)}
                      </CardTitle>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">
                          {activityOperators.length} qualified operator{activityOperators.length !== 1 ? 's' : ''} (minimum {MINIMUM_SHIFTS} shifts & {MINIMUM_UNITS.toLocaleString()} units)
                        </p>
                        {getTrendText(activity)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {activityOperators.map((operator) => {
                      const rank = getActivityRank(operator, activityOperators);
                      const colorClass = getPerformanceColor(rank, activityOperators.length);
                      
                      return (
                        <Card key={operator.operatorCode} className={`${colorClass} animate-fade-in hover-scale`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  {getRankIcon(rank)}
                                  {operator.operatorName}
                                  <Badge variant="outline" className="ml-2">{getRankDisplay(rank)}</Badge>
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">{operator.operatorCode}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-primary">
                                  {operator.activityData.efficiency.toFixed(1)} u/h
                                </div>
                                <div className="text-sm text-muted-foreground">{activity} Efficiency</div>
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Shifts:</span>
                                <span className="font-medium ml-2">{operator.activityData.shifts}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Scrap Rate:</span>
                                <span className={`font-medium ml-2 ${operator.activityData.scrapRate > 5 ? 'text-red-600' : 'text-green-600'}`}>
                                  {operator.activityData.scrapRate.toFixed(1)}%
                                </span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Performance Rating</span>
                              {getPerformanceBadge(operator.activityData.efficiency, operator.activityData.scrapRate, activityOperators)}
                            </div>

                            <div className="bg-background/50 rounded-lg p-3 border">
                              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                                <div>
                                  <div>Units: {operator.activityData.totalUnits.toLocaleString()}</div>
                                  <div>Time: {operator.activityData.totalTime.toFixed(1)}h</div>
                                </div>
                                <div>
                                  <div>Avg per Shift: {(operator.activityData.totalUnits / operator.activityData.shifts).toFixed(0)}</div>
                                  <div>Total Scrap: {operator.activityData.totalScrap}</div>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center gap-1 justify-end">
                                    {operator.activityData.efficiency > 10 ? 
                                      <TrendingUp className="h-3 w-3 text-green-600" /> : 
                                      <TrendingDown className="h-3 w-3 text-red-600" />
                                    }
                                    <span className="font-medium">
                                      {operator.activityData.efficiency > 10 ? 'Above Avg' : 'Below Avg'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}