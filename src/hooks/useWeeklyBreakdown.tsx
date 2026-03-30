import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format, subWeeks } from 'date-fns';
import { useOEESettings } from './useOEESettings';

interface WeeklyBreakdownFilters {
  weekStartDate?: Date;
  singleDay?: boolean;
}

interface WeeklyMachineData {
  machine: string;
  totalRuntime: number;
  totalUnits: number;
  totalScrap: number;
  utilization: number;
  efficiency: number;
  operators: OperatorMachineData[];
  skus: SKUMachineData[];
}

interface OperatorMachineData {
  operatorName: string;
  operatorCode: string;
  runtime: number;
  units: number;
  scrap: number;
  efficiency: number;
  shifts: ShiftDetail[];
}

interface SKUMachineData {
  sku: string;
  units: number;
  runtime: number;
  scrap: number;
  rate: number;
}

interface ShiftDetail {
  date: string;
  shiftType: string;
  operatorName: string;
  machine: string;
  sku: string;
  units: number;
  runtime: number;
  scrap: number;
  rate: number;
  efficiency: number;
}

interface MachineBreakdownData {
  runtime: number;
  units: number;
  scrap: number;
  efficiency: number;
}

interface WeeklyOperatorData {
  operatorName: string;
  operatorCode: string;
  totalRuntime: number;
  totalUnits: number;
  totalScrap: number;
  averageEfficiency: number;
  machines: string[];
  machineBreakdown: {
    [machine: string]: MachineBreakdownData;
  };
  dailyBreakdown: {
    [date: string]: {
      shifts: string[];
      totalUnits: number;
      totalRuntime: number;
      machines: string[];
    };
  };
}

export interface PreviousWeekSummary {
  totalProduction: number;
  totalRuntime: number;
  overallEfficiency: number;
  operatorsWorked: number;
  machinesUtilized: number;
}

export interface WeeklyBreakdownData {
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
  previousWeekSummary: PreviousWeekSummary | null;
  totalOperators: number;
  totalMachines: number;
  machines: WeeklyMachineData[];
  operators: WeeklyOperatorData[];
  detailedRecords: ShiftDetail[];
}

// Enhanced machine mapping to keep individual lasers separate
const MACHINE_MAPPING: Record<string, string> = {
  'Laser1': 'Laser1',
  'Laser2': 'Laser2', 
  'Laser3': 'Laser3',
  'Laser Machine 1': 'Laser1',
  'Laser Machine 2': 'Laser2',
  'Laser Machine 3': 'Laser3',
  'Laser Machine 32': 'Laser3',
  'Welder': 'Welder',
  'Welding Station': 'Welder',
  'Auto Welding': 'Auto Welding',
  'Coating': 'Coating',
  'Stacking': 'Stacking',
};

// Format machine names for display
const formatMachineDisplay = (name: string): string => {
  const n = (name || '').trim();
  if (/^laser\s*1$/i.test(n.replace(/\s+/g, ' ')) || /^laser1$/i.test(n)) return 'Laser 1';
  if (/^laser\s*2$/i.test(n.replace(/\s+/g, ' ')) || /^laser2$/i.test(n)) return 'Laser 2';
  if (/^laser\s*3$/i.test(n.replace(/\s+/g, ' ')) || /^laser3$/i.test(n)) return 'Laser 3';
  if (/auto\s*weld(ing)?/i.test(n)) return 'Auto Welder';
  if (/welder/i.test(n)) return 'Welder';
  if (/coating/i.test(n)) return 'Coating';
  if (/stacking/i.test(n)) return 'Stacking';
  return n || 'Unknown';
};

// Function to get target rate for any machine
const getMachineTargetRate = (machineName: string, targetRates: any): number => {
  const mappedActivity = MACHINE_MAPPING[machineName];
  if (mappedActivity && targetRates[mappedActivity]) {
    return targetRates[mappedActivity];
  }
  
  const lowerMachine = machineName.toLowerCase();
  if (lowerMachine.includes('laser1')) return targetRates.Laser1 || targetRates.Laser || 600;
  if (lowerMachine.includes('laser2')) return targetRates.Laser2 || targetRates.Laser || 600;
  if (lowerMachine.includes('laser3')) return targetRates.Laser3 || targetRates.Laser || 600;
  if (lowerMachine.includes('laser')) return targetRates.Laser || 600;
  if (lowerMachine.includes('weld')) return targetRates.Welder || 167;
  if (lowerMachine.includes('coating')) return targetRates.Coating || 200;
  if (lowerMachine.includes('stacking')) return targetRates.Stacking || 300;
  
  return 200;
};

