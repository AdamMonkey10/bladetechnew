import { useState } from 'react';
import { useWeeklyBreakdown } from '@/hooks/useWeeklyBreakdown';
import { WeekSelector } from './WeekSelector';
import { WeeklyBreakdownSummaryCards } from './WeeklyBreakdownSummaryCards';
import { EmployeesList } from './EmployeesList';
import { MachinesList } from './MachinesList';
import { SKUsList } from './SKUsList';
import { SKUProductionDialog } from './SKUProductionDialog';
import { EmployeeProductionDialog } from './EmployeeProductionDialog';
import { WeeklyTrendCharts } from './WeeklyTrendCharts';
import { Button } from '@/components/ui/button';
import { Loader2, FileText } from 'lucide-react';
import { subWeeks } from 'date-fns';

interface WeeklyBreakdownLandingProps {
  onViewDetailed?: () => void;
}

export function WeeklyBreakdownLanding({ onViewDetailed }: WeeklyBreakdownLandingProps) {
  const [selectedWeek, setSelectedWeek] = useState(subWeeks(new Date(), 1));
  const [isSingleDay, setIsSingleDay] = useState(false);
  const [selectedSKU, setSelectedSKU] = useState<string | null>(null);
  const [skuDialogOpen, setSkuDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  
  const { data, isLoading, error } = useWeeklyBreakdown({
    weekStartDate: selectedWeek,
    singleDay: isSingleDay,
  });

  // Aggregate SKU data from all machines
  const aggregateSKUs = () => {
    if (!data?.machines) return [];
    
    const skuMap = new Map<string, {
      sku: string;
      totalUnits: number;
      totalRuntime: number;
      machines: Set<string>;
    }>();

    data.machines.forEach((machine) => {
      machine.skus?.forEach((sku) => {
        const existing = skuMap.get(sku.sku) || {
          sku: sku.sku,
          totalUnits: 0,
          totalRuntime: 0,
          machines: new Set(),
        };
        existing.totalUnits += sku.units;
        existing.totalRuntime += sku.runtime;
        existing.machines.add(machine.machine);
        skuMap.set(sku.sku, existing);
      });
    });

    return Array.from(skuMap.values()).map((sku) => ({
      ...sku,
      machines: Array.from(sku.machines),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading weekly breakdown...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error loading weekly breakdown</p>
        <p className="text-sm text-muted-foreground mt-2">Please try again later</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const skuData = aggregateSKUs();

  return (
    <div className="space-y-6">
      {/* Header with Week Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Weekly Production Breakdown</h1>
          <p className="text-muted-foreground">Overview of employees, machines, and SKUs</p>
        </div>
        
        {onViewDetailed && (
          <Button onClick={onViewDetailed} variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            View Detailed Analysis
          </Button>
        )}
      </div>

      {/* Week Selector */}
      <WeekSelector 
        selectedWeek={selectedWeek} 
        onWeekChange={(date, singleDay) => {
          setSelectedWeek(date);
          setIsSingleDay(singleDay || false);
        }} 
      />

      {/* Summary Cards with WoW comparison */}
      <WeeklyBreakdownSummaryCards 
        summary={data.summary} 
        previousWeekSummary={data.previousWeekSummary}
        totalOperators={data.totalOperators}
        totalMachines={data.totalMachines}
      />

      {/* Two Column Layout for better readability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MachinesList machines={data.machines} />
        <EmployeesList 
          employees={data.operators}
          onEmployeeClick={(employee) => {
            setSelectedEmployee(employee.operatorName);
            setEmployeeDialogOpen(true);
          }}
        />
      </div>

      {/* SKUs full width */}
      <SKUsList 
        skus={skuData} 
        onSKUClick={(sku) => {
          setSelectedSKU(sku.sku);
          setSkuDialogOpen(true);
        }}
      />

      {/* Weekly Trend Charts */}
      <WeeklyTrendCharts />

      {/* SKU Production Dialog */}
      <SKUProductionDialog
        sku={selectedSKU}
        open={skuDialogOpen}
        onOpenChange={setSkuDialogOpen}
      />

      {/* Employee Production Dialog */}
      <EmployeeProductionDialog
        employeeName={selectedEmployee}
        open={employeeDialogOpen}
        onOpenChange={setEmployeeDialogOpen}
      />
    </div>
  );
}
