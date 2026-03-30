
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OEETargetRates } from './useOEESettings';
import { format, subDays } from 'date-fns';

interface OEETimeSeriesFilters {
  startDate?: string;
  endDate?: string;
  activityTypes?: string[];
}

interface OEETimeSeriesData {
  date: string;
  activity_type: string;
  oee_247: number;
  oee_booked: number;
  availability_247: number;
  performance_247: number;
  availability_booked: number;
  performance_booked: number;
  quality: number;
  total_units: number;
  total_time: number;
  booked_hours: number;
}

export const useOEETimeSeries = (
  targetRates: OEETargetRates,
  filters?: OEETimeSeriesFilters
) => {
  return useQuery({
    queryKey: ['oee-time-series', targetRates, filters],
    queryFn: async (): Promise<OEETimeSeriesData[]> => {
      try {
        console.log('Fetching OEE time series data...');
        
        // Default to last 30 days if no filters provided
        const endDate = filters?.endDate || format(new Date(), 'yyyy-MM-dd');
        const startDate = filters?.startDate || format(subDays(new Date(), 30), 'yyyy-MM-dd');
        
        console.log('Date range:', { startDate, endDate });

        // First, try to get data from daily summary table using raw query since types aren't updated yet
        const { data: summaryData, error: summaryError } = await supabase
          .from('oee_daily_summary' as any)
          .select('*')
          .gte('calculation_date', startDate)
          .lte('calculation_date', endDate)
          .in('activity_type', filters?.activityTypes || ['Laser1', 'Laser2', 'Laser3', 'Welder'])
          .order('calculation_date', { ascending: true });
        
        if (summaryError) {
          console.error('Error fetching OEE summary data:', summaryError);
          throw summaryError;
        }

        console.log(`Found ${summaryData?.length || 0} summary records`);

        // If we have summary data, return it formatted
        if (summaryData && summaryData.length > 0) {
          return (summaryData as any[]).map((record: any) => ({
            date: format(new Date(record.calculation_date), 'yyyy-MM-dd'),
            activity_type: record.activity_type,
            oee_247: record.oee_247 || 0,
            oee_booked: record.oee_booked || 0,
            availability_247: record.availability_247 || 0,
            performance_247: record.performance_247 || 0,
            availability_booked: record.availability_booked || 0,
            performance_booked: record.performance_booked || 0,
            quality: record.quality || 0,
            total_units: record.total_units || 0,
            total_time: record.total_time || 0,
            booked_hours: record.booked_hours || 0,
          }));
        }

        // If no summary data, calculate from shift records (fallback)
        console.log('No summary data found, calculating from shift records...');
        
        const { data: shiftData, error: shiftError } = await supabase
          .from('shift_records')
          .select('*')
          .gte('shift_date', startDate)
          .lte('shift_date', endDate)
          .order('shift_date', { ascending: true });

        if (shiftError) {
          console.error('Error fetching shift data:', shiftError);
          throw shiftError;
        }

        console.log(`Found ${shiftData?.length || 0} shift records for fallback calculation`);

        // Group by date and activity type for daily calculations
        const dailyData = new Map<string, Map<string, {
          units: number;
          time: number;
          scrap: number;
          bookedHours: number;
        }>>();

        shiftData?.forEach(record => {
          const date = format(new Date(record.shift_date), 'yyyy-MM-dd');
          const productionData = record.production_data as any;
          
          if (!productionData?.activities) return;

          if (!dailyData.has(date)) {
            dailyData.set(date, new Map());
          }
          
          const dateMap = dailyData.get(date)!;
          const hoursBooked = Number(productionData.hours_booked) || 0;

          // Process activities
          Object.entries(productionData.activities).forEach(([activityType, entries]: [string, any]) => {
            if (!Array.isArray(entries)) return;

            if (!dateMap.has(activityType)) {
              dateMap.set(activityType, { units: 0, time: 0, scrap: 0, bookedHours: 0 });
            }

            const activityData = dateMap.get(activityType)!;
            
            entries.forEach((entry: any) => {
              activityData.units += Number(entry.UnitsProduced) || Number(entry.units_produced) || 0;
              activityData.time += Number(entry.TimeSpent) || Number(entry.time_spent) || 0;
              activityData.scrap += Number(entry.Scrap) || Number(entry.scrap) || 0;
            });
            
            activityData.bookedHours += hoursBooked;
          });
        });

        // Convert to time series format
        const result: OEETimeSeriesData[] = [];
        
        dailyData.forEach((activities, date) => {
          activities.forEach((data, activityType) => {
            if (filters?.activityTypes && filters.activityTypes.length > 0 && 
                !filters.activityTypes.includes(activityType)) {
              return;
            }

            const targetRate247 = targetRates[activityType as keyof OEETargetRates] || 200;
            const targetRateBooked = targetRate247;
            
            const goodUnits = data.units - data.scrap;
            const quality = data.units > 0 ? (goodUnits / data.units) * 100 : 100;
            
            // 24/7 calculations (using 24 hours as theoretical capacity)
            const availability247 = data.bookedHours > 0 ? Math.min((data.bookedHours / 24) * 100, 100) : 0;
            const performance247 = (targetRate247 * data.time) > 0 && data.time > 0 ? 
              Math.min((data.units / (targetRate247 * data.time)) * 100, 200) : 0;
            const oee247 = (availability247 * performance247 * quality) / 10000;
            
            // Booked time calculations
            const performanceBooked = (targetRateBooked * data.time) > 0 && data.time > 0 ? 
              Math.min((data.units / (targetRateBooked * data.time)) * 100, 200) : 0;
            const oeeBooked = (100 * performanceBooked * quality) / 10000;

            result.push({
              date,
              activity_type: activityType,
              oee_247: Math.min(Math.max(0, oee247), 200),
              oee_booked: Math.min(Math.max(0, oeeBooked), 200),
              availability_247: Math.min(Math.max(0, availability247), 100),
              performance_247: Math.min(Math.max(0, performance247), 200),
              availability_booked: 100,
              performance_booked: Math.min(Math.max(0, performanceBooked), 200),
              quality: Math.min(Math.max(0, quality), 100),
              total_units: data.units,
              total_time: data.time,
              booked_hours: data.bookedHours,
            });
          });
        });

        return result.sort((a, b) => a.date.localeCompare(b.date));
      } catch (error) {
        console.error('Error in useOEETimeSeries:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};
