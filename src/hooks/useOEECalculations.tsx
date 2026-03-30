
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OEETargetRates } from './useOEESettings';
import { getBusinessWeekPeriod, formatForSupabaseQuery } from '@/utils/businessWeekUtils';

interface OEEData {
  activityType: string;
  totalUnits: number;
  totalTime: number;
  totalScrap: number;
  bookedHours: number;
  productiveHours: number;
}

interface OEEMetrics {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

interface ActivityOEE {
  activityType: string;
  oee24_7: OEEMetrics;
  oeeBookedTime: OEEMetrics;
  bookedTargetRate: number;
  target247Rate: number;
  actualRate: number;
  actualUnits: number;
  timeSpent: number;
}

interface SKUProcessBreakdown {
  sku: string;
  process: string;
  units: number;
  timeSpent: number;
  scrap: number;
}

interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
}

interface MachineOEE {
  machineCode: string;
  machineName: string;
  oee24_7: OEEMetrics;
  oeeBookedTime: OEEMetrics;
  totalUnits: number;
  totalBookedHours: number;
  theoretical24_7_Units: number;
  theoreticalBookedUnits: number;
}

export const useOEECalculations = (
  bookedTargetRates: OEETargetRates, 
  target247Rates: OEETargetRates, 
  filters?: AnalyticsFilters
) => {
  return useQuery({
    queryKey: ['oee-calculations', bookedTargetRates, target247Rates, filters],
    queryFn: async (): Promise<{
      overallOEE: {
        oee24_7: OEEMetrics;
        oeeBookedTime: OEEMetrics;
      };
      activityOEE: ActivityOEE[];
      machineOEE: MachineOEE[];
      skuProcessBreakdown: SKUProcessBreakdown[];
      summary: {
        totalUnits: number;
        totalBookedHours: number;
        totalScrap: number;
        periodHours: number;
        theoretical24_7_Units: number;
        theoreticalBookedUnits: number;
        periodDescription: string;
      };
    }> => {
      try {
        console.log('=== OEE CALCULATION START ===');
        console.log('Target Rates:', { bookedTargetRates, target247Rates });
        console.log('Filters:', filters);

        // Get business week period or use custom filters
        let periodInfo;
        let queryStartDate: string;
        let queryEndDate: string;

        if (filters?.startDate && filters?.endDate) {
          // Use custom date range
          const start = new Date(filters.startDate);
          const end = new Date(filters.endDate);
          const hours = Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60);
          
          periodInfo = {
            hours: Math.round(hours * 10) / 10,
            description: `Custom Range: ${filters.startDate} - ${filters.endDate}`
          };
          queryStartDate = filters.startDate;
          queryEndDate = filters.endDate;
        } else {
          // Use business week period (Monday 6am to current time)
          const businessWeek = getBusinessWeekPeriod();
          periodInfo = {
            hours: businessWeek.hours,
            description: businessWeek.description
          };
          
          console.log('Business week calculated:', {
            start: businessWeek.start.toISOString(),
            end: businessWeek.end.toISOString(),
            hours: businessWeek.hours
          });
          
          // For database query, use date format since shift_date is a DATE field
          // We need to include all days from Monday through the current day
          queryStartDate = businessWeek.start.toISOString().split('T')[0];
          queryEndDate = businessWeek.end.toISOString().split('T')[0];
        }

        console.log('Period Info:', periodInfo);
        console.log('Query date range:', { queryStartDate, queryEndDate });

        // Get shift data
        let query = supabase
          .from('shift_records')
          .select('*')
          .order('shift_date', { ascending: false });

        query = query.gte('shift_date', queryStartDate);
        query = query.lte('shift_date', queryEndDate);

        const { data: shiftData, error } = await query;
        if (error) throw error;

        console.log(`Found ${shiftData.length} shift records for business week period`);

        // Process shift data to get activity totals and machine-specific data
        let totalUnits = 0;
        let totalBookedHours = 0;
        let totalScrap = 0;
        
        const activityTotals = new Map<string, { units: number; timeSpent: number; scrap: number }>();
        const machineTotals = new Map<string, { units: number; bookedHours: number; scrap: number; machineData: any }>();
        const skuProcessMap = new Map<string, SKUProcessBreakdown>();

        shiftData.forEach(record => {
          const productionData = record.production_data as any;
          if (!productionData?.activities) return;

          const hoursBooked = Number(productionData.hours_booked) || 0;
          totalBookedHours += hoursBooked;

          // Since machine_id references aren't set up, we'll use a placeholder
          const machineCode = 'ALL_MACHINES';
          const machineName = 'All Machines Combined';

          // Initialize machine data if not exists
          if (!machineTotals.has(machineCode)) {
            machineTotals.set(machineCode, { 
              units: 0, 
              bookedHours: 0, 
              scrap: 0, 
              machineData: { code: machineCode, name: machineName } 
            });
          }

          let machineUnits = 0;
          let machineScrap = 0;

          if (Array.isArray(productionData.activities)) {
            // Old format
            productionData.activities.forEach((activityGroup: any) => {
              const activityType = activityGroup.name;
              if (!activityType) return;

              let activityUnits = 0;
              let activityScrap = 0;
              let activityTimeSpent = 0;

              (activityGroup.entries || []).forEach((entry: any) => {
                const units = Number(entry.units_produced) || 0;
                const scrap = Number(entry.scrap) || 0;
                const timeSpent = Number(entry.time_spent) || 0;
                
                activityUnits += units;
                activityScrap += scrap;
                activityTimeSpent += timeSpent;
                
                // Track SKU/Process breakdown
                if (entry.sku && units > 0) {
                  const processName = activityType.startsWith('Laser') ? 'Laser' : activityType;
                  const key = `${entry.sku}-${processName}`;
                  
                  if (!skuProcessMap.has(key)) {
                    skuProcessMap.set(key, {
                      sku: entry.sku,
                      process: processName,
                      units: 0,
                      timeSpent: 0,
                      scrap: 0
                    });
                  }
                  
                  const skuProcess = skuProcessMap.get(key)!;
                  skuProcess.units += units;
                  skuProcess.timeSpent += timeSpent;
                  skuProcess.scrap += scrap;
                }
              });

              totalUnits += activityUnits;
              totalScrap += activityScrap;
              machineUnits += activityUnits;
              machineScrap += activityScrap;

              if (!activityTotals.has(activityType)) {
                activityTotals.set(activityType, { units: 0, timeSpent: 0, scrap: 0 });
              }
              const activity = activityTotals.get(activityType)!;
              activity.units += activityUnits;
              activity.timeSpent += activityTimeSpent;
              activity.scrap += activityScrap;
            });
          } else {
            // New format
            Object.keys(productionData.activities).forEach((activityType: string) => {
              const entries = productionData.activities[activityType];
              if (!Array.isArray(entries)) return;

              let activityUnits = 0;
              let activityScrap = 0;
              let activityTimeSpent = 0;

              entries.forEach((entry: any) => {
                const units = Number(entry.UnitsProduced) || Number(entry.units_produced) || 0;
                const scrap = Number(entry.Scrap) || Number(entry.scrap) || 0;
                const timeSpent = Number(entry.TimeSpent) || Number(entry.time_spent) || 0;
                
                activityUnits += units;
                activityScrap += scrap;
                activityTimeSpent += timeSpent;
                
                // Track SKU/Process breakdown for new format too
                const sku = entry.SKU || entry.sku;
                if (sku && units > 0) {
                  const processName = activityType.startsWith('Laser') ? 'Laser' : activityType;
                  const key = `${sku}-${processName}`;
                  
                  if (!skuProcessMap.has(key)) {
                    skuProcessMap.set(key, {
                      sku: sku,
                      process: processName,
                      units: 0,
                      timeSpent: 0,
                      scrap: 0
                    });
                  }
                  
                  const skuProcess = skuProcessMap.get(key)!;
                  skuProcess.units += units;
                  skuProcess.timeSpent += timeSpent;
                  skuProcess.scrap += scrap;
                }
              });

              totalUnits += activityUnits;
              totalScrap += activityScrap;
              machineUnits += activityUnits;
              machineScrap += activityScrap;

              if (!activityTotals.has(activityType)) {
                activityTotals.set(activityType, { units: 0, timeSpent: 0, scrap: 0 });
              }
              const activity = activityTotals.get(activityType)!;
              activity.units += activityUnits;
              activity.timeSpent += activityTimeSpent;
              activity.scrap += activityScrap;
            });
          }

          // Update machine totals
          const machineTotal = machineTotals.get(machineCode)!;
          machineTotal.units += machineUnits;
          machineTotal.bookedHours += hoursBooked;
          machineTotal.scrap += machineScrap;
        });

        console.log('TOTALS:', { totalUnits, totalBookedHours, totalScrap });
        console.log('Activity breakdown:', Array.from(activityTotals.entries()));

        // Calculate theoretical capacities - FIXED LOGIC
        let theoretical24_7_Units = 0;
        let theoreticalBookedUnits = 0;

        // Only count activities that actually produced units
        Array.from(activityTotals.entries()).forEach(([activityType, totals]) => {
          if (totals.units > 0) {
            // Map laser activities to global Laser rate
            const mappedActivityType = activityType.startsWith('Laser') ? 'Laser' : activityType;
            const rate247 = target247Rates[mappedActivityType as keyof OEETargetRates] || 0;
            const rateBooked = bookedTargetRates[mappedActivityType as keyof OEETargetRates] || 0;
            
            // For 24/7: rate × business week hours for this specific activity
            theoretical24_7_Units += rate247 * periodInfo.hours;
            
            // For booked: rate × actual time spent on this activity
            theoreticalBookedUnits += rateBooked * totals.timeSpent;
            
            console.log(`${activityType}: 24/7 = ${rate247} × ${periodInfo.hours} = ${rate247 * periodInfo.hours}, Booked = ${rateBooked} × ${totals.timeSpent} = ${rateBooked * totals.timeSpent}`);
          }
        });

        console.log('THEORETICAL CAPACITIES:');
        console.log(`24/7: ${theoretical24_7_Units} units`);
        console.log(`Booked: ${theoreticalBookedUnits} units`);

        // Calculate OEE metrics
        const goodUnits = totalUnits - totalScrap;
        const quality = totalUnits > 0 ? (goodUnits / totalUnits) * 100 : 100;

        // 24/7 OEE calculations - using business week hours
        const availability247 = periodInfo.hours > 0 ? (totalBookedHours / periodInfo.hours) * 100 : 100;
        const performance247 = theoretical24_7_Units > 0 ? (totalUnits / theoretical24_7_Units) * 100 : 0;
        const oee247 = (availability247 * performance247 * quality) / 10000;

        // Booked OEE calculations
        const availabilityBooked = 100; // When scheduled, availability is 100%
        const performanceBooked = theoreticalBookedUnits > 0 ? (totalUnits / theoreticalBookedUnits) * 100 : 0;
        const oeeBooked = (availabilityBooked * performanceBooked * quality) / 10000;

        console.log('FINAL OEE:');
        console.log(`24/7 - Availability: ${availability247.toFixed(2)}%, Performance: ${performance247.toFixed(2)}%, Quality: ${quality.toFixed(2)}%, OEE: ${oee247.toFixed(2)}%`);
        console.log(`Booked - Availability: ${availabilityBooked.toFixed(2)}%, Performance: ${performanceBooked.toFixed(2)}%, Quality: ${quality.toFixed(2)}%, OEE: ${oeeBooked.toFixed(2)}%`);

        const overallOEE = {
          oee24_7: {
            availability: Math.max(0, availability247),
            performance: Math.max(0, performance247),
            quality: Math.max(0, quality),
            oee: Math.max(0, oee247),
          },
          oeeBookedTime: {
            availability: Math.max(0, availabilityBooked),
            performance: Math.max(0, performanceBooked),
            quality: Math.max(0, quality),
            oee: Math.max(0, oeeBooked),
          },
        };

        // Activity breakdown
        const activityOEE: ActivityOEE[] = Array.from(activityTotals.entries()).map(([activityType, totals]) => {
          // Map laser activities to global Laser rate
          const mappedActivityType = activityType.startsWith('Laser') ? 'Laser' : activityType;
          const rate247 = target247Rates[mappedActivityType as keyof OEETargetRates] || 0;
          const rateBooked = bookedTargetRates[mappedActivityType as keyof OEETargetRates] || 0;
          
          const activityGoodUnits = totals.units - totals.scrap;
          const activityQuality = totals.units > 0 ? (activityGoodUnits / totals.units) * 100 : 100;
          
          // Individual activity theoretical capacities - using business week hours
          const theoretical247 = rate247 * periodInfo.hours;
          const theoreticalBooked = rateBooked * totals.timeSpent;
          
          const avail247 = periodInfo.hours > 0 ? (totals.timeSpent / periodInfo.hours) * 100 : 100;
          const perf247 = theoretical247 > 0 ? (totals.units / theoretical247) * 100 : 0;
          const perfBooked = theoreticalBooked > 0 ? (totals.units / theoreticalBooked) * 100 : 0;
          
          return {
            activityType,
            bookedTargetRate: rateBooked,
            target247Rate: rate247,
            actualRate: totals.timeSpent > 0 ? totals.units / totals.timeSpent : 0,
            actualUnits: totals.units,
            timeSpent: totals.timeSpent,
            oee24_7: {
              availability: Math.max(0, avail247),
              performance: Math.max(0, perf247),
              quality: Math.max(0, activityQuality),
              oee: Math.max(0, (avail247 * perf247 * activityQuality) / 10000),
            },
            oeeBookedTime: {
              availability: 100,
              performance: Math.max(0, perfBooked),
              quality: Math.max(0, activityQuality),
              oee: Math.max(0, (100 * perfBooked * activityQuality) / 10000),
            },
          };
        });

        // Machine breakdown
        const machineOEE: MachineOEE[] = Array.from(machineTotals.entries()).map(([machineCode, totals]) => {
          const machineGoodUnits = totals.units - totals.scrap;
          const machineQuality = totals.units > 0 ? (machineGoodUnits / totals.units) * 100 : 100;
          
          // For machine calculations, we'll use average rates across all activities
          const avgRate247 = (target247Rates.Laser + target247Rates.Welder) / 2;
          const avgRateBooked = (bookedTargetRates.Laser + bookedTargetRates.Welder) / 2;
          
          const machineTheoretical247 = avgRate247 * periodInfo.hours;
          const machineTheoreticalBooked = avgRateBooked * totals.bookedHours;
          
          const machineAvail247 = periodInfo.hours > 0 ? (totals.bookedHours / periodInfo.hours) * 100 : 100;
          const machinePerf247 = machineTheoretical247 > 0 ? (totals.units / machineTheoretical247) * 100 : 0;
          const machinePerfBooked = machineTheoreticalBooked > 0 ? (totals.units / machineTheoreticalBooked) * 100 : 0;
          
          return {
            machineCode,
            machineName: totals.machineData.name,
            totalUnits: totals.units,
            totalBookedHours: totals.bookedHours,
            theoretical24_7_Units: machineTheoretical247,
            theoreticalBookedUnits: machineTheoreticalBooked,
            oee24_7: {
              availability: Math.max(0, machineAvail247),
              performance: Math.max(0, machinePerf247),
              quality: Math.max(0, machineQuality),
              oee: Math.max(0, (machineAvail247 * machinePerf247 * machineQuality) / 10000),
            },
            oeeBookedTime: {
              availability: 100,
              performance: Math.max(0, machinePerfBooked),
              quality: Math.max(0, machineQuality),
              oee: Math.max(0, (100 * machinePerfBooked * machineQuality) / 10000),
            },
          };
        });

        // Convert SKU breakdown map to sorted array
        const skuProcessBreakdown: SKUProcessBreakdown[] = Array.from(skuProcessMap.values()).sort((a, b) => {
          if (a.sku !== b.sku) return a.sku.localeCompare(b.sku);
          return a.process.localeCompare(b.process);
        });

        return {
          overallOEE,
          activityOEE: activityOEE.sort((a, b) => b.oee24_7.oee - a.oee24_7.oee),
          machineOEE: machineOEE.sort((a, b) => b.oee24_7.oee - a.oee24_7.oee),
          skuProcessBreakdown,
          summary: {
            totalUnits,
            totalBookedHours,
            totalScrap,
            periodHours: periodInfo.hours,
            theoretical24_7_Units,
            theoreticalBookedUnits,
            periodDescription: periodInfo.description,
          },
        };
      } catch (error) {
        console.error('Error calculating OEE:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
