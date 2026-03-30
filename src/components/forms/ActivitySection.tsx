import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { ActivityEntry } from './ActivityEntry';
import { ShiftFormData, Product, Operator, Machine } from './shift-form-types';

interface ActivitySectionProps {
  form: UseFormReturn<ShiftFormData>;
  products: Product[];
  machines: Machine[];
  invoiceNumbers: string[];
  loadingProducts: boolean;
  loadingInvoices: boolean;
  loadingMachines: boolean;
  autoPopulatedFields: Set<string>;
  allowManualOverride: boolean;
  selectedOperator: Operator | undefined;
  printedLabelsQuery: any;
  onUnitsProducedChange: (value: number, activityIndex: number, entryIndex: number) => void;
  onFieldChangeWithTimeCheck: (fieldName: string, value: any, activityIndex: number, entryIndex: number) => void;
  onPopulateFromPrintedLabels: () => void;
  onRemoveAutoPopulatedFlag: (activityIndex: number, entryIndex: number, fieldName: string) => void;
  getFilteredInvoicesForSku: (sku: string) => string[];
}

export function ActivitySection({
  form,
  products,
  machines,
  invoiceNumbers,
  loadingProducts,
  loadingInvoices,
  loadingMachines,
  autoPopulatedFields,
  allowManualOverride,
  selectedOperator,
  printedLabelsQuery,
  onUnitsProducedChange,
  onFieldChangeWithTimeCheck,
  onPopulateFromPrintedLabels,
  onRemoveAutoPopulatedFlag,
  getFilteredInvoicesForSku
}: ActivitySectionProps) {
  const watchedActivities = form.watch('activities');

  const handleRemoveEntry = (activityIndex: number, entryIndex: number) => {
    const activity = watchedActivities[activityIndex];
    const newEntries = [...activity.entries];
    newEntries.splice(entryIndex, 1);
    
    if (newEntries.length === 0) {
      newEntries.push({
        units_produced: undefined,
        scrap: undefined,
        sku: undefined,
      time_spent: undefined,
      invoice_number: undefined,
      boxes_complete: undefined,
      machine_id: undefined,
      downtime_duration: undefined,
      downtime_reason: undefined,
      downtime_description: undefined
      });
    }
    
    form.setValue(`activities.${activityIndex}.entries`, newEntries);
  };

  const handleAddEntry = (activityIndex: number) => {
    const newEntry = {
      units_produced: undefined,
      scrap: undefined,
      sku: undefined,
      time_spent: undefined,
      invoice_number: undefined,
      boxes_complete: undefined,
      machine_id: undefined,
      downtime_duration: undefined,
      downtime_reason: undefined,
      downtime_description: undefined
    };
    
    const currentEntries = form.getValues(`activities.${activityIndex}.entries`);
    form.setValue(`activities.${activityIndex}.entries`, [...currentEntries, newEntry]);
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-primary/5 via-background to-secondary/5 rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-primary">Activities</h3>
        <Button
          type="button"
          variant="default"
          size="lg"
          onClick={onPopulateFromPrintedLabels}
          disabled={!selectedOperator || !form.watch('date') || printedLabelsQuery.isLoading}
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <RefreshCw className="w-5 h-5" />
          Load laser data
        </Button>
      </div>
      
      {/* Loading state */}
      {printedLabelsQuery.isLoading && selectedOperator && form.watch('date') && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-sm text-blue-800 font-medium">
            Loading printed labels for {selectedOperator.operator_name} on {form.watch('date')}...
          </div>
        </div>
      )}
      
      {/* Success state */}
      {printedLabelsQuery.data && printedLabelsQuery.data.length > 0 && !printedLabelsQuery.isLoading && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="text-sm text-green-800 font-medium">
            ✓ Found {printedLabelsQuery.data.length} printed labels for {selectedOperator?.operator_name} on {form.watch('date')}
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {printedLabelsQuery.data && printedLabelsQuery.data.length === 0 && !printedLabelsQuery.isLoading && selectedOperator && form.watch('date') && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
          <div className="text-sm text-gray-600">
            No printed labels found for {selectedOperator.operator_name} on {form.watch('date')}
          </div>
        </div>
      )}
      
      {watchedActivities.map((activity, activityIndex) => (
        <Card key={activityIndex} className="p-6 bg-gradient-to-r from-card to-card/80 border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow duration-200">
          <h4 className="font-semibold text-lg mb-6 text-primary/90 flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            {activity.name} Activity
          </h4>
          
          {activity.entries.map((entry, entryIndex) => (
                      <ActivityEntry
                        key={entryIndex}
                        activityName={activity.name}
                        activityIndex={activityIndex}
                        entryIndex={entryIndex}
                        entry={entry}
                        form={form}
                        products={products}
                        machines={machines}
                        invoiceNumbers={invoiceNumbers}
                        loadingProducts={loadingProducts}
                        loadingInvoices={loadingInvoices}
                        loadingMachines={loadingMachines}
                        autoPopulatedFields={autoPopulatedFields}
                        allowManualOverride={allowManualOverride}
                        onUnitsProducedChange={onUnitsProducedChange}
                        onFieldChangeWithTimeCheck={onFieldChangeWithTimeCheck}
                        onRemoveEntry={handleRemoveEntry}
                        onRemoveAutoPopulatedFlag={onRemoveAutoPopulatedFlag}
                        getFilteredInvoicesForSku={getFilteredInvoicesForSku}
                      />
          ))}

          {/* Add Entry Button */}
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => handleAddEntry(activityIndex)} 
            className="mt-4 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary hover:scale-105 transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </Button>
        </Card>
      ))}
    </div>
  );
}