// Helper: compute a quick summary from raw shift records
const computeQuickSummary = (
  shiftData: any[],
  targetRates: any
): { totalProduction: number; totalRuntime: number; overallEfficiency: number; operatorsWorked: number; machinesUtilized: number } => {
  let totalProduction = 0;
  let totalRuntime = 0;
  const operators = new Set<string>();
  const machines = new Set<string>();
  const machineStats = new Map<string, { units: number; runtime: number; scrap: number }>();

  shiftData.forEach((record: any) => {
    const opName = record.operators?.operator_name || 'Unknown';
    operators.add(opName);

    if (!record.production_data?.activities) return;
    const activities = record.production_data.activities;

    const processEntry = (activityType: string, entry: any) => {
      const units = parseInt(entry.units_produced) || 0;
      const timeSpent = parseFloat(entry.time_spent) || 0;
      const scrap = parseInt(entry.scrap || entry.Scrap) || 0;
      const sku = entry.sku || entry.SKU || 'Unknown';
      if (units <= 0 || sku === 'Unknown') return;

      totalProduction += units;
      totalRuntime += timeSpent;

      const rawMachine = MACHINE_MAPPING[activityType] || activityType;
      machines.add(rawMachine);
      const existing = machineStats.get(rawMachine) || { units: 0, runtime: 0, scrap: 0 };
      existing.units += units;
      existing.runtime += timeSpent;
      existing.scrap += scrap;
      machineStats.set(rawMachine, existing);
    };

    if (Array.isArray(activities)) {
      activities.forEach((activity: any) => {
        activity.entries?.forEach((entry: any) => processEntry(activity.name, entry));
      });
    } else {
      Object.entries(activities).forEach(([activityType, activityArray]: [string, any]) => {
        if (Array.isArray(activityArray)) {
          activityArray.forEach((entry: any) => processEntry(activityType, entry));
        }
      });
    }
  });

  // Calculate weighted efficiency
  let effSum = 0;
  let effCount = 0;
  machineStats.forEach((stats, machine) => {
    if (stats.units > 0) {
      const goodUnits = stats.units - stats.scrap;
      const actualRate = stats.runtime > 0 ? goodUnits / stats.runtime : 0;
      const targetRate = getMachineTargetRate(machine, targetRates);
      const eff = targetRate > 0 ? (actualRate / targetRate) * 100 : 0;
      effSum += eff;
      effCount++;
    }
  });

  return {
    totalProduction,
    totalRuntime,
    overallEfficiency: effCount > 0 ? effSum / effCount : 0,
    operatorsWorked: operators.size,
    machinesUtilized: machines.size,
  };
};

