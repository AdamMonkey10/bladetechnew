import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ShiftRecord {
  id: string;
  shift_date: string;
  shift_type: string;
  production_data: any;
  operators?: {
    operator_name: string;
    operator_code: string;
  };
  operator_id: string;
}

interface ActivityData {
  totalUnits: number;
  totalTime: number;
  totalScrap: number;
  efficiency: number; // units per hour
  scrapRate: number; // percentage
  shifts: number;
}

interface MachinePerformance {
  machineName: string;
  totalUnits: number;
  totalTime: number;
  efficiency: number;
  operators: number;
  shifts: number;
}

interface OperatorPerformance {
  operatorName: string;
  operatorCode: string;
  activities: Record<string, ActivityData>;
  laserActivities: ActivityData; // Combined laser performance
  totalShifts: number;
  overallEfficiency: number;
  overallScrapRate: number;
  hoursBooked: number; // From production_data
  hoursWorked: number; // From production_data
  allTimePerformance?: {
    avgEfficiency: number;
    totalShifts: number;
    totalUnits: number;
  };
  performanceIndicator: 'above_average' | 'below_average' | 'average';
}

interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
}

export const useAnalytics = (filters?: AnalyticsFilters) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['analytics', filters],
    queryFn: async (): Promise<{
      operatorPerformance: OperatorPerformance[];
      machinePerformance: MachinePerformance[];
      activitySummary: Record<string, {
        totalUnits: number;
        totalTime: number;
        totalScrap: number;
        avgEfficiency: number;
        avgScrapRate: number;
      }>;
      overallStats: {
        totalShifts: number;
        totalUnits: number;
        totalScrap: number;
        avgEfficiency: number;
        avgScrapRate: number;
        laserStats?: {
          avgEfficiency: number;
          totalUnits: number;
          operators: number;
        };
      };
      trends: Record<string, {
        currentPeriod: number;
        previousPeriod: number;
        trend: 'up' | 'down' | 'stable';
        percentageChange: number;
      }>;
    }> => {
      try {
        // Fetch all operators first
        const { data: allOperators, error: operatorsError } = await supabase
          .from('operators')
          .select('*')
          .eq('active', true)
          .order('operator_name');

        if (operatorsError) throw operatorsError;

        // Fetch all-time data for comparison (no date filters)
        const { data: allTimeData, error: allTimeError } = await supabase
          .from('shift_records')
          .select(`
            *,
            operators (operator_name, operator_code)
          `)
          .gte('shift_date', '2025-07-07')
          .order('shift_date', { ascending: false });

        if (allTimeError) throw allTimeError;

        // Start with base query for timesheet data
        let query = supabase
          .from('shift_records')
          .select(`
            *,
            operators (operator_name, operator_code)
          `)
          .order('shift_date', { ascending: false });

        // Apply filters - if filters are provided, use them; otherwise default to July 7th onwards
        if (filters?.startDate) {
          query = query.gte('shift_date', filters.startDate);
        } else {
          query = query.gte('shift_date', '2025-07-07');
        }
        
        if (filters?.endDate) {
          query = query.lte('shift_date', filters.endDate);
        }

        const { data: shiftData, error } = await query;
        
        if (error) throw error;

        // Process timesheet data - no corrections, just raw reporting
        const currentPeriodData = shiftData as any[];

        const processData = (records: any[]) => {
          const operatorMap = new Map<string, OperatorPerformance>();
          const activityMap = new Map<string, { totalUnits: number; totalTime: number; totalScrap: number; count: number }>();
          const machineMap = new Map<string, MachinePerformance>();

          records.forEach(record => {
            // Handle both old and new production_data structures
            if (!record.production_data?.activities) return;

            const operatorName = record.operators?.operator_name || 'Unknown';
            const operatorCode = record.operators?.operator_code || 'UNK';
            
            if (!operatorMap.has(operatorName)) {
              operatorMap.set(operatorName, {
                operatorName,
                operatorCode,
                activities: {},
                laserActivities: {
                  totalUnits: 0,
                  totalTime: 0,
                  totalScrap: 0,
                  efficiency: 0,
                  scrapRate: 0,
                  shifts: 0,
                },
                totalShifts: 0,
                overallEfficiency: 0,
                overallScrapRate: 0,
                hoursBooked: 0,
                hoursWorked: 0,
                performanceIndicator: 'average', // Will be calculated later
              });
            }

            const operator = operatorMap.get(operatorName)!;
            operator.totalShifts++;
            
            // Accumulate hours from this timesheet
            operator.hoursBooked += Number(record.production_data.hours_booked) || 0;
            operator.hoursWorked += Number(record.production_data.hours_worked) || 0;

            // Check if activities is old format (array) or new format (object)
            const isOldFormat = Array.isArray(record.production_data.activities);
            
            if (isOldFormat) {
              // Process old format: activities is array with name and entries
              record.production_data.activities.forEach((activityGroup: any) => {
                const activityType = activityGroup.name;
                const entries = activityGroup.entries || [];
                
                console.log(`Processing old format for ${operatorName} - ${activityType}:`, entries);
                if (!activityType || !Array.isArray(entries)) return;

                // Initialize machine tracking
                if (!machineMap.has(activityType)) {
                  machineMap.set(activityType, {
                    machineName: activityType,
                    totalUnits: 0,
                    totalTime: 0,
                    efficiency: 0,
                    operators: 0,
                    shifts: 0,
                  });
                }

                // Initialize activity for operator if not exists
                if (!operator.activities[activityType]) {
                  operator.activities[activityType] = {
                    totalUnits: 0,
                    totalTime: 0,
                    totalScrap: 0,
                    efficiency: 0,
                    scrapRate: 0,
                    shifts: 0,
                  };
                }

                // Initialize activity summary if not exists
                if (!activityMap.has(activityType)) {
                  activityMap.set(activityType, { totalUnits: 0, totalTime: 0, totalScrap: 0, count: 0 });
                }

                const operatorActivity = operator.activities[activityType];
                const activitySummary = activityMap.get(activityType)!;
                const machinePerf = machineMap.get(activityType)!;

                // Sum up all entries - old format uses units_produced, time_spent, scrap
                let hasActualWork = false;
                entries.forEach((entry: any) => {
                  const units = Number(entry.units_produced) || 0;
                  const time = Number(entry.time_spent) || 0;
                  const scrap = Number(entry.scrap) || 0;
                  
                  console.log(`Entry for ${operatorName} ${activityType}:`, { units, time, scrap });

                  operatorActivity.totalUnits += units;
                  operatorActivity.totalTime += time;
                  operatorActivity.totalScrap += scrap;

                  activitySummary.totalUnits += units;
                  activitySummary.totalTime += time;
                  activitySummary.totalScrap += scrap;

                  machinePerf.totalUnits += units;
                  machinePerf.totalTime += time;

                  if (units > 0 || time > 0) {
                    hasActualWork = true;
                  }
                });
                
                if (hasActualWork) {
                  operatorActivity.shifts++;
                  machinePerf.shifts++;
                }
                
                activitySummary.count++;
              });
            } else {
              // Process new format: activities is object with activity types as keys
              Object.keys(record.production_data.activities).forEach((activityType: string) => {
                const entries = record.production_data.activities[activityType];
                
                if (!activityType || !Array.isArray(entries)) return;

                // Initialize machine tracking
                if (!machineMap.has(activityType)) {
                  machineMap.set(activityType, {
                    machineName: activityType,
                    totalUnits: 0,
                    totalTime: 0,
                    efficiency: 0,
                    operators: 0,
                    shifts: 0,
                  });
                }

                // Initialize activity for operator if not exists
                if (!operator.activities[activityType]) {
                  operator.activities[activityType] = {
                    totalUnits: 0,
                    totalTime: 0,
                    totalScrap: 0,
                    efficiency: 0,
                    scrapRate: 0,
                    shifts: 0,
                  };
                }

                // Initialize activity summary if not exists
                if (!activityMap.has(activityType)) {
                  activityMap.set(activityType, { totalUnits: 0, totalTime: 0, totalScrap: 0, count: 0 });
                }

                const operatorActivity = operator.activities[activityType];
                const activitySummary = activityMap.get(activityType)!;
                const machinePerf = machineMap.get(activityType)!;

                // Sum up all entries - new format can use either UnitsProduced/TimeSpent/Scrap or units_produced/time_spent/scrap
                let hasActualWork = false;
                entries.forEach((entry: any) => {
                  const units = Number(entry.UnitsProduced) || Number(entry.units_produced) || 0;
                  const time = Number(entry.TimeSpent) || Number(entry.time_spent) || 0;
                  const scrap = Number(entry.Scrap) || Number(entry.scrap) || 0;

                  operatorActivity.totalUnits += units;
                  operatorActivity.totalTime += time;
                  operatorActivity.totalScrap += scrap;

                  activitySummary.totalUnits += units;
                  activitySummary.totalTime += time;
                  activitySummary.totalScrap += scrap;

                  machinePerf.totalUnits += units;
                  machinePerf.totalTime += time;

                  if (units > 0 || time > 0) {
                    hasActualWork = true;
                  }
                });
                
                if (hasActualWork) {
                  operatorActivity.shifts++;
                  machinePerf.shifts++;
                }
                
                activitySummary.count++;
              });
            }
          });

          return { operatorMap, activityMap, machineMap };
        };

        // Process all-time data for comparison
        const allTimeProcessed = processData(allTimeData as any[]);
        
        // Calculate all-time averages
        const allTimeOperatorPerformance = new Map<string, { avgEfficiency: number; totalShifts: number; totalUnits: number; }>();
        Array.from(allTimeProcessed.operatorMap.values()).forEach(operator => {
          let totalUnits = 0;
          let totalTime = 0;
          
          Object.values(operator.activities).forEach(activity => {
            totalUnits += activity.totalUnits;
            totalTime += activity.totalTime;
          });
          
          const avgEfficiency = totalTime > 0 ? totalUnits / totalTime : 0;
          allTimeOperatorPerformance.set(operator.operatorName, {
            avgEfficiency,
            totalShifts: operator.totalShifts,
            totalUnits,
          });
        });

        // Calculate overall average efficiency for comparison
        const allTimeOverallEfficiency = Array.from(allTimeOperatorPerformance.values())
          .reduce((sum, perf) => sum + perf.avgEfficiency, 0) / allTimeOperatorPerformance.size || 0;

        // Process current period data
        const currentProcessed = processData(currentPeriodData);

        // Create performance objects for ALL operators (including those without data)
        const allOperatorPerformance: OperatorPerformance[] = allOperators.map(operator => {
          // Check if this operator has data in current period
          const existingOperator = currentProcessed.operatorMap.get(operator.operator_name);
          
          if (existingOperator) {
            // Use existing data for operators with current period activity
            let totalUnits = 0;
            let totalTime = 0;
            let totalScrap = 0;

            // Reset laser activities
            existingOperator.laserActivities = {
              totalUnits: 0,
              totalTime: 0,
              totalScrap: 0,
              efficiency: 0,
              scrapRate: 0,
              shifts: 0,
            };

            // Calculate metrics for each activity separately - NO MIXING
            Object.keys(existingOperator.activities).forEach(activityType => {
              const activity = existingOperator.activities[activityType];
              // Calculate individual process efficiency - each activity gets its own rate
              activity.efficiency = activity.totalTime > 0 ? activity.totalUnits / activity.totalTime : 0;
              activity.scrapRate = activity.totalUnits > 0 ? (activity.totalScrap / activity.totalUnits) * 100 : 0;
              
              // Accumulate totals for overall metrics only
              totalUnits += activity.totalUnits;
              totalTime += activity.totalTime;
              totalScrap += activity.totalScrap;
              
              // Group ONLY laser activities for laser-specific rate
              if (activityType.toLowerCase().includes('laser')) {
                existingOperator.laserActivities.totalUnits += activity.totalUnits;
                existingOperator.laserActivities.totalTime += activity.totalTime;
                existingOperator.laserActivities.totalScrap += activity.totalScrap;
                if (activity.shifts > 0) existingOperator.laserActivities.shifts++;
              }
            });

            // Calculate laser efficiency from RAW DATA
            existingOperator.laserActivities.efficiency = existingOperator.laserActivities.totalTime > 0 
              ? existingOperator.laserActivities.totalUnits / existingOperator.laserActivities.totalTime : 0;
            existingOperator.laserActivities.scrapRate = existingOperator.laserActivities.totalUnits > 0 
              ? (existingOperator.laserActivities.totalScrap / existingOperator.laserActivities.totalUnits) * 100 : 0;

            existingOperator.overallEfficiency = totalTime > 0 ? totalUnits / totalTime : 0;
            existingOperator.overallScrapRate = totalUnits > 0 ? (totalScrap / totalUnits) * 100 : 0;

            // Add all-time performance data
            const allTimePerf = allTimeOperatorPerformance.get(existingOperator.operatorName);
            if (allTimePerf) {
              existingOperator.allTimePerformance = allTimePerf;
            }

            // Determine performance indicator
            const currentEfficiency = existingOperator.laserActivities.efficiency || existingOperator.overallEfficiency;
            if (allTimeOverallEfficiency > 0) {
              if (currentEfficiency > allTimeOverallEfficiency * 1.1) {
                existingOperator.performanceIndicator = 'above_average';
              } else if (currentEfficiency < allTimeOverallEfficiency * 0.9) {
                existingOperator.performanceIndicator = 'below_average';
              } else {
                existingOperator.performanceIndicator = 'average';
              }
            } else {
              existingOperator.performanceIndicator = 'average';
            }

            return existingOperator;
          } else {
            // Create empty performance object for operators without current data
            const emptyOperator: OperatorPerformance = {
              operatorName: operator.operator_name,
              operatorCode: operator.operator_code,
              activities: {},
              laserActivities: {
                totalUnits: 0,
                totalTime: 0,
                totalScrap: 0,
                efficiency: 0,
                scrapRate: 0,
                shifts: 0,
              },
              totalShifts: 0,
              overallEfficiency: 0,
              overallScrapRate: 0,
              hoursBooked: 0,
              hoursWorked: 0,
              performanceIndicator: 'average',
            };

            // Add all-time performance data if available
            const allTimePerf = allTimeOperatorPerformance.get(operator.operator_name);
            if (allTimePerf) {
              emptyOperator.allTimePerformance = allTimePerf;
            }

            return emptyOperator;
          }
        });

        // Calculate machine performance
        const machinePerformance: MachinePerformance[] = Array.from(currentProcessed.machineMap.values()).map(machine => {
          machine.efficiency = machine.totalTime > 0 ? machine.totalUnits / machine.totalTime : 0;
          
          // Count unique operators for this machine
          const operatorsForMachine = new Set<string>();
          currentProcessed.operatorMap.forEach(operator => {
            if (operator.activities[machine.machineName]?.totalUnits > 0) {
              operatorsForMachine.add(operator.operatorCode);
            }
          });
          machine.operators = operatorsForMachine.size;

          return machine;
        });

        // Calculate activity summaries - only include operators with actual data for each activity
        const activitySummary: Record<string, any> = {};
        currentProcessed.activityMap.forEach((data, activityType) => {
          // Count only operators who actually have data for this specific activity
          const operatorsWithDataForActivity = Array.from(currentProcessed.operatorMap.values())
            .filter(operator => operator.activities[activityType]?.totalUnits > 0 || operator.activities[activityType]?.totalTime > 0);
          
          // Calculate averages based only on operators with actual activity data
          const totalEfficiencyForActivity = operatorsWithDataForActivity.reduce((sum, operator) => {
            const activity = operator.activities[activityType];
            return sum + (activity?.efficiency || 0);
          }, 0);
          
          const totalScrapRateForActivity = operatorsWithDataForActivity.reduce((sum, operator) => {
            const activity = operator.activities[activityType];
            return sum + (activity?.scrapRate || 0);
          }, 0);
          
          activitySummary[activityType] = {
            totalUnits: data.totalUnits,
            totalTime: data.totalTime,
            totalScrap: data.totalScrap,
            avgEfficiency: operatorsWithDataForActivity.length > 0 ? totalEfficiencyForActivity / operatorsWithDataForActivity.length : 0,
            avgScrapRate: operatorsWithDataForActivity.length > 0 ? totalScrapRateForActivity / operatorsWithDataForActivity.length : 0,
            operatorsWithData: operatorsWithDataForActivity.length, // Track how many operators contributed to average
          };
        });

        // Calculate laser aggregated stats
        const laserStats = {
          totalUnits: 0,
          totalTime: 0,
          operators: new Set<string>(),
        };

        allOperatorPerformance.forEach(operator => {
          if (operator.laserActivities.totalUnits > 0) {
            laserStats.totalUnits += operator.laserActivities.totalUnits;
            laserStats.totalTime += operator.laserActivities.totalTime;
            laserStats.operators.add(operator.operatorCode);
          }
        });

        // Calculate overall stats
        const overallStats = {
          totalShifts: currentPeriodData.length,
          totalUnits: Array.from(currentProcessed.activityMap.values()).reduce((sum, data) => sum + data.totalUnits, 0),
          totalScrap: Array.from(currentProcessed.activityMap.values()).reduce((sum, data) => sum + data.totalScrap, 0),
          avgEfficiency: 0,
          avgScrapRate: 0,
          laserStats: laserStats.totalTime > 0 ? {
            avgEfficiency: laserStats.totalUnits / laserStats.totalTime,
            totalUnits: laserStats.totalUnits,
            operators: laserStats.operators.size,
          } : undefined,
        };

        const totalTime = Array.from(currentProcessed.activityMap.values()).reduce((sum, data) => sum + data.totalTime, 0);
        overallStats.avgEfficiency = totalTime > 0 ? overallStats.totalUnits / totalTime : 0;
        overallStats.avgScrapRate = overallStats.totalUnits > 0 ? (overallStats.totalScrap / overallStats.totalUnits) * 100 : 0;

        return {
          operatorPerformance: allOperatorPerformance,
          machinePerformance,
          activitySummary,
          overallStats,
          trends: {}, // Simplified - no trend analysis needed
        };
      } catch (error: any) {
        toast({
          title: "Error loading analytics data",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};