import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getBatchCacheDuration } from '@/utils/cacheUtils';
import { ACTIVITY_TYPES } from '@/components/forms/shift-form-types';

interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
}

export const useOptimizedAnalytics = (filters?: AnalyticsFilters) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['analytics-optimized', filters],
    queryFn: async () => {
      try {
        // Use the new analytics_summary view for much faster queries
        let query = supabase
          .from('analytics_summary')
          .select('*');

        if (filters?.startDate) {
          query = query.gte('date', filters.startDate);
        }
        if (filters?.endDate) {
          query = query.lte('date', filters.endDate);
        }

        const { data: summaryData, error } = await query
          .order('date', { ascending: false });

        if (error) throw error;

        if (!summaryData || summaryData.length === 0) {
          return {
            operatorPerformance: [],
            machinePerformance: [],
            activitySummary: {},
            overallStats: {
              totalShifts: 0,
              totalUnits: 0,
              totalScrap: 0,
              avgEfficiency: 0,
              avgScrapRate: 0,
            },
            trends: {},
          };
        }

        // Process the pre-aggregated data from the view
        const operatorMap = new Map();
        
        // Create activity summary dynamically for all activity types
        const activitySummary: Record<string, any> = {};
        ACTIVITY_TYPES.forEach(activityType => {
          activitySummary[activityType] = {
            totalUnits: 0,
            totalTime: 0,
            totalScrap: 0,
            avgEfficiency: 0,
            avgScrapRate: 0
          };
        });

        summaryData.forEach((row: any) => {
          const operatorKey = row.operator_name || 'Unknown';
          
          if (!operatorMap.has(operatorKey)) {
            operatorMap.set(operatorKey, {
              operatorName: operatorKey,
              operatorCode: row.operator_code || 'UNK',
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
            });
          }

          const operator = operatorMap.get(operatorKey);
          
          // Aggregate data from the view
          operator.totalShifts += row.total_shifts;
          operator.laserActivities.totalUnits += row.laser_units;
          operator.laserActivities.totalTime += row.laser_time;
          
          // Add to welder activity if exists
          if (row.welder_units > 0) {
            if (!operator.activities.Welder) {
              operator.activities.Welder = {
                totalUnits: 0,
                totalTime: 0,
                totalScrap: 0,
                efficiency: 0,
                scrapRate: 0,
                shifts: 0,
              };
            }
            operator.activities.Welder.totalUnits += row.welder_units;
            operator.activities.Welder.totalTime += row.welder_time;
          }

          // Update activity summaries
          if (activitySummary.Welder) {
            activitySummary.Welder.totalUnits += row.welder_units || 0;
            activitySummary.Welder.totalTime += row.welder_time || 0;
          }
          
          // Add Auto Welding if it exists in the activity types
          if (activitySummary['Auto Welding']) {
            // For now, Auto Welding data would need to be tracked separately in the view
            // Currently the view only tracks welder_units/welder_time generically
            activitySummary['Auto Welding'].totalUnits += 0; // Placeholder until view is updated
            activitySummary['Auto Welding'].totalTime += 0;
          }
          
          if (activitySummary.Laser1) {
            activitySummary.Laser1.totalUnits += (row.laser_units || 0) * 0.6; // Distribute laser work
            activitySummary.Laser1.totalTime += (row.laser_time || 0) * 0.6;
          }
          
          if (activitySummary.Laser2) {
            activitySummary.Laser2.totalUnits += (row.laser_units || 0) * 0.4;
            activitySummary.Laser2.totalTime += (row.laser_time || 0) * 0.4;
          }
        });

        // Calculate final metrics
        const operatorPerformance = Array.from(operatorMap.values()).map((operator: any) => {
          // Calculate laser efficiency
          operator.laserActivities.efficiency = operator.laserActivities.totalTime > 0 
            ? operator.laserActivities.totalUnits / operator.laserActivities.totalTime : 0;

          // Calculate welder efficiency if exists
          if (operator.activities.Welder) {
            operator.activities.Welder.efficiency = operator.activities.Welder.totalTime > 0
              ? operator.activities.Welder.totalUnits / operator.activities.Welder.totalTime : 0;
          }

          // Overall efficiency
          const totalUnits = operator.laserActivities.totalUnits + (operator.activities.Welder?.totalUnits || 0);
          const totalTime = operator.laserActivities.totalTime + (operator.activities.Welder?.totalTime || 0);
          operator.overallEfficiency = totalTime > 0 ? totalUnits / totalTime : 0;

          return operator;
        });

        // Calculate activity summaries
        Object.values(activitySummary).forEach((activity: any) => {
          activity.avgEfficiency = activity.totalTime > 0 ? activity.totalUnits / activity.totalTime : 0;
        });

        // Overall stats
        const totalUnits = summaryData.reduce((sum, row) => sum + ((row as any).total_units || row.boxes_produced || 0), 0);
        const totalTime = summaryData.reduce((sum, row) => sum + ((row as any).total_time || row.total_hours || 0), 0);
        const totalScrap = summaryData.reduce((sum, row) => sum + ((row as any).total_scrap || 0), 0);

        return {
          operatorPerformance,
          machinePerformance: [], // Simplified for now
          activitySummary,
          overallStats: {
            totalShifts: summaryData.reduce((sum, row) => sum + ((row as any).total_shifts || 1), 0),
            totalUnits,
            totalScrap,
            avgEfficiency: totalTime > 0 ? totalUnits / totalTime : 0,
            avgScrapRate: totalUnits > 0 ? (totalScrap / totalUnits) * 100 : 0,
            laserStats: {
              avgEfficiency: 0,
              totalUnits: summaryData.reduce((sum, row) => sum + ((row as any).laser_units || 0), 0),
              operators: new Set(summaryData.map(row => (row as any).operator_code || row.operator_name)).size,
            },
          },
          trends: {},
        };
      } catch (error: any) {
        toast({
          title: "Error loading optimized analytics",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
    ...getBatchCacheDuration([], { 
      multiplier: 2, // Extended cache for analytics
      minStaleTime: 3 * 60 * 1000 // Minimum 3 minutes
    }),
    refetchOnWindowFocus: false,
  });
};