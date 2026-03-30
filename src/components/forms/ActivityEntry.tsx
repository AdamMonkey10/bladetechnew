import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { ShiftFormData, Product, ActivityEntry as ActivityEntryType, Machine } from './shift-form-types';
import { NumericTextField } from './NumericTextField';

interface ActivityEntryProps {
  activityName: string;
  activityIndex: number;
  entryIndex: number;
  entry: ActivityEntryType;
  form: UseFormReturn<ShiftFormData>;
  products: Product[];
  machines: Machine[];
  invoiceNumbers: string[];
  loadingProducts: boolean;
  loadingInvoices: boolean;
  loadingMachines: boolean;
  autoPopulatedFields: Set<string>;
  allowManualOverride: boolean;
  onUnitsProducedChange: (value: number, activityIndex: number, entryIndex: number) => void;
  onFieldChangeWithTimeCheck: (fieldName: string, value: any, activityIndex: number, entryIndex: number) => void;
  onRemoveEntry: (activityIndex: number, entryIndex: number) => void;
  onRemoveAutoPopulatedFlag: (activityIndex: number, entryIndex: number, fieldName: string) => void;
  getFilteredInvoicesForSku: (sku: string) => string[];
}

export function ActivityEntry({
  activityName,
  activityIndex,
  entryIndex,
  entry,
  form,
  products,
  machines,
  invoiceNumbers,
  loadingProducts,
  loadingInvoices,
  loadingMachines,
  autoPopulatedFields,
  allowManualOverride,
  onUnitsProducedChange,
  onFieldChangeWithTimeCheck,
  onRemoveEntry,
  onRemoveAutoPopulatedFlag,
  getFilteredInvoicesForSku
}: ActivityEntryProps) {
  const isLaserActivity = ['Laser1', 'Laser2', 'Laser3'].includes(activityName);
  
  // Local state for time spent input to handle decimal typing
  const [timeSpentDisplay, setTimeSpentDisplay] = useState<string>(entry.time_spent?.toString() || '');
  
  // Update local display state when form entry changes
  useEffect(() => {
    setTimeSpentDisplay(entry.time_spent?.toString() || '');
  }, [entry.time_spent]);
  
  const downtimeReasons = [
    'Machine Breakdown',
    'Material Shortage',
    'Quality Issue',
    'Setup/Changeover',
    'Maintenance',
    'Waiting for Instructions',
    'Training',
    'Other'
  ];
  
  const isFieldAutoPopulated = (fieldName: string): boolean => {
    return autoPopulatedFields.has(`${activityIndex}-${entryIndex}-${fieldName}`);
  };

  // Get filtered invoices for the current SKU
  const filteredInvoices = entry.sku ? getFilteredInvoicesForSku(entry.sku) : [];

  const isBoxesCompleteCalculated = (unitsProduced: number, sku: string, boxesComplete: number): boolean => {
    if (!unitsProduced || !sku || !boxesComplete) return false;
    
    const product = products.find(p => p.product_code === sku);
    if (!product || !product.box_amount) return false;
    
    const calculated = Math.floor(unitsProduced / product.box_amount);
    return calculated === boxesComplete;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-7 gap-4 mb-4 p-4 border rounded">
      {/* Units Produced */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          Units Produced
          {isFieldAutoPopulated('units_produced') && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Auto</span>
          )}
        </Label>
        <Input 
          type="number" 
          min="0" 
          value={entry.units_produced || ''} 
          onChange={e => {
            const value = parseInt(e.target.value) || 0;
            form.setValue(`activities.${activityIndex}.entries.${entryIndex}.units_produced`, value);
            onRemoveAutoPopulatedFlag(activityIndex, entryIndex, 'units_produced');
          }}
          onBlur={e => {
            const value = parseInt(e.target.value) || 0;
            if (value > 9999) {
              // Still check for high values warning
              onUnitsProducedChange(value, activityIndex, entryIndex);
            } else {
              // Trigger time spent check on blur
              setTimeout(() => {
                onFieldChangeWithTimeCheck('units_produced', value, activityIndex, entryIndex);
              }, 100);
            }
          }}
          onKeyPress={e => {
            if (e.key === 'Enter') {
              const value = parseInt(e.currentTarget.value) || 0;
              if (value > 9999) {
                onUnitsProducedChange(value, activityIndex, entryIndex);
              } else {
                setTimeout(() => {
                  onFieldChangeWithTimeCheck('units_produced', value, activityIndex, entryIndex);
                }, 100);
              }
            }
          }}
        />
      </div>

      {/* Scrap (only for Laser activities) */}
      {isLaserActivity && (
        <div className="space-y-2">
          <Label>Scrap</Label>
          <Input 
            type="number" 
            min="0" 
            value={entry.scrap || ''} 
            onChange={e => {
              const value = parseInt(e.target.value) || 0;
              onFieldChangeWithTimeCheck('scrap', value, activityIndex, entryIndex);
            }} 
          />
        </div>
      )}

      {/* SKU */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          SKU
          {isFieldAutoPopulated('sku') && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Auto</span>
          )}
        </Label>
        <Select 
          value={entry.sku || ''} 
          onValueChange={value => {
            onFieldChangeWithTimeCheck('sku', value, activityIndex, entryIndex);
            onRemoveAutoPopulatedFlag(activityIndex, entryIndex, 'sku');
          }} 
          disabled={loadingProducts}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingProducts ? "Loading..." : "Select SKU"} />
          </SelectTrigger>
          <SelectContent>
            {products.map(product => (
              <SelectItem key={product.id} value={product.product_code}>
                {product.product_code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Time Spent */}
      <div className="space-y-2">
        <Label>Time Spent (hrs)</Label>
        <Input 
          type="text"
          inputMode="decimal"
          pattern="[0-9.]*"
          value={timeSpentDisplay} 
          onChange={e => {
            const value = e.target.value;
            
            // Allow empty or valid decimal numbers including partial decimals
            if (value === '' || /^\d*\.?\d*$/.test(value)) {
              setTimeSpentDisplay(value);
              
              if (value === '') {
                form.setValue(`activities.${activityIndex}.entries.${entryIndex}.time_spent`, undefined);
              } else if (!value.endsWith('.') && !isNaN(parseFloat(value))) {
                form.setValue(`activities.${activityIndex}.entries.${entryIndex}.time_spent`, parseFloat(value));
              }
            }
          }}
          onBlur={() => {
            // Ensure we have a proper number value on blur
            if (timeSpentDisplay && !timeSpentDisplay.endsWith('.')) {
              const numValue = parseFloat(timeSpentDisplay);
              if (!isNaN(numValue)) {
                form.setValue(`activities.${activityIndex}.entries.${entryIndex}.time_spent`, numValue);
                onFieldChangeWithTimeCheck('time_spent', numValue, activityIndex, entryIndex);
              }
            }
          }}
          className="h-12 text-lg"
        />
      </div>

      {/* Invoice Number */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          Invoice Number
          {isFieldAutoPopulated('invoice_number') && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Auto</span>
          )}
        </Label>
        <Select 
          value={entry.invoice_number || ''} 
          onValueChange={value => {
            onFieldChangeWithTimeCheck('invoice_number', value, activityIndex, entryIndex);
            onRemoveAutoPopulatedFlag(activityIndex, entryIndex, 'invoice_number');
          }} 
          disabled={loadingInvoices || !entry.sku || (isLaserActivity && !allowManualOverride && isFieldAutoPopulated('invoice_number'))}
        >
          <SelectTrigger>
            <SelectValue placeholder={
              loadingInvoices ? "Loading..." : 
              !entry.sku ? "Select SKU first" : 
              filteredInvoices.length === 0 ? "No open invoices for this SKU" :
              "Select Invoice"
            } />
          </SelectTrigger>
          <SelectContent>
            {filteredInvoices.map(invoice => (
              <SelectItem key={invoice} value={invoice}>
                {invoice}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Boxes Complete (only for Laser activities) */}
      {isLaserActivity && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Boxes Complete
            {isFieldAutoPopulated('boxes_complete') && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Auto</span>
            )}
          </Label>
          <Input 
            type="number" 
            min="0" 
            value={entry.boxes_complete || ''} 
            onChange={e => {
              const value = parseInt(e.target.value) || 0;
              onFieldChangeWithTimeCheck('boxes_complete', value, activityIndex, entryIndex);
              onRemoveAutoPopulatedFlag(activityIndex, entryIndex, 'boxes_complete');
            }}
            disabled={!allowManualOverride && isFieldAutoPopulated('boxes_complete')}
          />
          {entry.units_produced && entry.sku && entry.boxes_complete && 
           isBoxesCompleteCalculated(entry.units_produced, entry.sku, entry.boxes_complete) && (
            <p className="text-xs text-muted-foreground">
              ✓ Auto-calculated ({entry.units_produced} ÷ {products.find(p => p.product_code === entry.sku)?.box_amount || '?'})
            </p>
          )}
        </div>
      )}

      {/* Remove Entry Button */}
      <div className="flex items-end">
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => onRemoveEntry(activityIndex, entryIndex)}
          disabled={form.watch(`activities.${activityIndex}.entries`).length === 1}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Downtime Section */}
      <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 border rounded-lg bg-muted/20">
        <div className="space-y-2">
          <Label>Downtime (hours)</Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            value={entry.downtime_duration || ''}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || undefined;
              onFieldChangeWithTimeCheck('downtime_duration', value, activityIndex, entryIndex);
            }}
            placeholder="0.0"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Downtime Reason</Label>
          <Select
            value={entry.downtime_reason || ''}
            onValueChange={(value) => onFieldChangeWithTimeCheck('downtime_reason', value, activityIndex, entryIndex)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select reason" />
            </SelectTrigger>
            <SelectContent>
              {downtimeReasons.map(reason => (
                <SelectItem key={reason} value={reason}>
                  {reason}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}