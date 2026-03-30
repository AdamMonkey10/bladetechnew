import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
}

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

export const useOperatorShiftBreakdown = (filters?: AnalyticsFilters, targetRates?: Record<string, number>) => {
  return useQuery({
    queryKey: ['operator-shift-breakdown', filters, targetRates],
    queryFn: async (): Promise<OperatorShiftData[]> => {
      try {
        console.log('=== OPERATOR SHIFT BREAKDOWN START ===');
        console.log('Filters:', filters);
        console.log('Target Rates:', targetRates);

        // Build the query
        let query = supabase
          .from('shift_records')
          .select(`
            shift_date,
            shift_type,
            production_data,
            operators!inner(
              operator_name,
              operator_code
            )
          `)
          .not('production_data', 'is', null)
          .not('operator_id', 'is', null);

        // Apply date filters
        if (filters?.startDate) {
          query = query.gte('shift_date', filters.startDate);
        }
        if (filters?.endDate) {
          query = query.lte('shift_date', filters.endDate);
        }

        const { data: shiftRecords, error } = await query;

        if (error) {
          console.error('Error fetching shift records:', error);
          throw error;
        }

        console.log('Raw shift records:', shiftRecords?.length);

        if (!shiftRecords || shiftRecords.length === 0) {
          return [];
        }

        const operatorShiftData: OperatorShiftData[] = [];

        // Process each shift record
        shiftRecords.forEach((record: any) => {
          const operator = record.operators;
          if (!operator || !record.production_data?.activities) {
            return;
          }

          // Handle both old and new data structures
          const activities = record.production_data.activities;
          
          // Check if it's the new structure (array of activities with entries)
          if (Array.isArray(activities)) {
            activities.forEach((activityGroup: any) => {
              const activityName = activityGroup.name;
              const entries = activityGroup.entries || [];
              
              entries.forEach((entry: any) => {
                const unitsProduced = parseInt(entry.units_produced) || 0;
                const timeSpent = parseFloat(entry.time_spent) || 0;
                const scrap = parseInt(entry.scrap) || 0;
                
                if (unitsProduced > 0 && timeSpent > 0) {
                  const actualRate = unitsProduced / timeSpent;
                  const targetRate = targetRates?.[activityName] || 200;
                  const efficiency = (actualRate / targetRate) * 100;
                  const qualityRate = unitsProduced > 0 ? ((unitsProduced - scrap) / unitsProduced) * 100 : 100;

                  operatorShiftData.push({
                    operatorName: operator.operator_name,
                    operatorCode: operator.operator_code,
                    shiftDate: record.shift_date,
                    shiftType: record.shift_type,
                    activity: activityName,
                    unitsProduced,
                    timeSpent,
                    scrap,
                    actualRate,
                    targetRate,
                    efficiency,
                    qualityRate,
                  });
                }
              });
            });
          } else {
            // Handle old structure (object with activity keys)
            Object.entries(activities).forEach(([activityName, activityData]: [string, any]) => {
              if (Array.isArray(activityData)) {
                activityData.forEach((entry: any) => {
                  const unitsProduced = parseInt(entry.UnitsProduced) || 0;
                  const timeSpent = parseFloat(entry.TimeSpent) || 0;
                  const scrap = parseInt(entry.Scrap) || 0;
                  
                  if (unitsProduced > 0 && timeSpent > 0) {
                    const actualRate = unitsProduced / timeSpent;
                    const targetRate = targetRates?.[activityName] || 200;
                    const efficiency = (actualRate / targetRate) * 100;
                    const qualityRate = unitsProduced > 0 ? ((unitsProduced - scrap) / unitsProduced) * 100 : 100;

                    operatorShiftData.push({
                      operatorName: operator.operator_name,
                      operatorCode: operator.operator_code,
                      shiftDate: record.shift_date,
                      shiftType: record.shift_type,
                      activity: activityName,
                      unitsProduced,
                      timeSpent,
                      scrap,
                      actualRate,
                      targetRate,
                      efficiency,
                      qualityRate,
                    });
                  }
                });
              }
            });
          }
        });

        console.log('Processed operator shift data:', operatorShiftData.length, 'entries');
        
        // Sort by date and operator name
        return operatorShiftData.sort((a, b) => {
          const dateCompare = new Date(b.shiftDate).getTime() - new Date(a.shiftDate).getTime();
          if (dateCompare !== 0) return dateCompare;
          return a.operatorName.localeCompare(b.operatorName);
        });

      } catch (error) {
        console.error('Error in operator shift breakdown:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};