export const useWeeklyBreakdown = (filters?: WeeklyBreakdownFilters) => {
  const { targetRates } = useOEESettings();

  return useQuery({
    queryKey: ['weekly-breakdown', 'v3', filters, targetRates],
    queryFn: async (): Promise<WeeklyBreakdownData> => {
      try {
        // Calculate date range
        let weekStart: Date;
        let weekEnd: Date;
        
        if (filters?.singleDay && filters?.weekStartDate) {
          weekStart = filters.weekStartDate;
          weekEnd = filters.weekStartDate;
        } else {
          weekStart = filters?.weekStartDate 
            ? startOfWeek(filters.weekStartDate, { weekStartsOn: 1 })
            : startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
          weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        }

        // Previous week range
        const prevWeekStart = subWeeks(weekStart, 1);
        const prevWeekEnd = subWeeks(weekEnd, 1);

        // Fetch current week, previous week, total operators, total machines in parallel
        const [currentWeekResult, prevWeekResult, operatorsResult, machinesResult] = await Promise.all([
          supabase
            .from('shift_records')
            .select(`shift_date, shift_type, production_data, operators!inner(operator_name, operator_code)`)
            .gte('shift_date', format(weekStart, 'yyyy-MM-dd'))
            .lte('shift_date', format(weekEnd, 'yyyy-MM-dd'))
            .not('production_data', 'is', null)
            .not('operator_id', 'is', null),
          supabase
            .from('shift_records')
            .select(`shift_date, shift_type, production_data, operators!inner(operator_name, operator_code)`)
            .gte('shift_date', format(prevWeekStart, 'yyyy-MM-dd'))
            .lte('shift_date', format(prevWeekEnd, 'yyyy-MM-dd'))
            .not('production_data', 'is', null)
            .not('operator_id', 'is', null),
          supabase.from('operators').select('id').eq('active', true),
          supabase.from('machines').select('id, machine_name, machine_code').eq('active', true),
        ]);

        if (currentWeekResult.error) throw currentWeekResult.error;

        const shiftData = currentWeekResult.data || [];
        const totalOperators = operatorsResult.data?.length || 0;
        const totalMachines = machinesResult.data?.length || 0;

        // Compute previous week summary
        let previousWeekSummary: PreviousWeekSummary | null = null;
        if (prevWeekResult.data && prevWeekResult.data.length > 0) {
          previousWeekSummary = computeQuickSummary(prevWeekResult.data, targetRates);
        }

        // Process current week data (same logic as before)
        const detailedRecords: ShiftDetail[] = [];
        const machineData = new Map<string, {
          totalRuntime: number;
          totalUnits: number;
          totalScrap: number;
          operators: Map<string, OperatorMachineData>;
          skus: Map<string, SKUMachineData>;
        }>();

        const operatorData = new Map<string, {
          operatorName: string;
          operatorCode: string;
          totalRuntime: number;
          totalUnits: number;
          totalScrap: number;
          efficiencySum: number;
          efficiencyCount: number;
          machines: Set<string>;
          machineBreakdown: Map<string, { runtime: number; units: number; scrap: number; efficiency: number }>;
          dailyBreakdown: Map<string, { shifts: Set<string>; totalUnits: number; totalRuntime: number; machines: Set<string> }>;
        }>();

        // Initialize machine data
        Object.values(MACHINE_MAPPING).forEach(machine => {
          machineData.set(machine, { totalRuntime: 0, totalUnits: 0, totalScrap: 0, operators: new Map(), skus: new Map() });
        });

        const processActivityEntry = (record: any, machineEntry: any, machine: string, activityType: string, activity: any, units: number, timeSpent: number, scrap: number, sku: string, operatorName: string, operatorCode: string, detailedRecords: ShiftDetail[]) => {
          const entryTargetRate = getMachineTargetRate(activityType, targetRates);
          const goodUnits = units - scrap;
          const entryActualRate = timeSpent > 0 ? goodUnits / timeSpent : 0;
          const efficiency = entryTargetRate > 0 ? (entryActualRate / entryTargetRate) * 100 : 0;

          detailedRecords.push({
            date: record.shift_date,
            shiftType: record.shift_type,
            operatorName: operatorName || 'Unknown',
            machine: machine || 'Unknown',
            sku,
            units,
            runtime: timeSpent,
            scrap,
            rate: entryActualRate,
            efficiency,
          });

          machineEntry.totalRuntime += timeSpent;
          machineEntry.totalUnits += units;
          machineEntry.totalScrap += scrap;

          const operatorKey = `${operatorName}_${operatorCode}`;
          if (!machineEntry.operators.has(operatorKey)) {
            machineEntry.operators.set(operatorKey, { operatorName, operatorCode, runtime: 0, units: 0, scrap: 0, efficiency: 0, shifts: [] });
          }
          
          const machineOperatorData = machineEntry.operators.get(operatorKey)!;
          machineOperatorData.runtime += timeSpent;
          machineOperatorData.units += units;
          machineOperatorData.scrap += scrap;
          machineOperatorData.shifts.push({ date: record.shift_date, shiftType: record.shift_type, sku, units, runtime: timeSpent, scrap, rate: entryActualRate, efficiency });

          if (!operatorData.has(operatorKey)) {
            operatorData.set(operatorKey, {
              operatorName, operatorCode, totalRuntime: 0, totalUnits: 0, totalScrap: 0,
              efficiencySum: 0, efficiencyCount: 0, machines: new Set(),
              machineBreakdown: new Map(), dailyBreakdown: new Map(),
            });
          }

          const globalOperatorData = operatorData.get(operatorKey)!;
          globalOperatorData.totalRuntime += timeSpent;
          globalOperatorData.totalUnits += units;
          globalOperatorData.totalScrap += scrap;
          globalOperatorData.efficiencySum += efficiency;
          globalOperatorData.efficiencyCount += 1;
          globalOperatorData.machines.add(machine);

          if (!globalOperatorData.machineBreakdown.has(machine)) {
            globalOperatorData.machineBreakdown.set(machine, { runtime: 0, units: 0, scrap: 0, efficiency: 0 });
          }
          const operatorMachineData = globalOperatorData.machineBreakdown.get(machine)!;
          operatorMachineData.runtime += timeSpent;
          operatorMachineData.units += units;
          operatorMachineData.scrap += scrap;
          const opTargetRate = getMachineTargetRate(machine, targetRates);
          const opGoodUnits = operatorMachineData.units - operatorMachineData.scrap;
          const opActualRate = operatorMachineData.runtime > 0 ? opGoodUnits / operatorMachineData.runtime : 0;
          operatorMachineData.efficiency = opTargetRate > 0 ? (opActualRate / opTargetRate) * 100 : 0;

          if (!globalOperatorData.dailyBreakdown.has(record.shift_date)) {
            globalOperatorData.dailyBreakdown.set(record.shift_date, { shifts: new Set(), totalUnits: 0, totalRuntime: 0, machines: new Set() });
          }
          const dailyData = globalOperatorData.dailyBreakdown.get(record.shift_date)!;
          dailyData.shifts.add(record.shift_type);
          dailyData.totalUnits += units;
          dailyData.totalRuntime += timeSpent;
          dailyData.machines.add(machine);

          if (!machineEntry.skus.has(sku)) {
            machineEntry.skus.set(sku, { sku, units: 0, runtime: 0, scrap: 0, rate: 0 });
          }
          const skuData = machineEntry.skus.get(sku)!;
          skuData.units += units;
          skuData.runtime += timeSpent;
          skuData.scrap += scrap;
        };

        shiftData.forEach((record: any) => {
          const operatorName = record.operators?.operator_name?.trim() || record.operators?.operator_code || 'Unknown';
          const operatorCode = record.operators?.operator_code || 'N/A';
          
          if (record.production_data?.activities) {
            const activities = record.production_data.activities;
            
            if (Array.isArray(activities)) {
              activities.forEach((activity: any) => {
                const activityType = activity.name;
                const rawMachine = MACHINE_MAPPING[activityType] || activityType;
                const machine = formatMachineDisplay(rawMachine);
                const machineEntry = machineData.get(rawMachine);
                
                if (machineEntry && activity.entries && Array.isArray(activity.entries)) {
                  activity.entries.forEach((entry: any) => {
                    const units = parseInt(entry.units_produced) || 0;
                    const timeSpent = parseFloat(entry.time_spent) || 0;
                    const scrap = parseInt(entry.scrap) || 0;
                    const sku = entry.sku || 'Unknown';
                    
                    if (units > 0 && sku !== 'Unknown') {
                      processActivityEntry(record, machineEntry, machine, activityType, entry, units, timeSpent, scrap, sku, operatorName, operatorCode, detailedRecords);
                    }
                  });
                }
              });
            } else {
              Object.entries(activities).forEach(([activityType, activityArray]: [string, any]) => {
                const rawMachine = MACHINE_MAPPING[activityType] || activityType;
                const machine = formatMachineDisplay(rawMachine);
                const machineEntry = machineData.get(rawMachine);
                
                if (machineEntry && Array.isArray(activityArray)) {
                  activityArray.forEach((activity: any) => {
                    const units = parseInt(activity.units_produced) || 0;
                    const timeSpent = parseFloat(activity.time_spent) || 0;
                    const scrap = parseInt(activity.Scrap || activity.scrap) || 0;
                    const sku = activity.sku || activity.SKU || 'Unknown';
                    
                    if (units > 0 && sku !== 'Unknown') {
                      processActivityEntry(record, machineEntry, machine, activityType, activity, units, timeSpent, scrap, sku, operatorName, operatorCode, detailedRecords);
                    }
                  });
                }
              });
            }
          }
        });

        // Calculate derived metrics
        const machines: WeeklyMachineData[] = Array.from(machineData.entries()).map(([machine, data]) => {
          const targetRate = getMachineTargetRate(machine, targetRates);
          const goodUnits = data.totalUnits - data.totalScrap;
          const actualRate = data.totalRuntime > 0 ? goodUnits / data.totalRuntime : 0;
          const efficiency = targetRate > 0 ? (actualRate / targetRate) * 100 : 0;
          const utilization = (data.totalRuntime / 168) * 100;

          const operators = Array.from(data.operators.values()).map(operator => {
            const operatorGoodUnits = operator.units - operator.scrap;
            const operatorRate = operator.runtime > 0 ? operatorGoodUnits / operator.runtime : 0;
            const operatorEfficiency = targetRate > 0 ? (operatorRate / targetRate) * 100 : 0;
            return { ...operator, efficiency: operatorEfficiency };
          });

          const skus = Array.from(data.skus.values()).map(sku => ({
            ...sku, rate: sku.runtime > 0 ? sku.units / sku.runtime : 0,
          }));

          return {
            machine, totalRuntime: data.totalRuntime, totalUnits: data.totalUnits, totalScrap: data.totalScrap,
            utilization: Math.min(utilization, 100), efficiency: Math.min(efficiency, 200), operators, skus,
          };
        });

        // Add inactive machines
        const allMachinesList = machinesResult.data || [];
        const completesMachineData: WeeklyMachineData[] = [];
        const activeMachineNormalized = new Set<string>();

        const normalizeMachineName = (name: string): string => {
          return name.toLowerCase().replace(/\s+/g, '').replace(/machine/gi, '').replace(/welding/gi, 'welder').replace(/autowelding/gi, 'autowelder').trim();
        };

        machines.forEach(machine => {
          activeMachineNormalized.add(normalizeMachineName(machine.machine));
          completesMachineData.push(machine);
        });

        allMachinesList.forEach(machine => {
          const normalized = normalizeMachineName(machine.machine_name);
          if (!activeMachineNormalized.has(normalized)) {
            completesMachineData.push({
              machine: machine.machine_name, totalRuntime: 0, totalUnits: 0, totalScrap: 0,
              utilization: 0, efficiency: 0, operators: [], skus: [],
            });
          }
        });

        // Build operators data
        const operators: WeeklyOperatorData[] = Array.from(operatorData.values()).map(op => {
          const goodUnits = op.totalUnits - op.totalScrap;
          const actualRate = op.totalRuntime > 0 ? goodUnits / op.totalRuntime : 0;
          
          let weightedTargetSum = 0;
          let totalWeight = 0;
          op.machineBreakdown.forEach((machineData, machine) => {
            const targetRate = getMachineTargetRate(machine, targetRates);
            weightedTargetSum += targetRate * machineData.runtime;
            totalWeight += machineData.runtime;
          });
          const weightedTargetRate = totalWeight > 0 ? weightedTargetSum / totalWeight : 200;
          const overallEfficiency = weightedTargetRate > 0 ? (actualRate / weightedTargetRate) * 100 : 0;
          
          return {
            operatorName: op.operatorName, operatorCode: op.operatorCode,
            totalRuntime: op.totalRuntime, totalUnits: op.totalUnits, totalScrap: op.totalScrap,
            averageEfficiency: overallEfficiency, machines: Array.from(op.machines),
            machineBreakdown: Object.fromEntries(Array.from(op.machineBreakdown.entries())),
            dailyBreakdown: Object.fromEntries(
              Array.from(op.dailyBreakdown.entries()).map(([date, data]) => [
                date, { shifts: Array.from(data.shifts), totalUnits: data.totalUnits, totalRuntime: data.totalRuntime, machines: Array.from(data.machines) }
              ])
            ),
          };
        }).sort((a, b) => b.totalUnits - a.totalUnits);

        // Summary
        const totalProduction = completesMachineData.reduce((sum, m) => sum + m.totalUnits, 0);
        const totalRuntime = completesMachineData.reduce((sum, m) => sum + m.totalRuntime, 0);
        const operatorsWorked = operatorData.size;
        const machinesUtilized = completesMachineData.filter(m => m.totalUnits > 0).length;
        const skusProduced = new Set(detailedRecords.map(r => r.sku)).size;
        const activeMachinesForEfficiency = completesMachineData.filter(m => m.totalUnits > 0);
        const overallEfficiency = activeMachinesForEfficiency.length > 0 ? activeMachinesForEfficiency.reduce((sum, m) => sum + m.efficiency, 0) / activeMachinesForEfficiency.length : 0;

        return {
          weekStart: format(weekStart, 'yyyy-MM-dd'),
          weekEnd: format(weekEnd, 'yyyy-MM-dd'),
          summary: { totalProduction, totalRuntime, operatorsWorked, machinesUtilized, skusProduced, overallEfficiency },
          previousWeekSummary,
          totalOperators,
          totalMachines,
          machines: completesMachineData,
          operators,
          detailedRecords,
        };
      } catch (error) {
        console.error('Error in useWeeklyBreakdown:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};
