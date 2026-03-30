import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { validateShiftFormData, calculateShiftDate } from '@/utils/dataValidation';
import { ValidationSummary } from './ValidationSummary';

import { usePrintedLabelsByOperatorDate } from '@/hooks/usePrintedLabels';
import { useClockStatus } from '@/hooks/useClockStatus';
import { useOperatorTimeEvents, calculateShiftTimes } from '@/hooks/useClockfyIntegration';
import { useCustomerPOs } from '@/hooks/useCustomerPOs';
import { useOptimizedCustomerPOs } from '@/hooks/useOptimizedQueries';
import { useReferenceData } from '@/hooks/useReferenceData';
import { 
  ACTIVITY_TYPES, 
  shiftFormSchema, 
  ShiftFormData, 
  ShiftFormProps, 
  Operator, 
  Machine, 
  Product, 
  LaserTimeEntry 
} from './shift-form-types';
import { TimeSpentDialog } from './TimeSpentDialog';
import { ActivitySection } from './ActivitySection';
import { ShiftFormFields } from './ShiftFormFields';
import { Badge } from '@/components/ui/badge';

export function ShiftForm({
  onSuccess,
  preselectedOperator,
  preselectedDate
}: ShiftFormProps) {
  // Use optimized reference data hooks
  const { operators, machines, products, isLoading: referenceLoading } = useReferenceData();
  const [invoiceNumbers, setInvoiceNumbers] = useState<string[]>([]);
  
  // Get customer POs for filtering invoices
  const { pos: customerPOs } = useCustomerPOs();
  const { data: optimizedCustomerPOs } = useOptimizedCustomerPOs();
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [loading, setLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState('');
  const [openMaxUnitsDialog, setOpenMaxUnitsDialog] = useState(false);
  const [openTimeSpentDialog, setOpenTimeSpentDialog] = useState(false);
  const [laserTimeEntries, setLaserTimeEntries] = useState<LaserTimeEntry[]>([]);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  
  // This will be initialized after form is created
  const [autoPopulatedFields, setAutoPopulatedFields] = useState<Set<string>>(new Set());
  const [allowManualOverride, setAllowManualOverride] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Initialize form with default activities
  const initialActivities = ACTIVITY_TYPES.map(name => ({
    name,
    entries: [{
        units_produced: undefined,
        scrap: name === 'Laser1' || name === 'Laser2' || name === 'Laser3' ? undefined : undefined,
        sku: undefined,
        time_spent: undefined,
        invoice_number: undefined,
        boxes_complete: name === 'Laser1' || name === 'Laser2' || name === 'Laser3' ? undefined : undefined,
        machine_id: undefined,
        downtime_duration: undefined,
        downtime_reason: undefined
    }]
  }));

  const form = useForm<ShiftFormData>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      date: preselectedDate || new Date().toISOString().split('T')[0],
      shift: 'Days',
      operator: preselectedOperator?.id || '',
      timeStart: '07:00',
      timeFinish: '17:00',
      activities: initialActivities
    }
  });

  // Get clock status for the selected operator
  const selectedOperatorId = preselectedOperator?.id || form.watch('operator');
  const { status: clockStatus } = useClockStatus(selectedOperatorId);
  
  // Get Clockfy time events for the selected date and operator
  const clockfyTimeEvents = useOperatorTimeEvents(selectedOperatorId, form.watch('date'));
  
  // Real-time validation (after form is initialized)
  const currentFormData = form.watch();
  const validationResult = validateShiftFormData(currentFormData as any);

  // Auto-populate start time based on Clockfy data (preferred) or legacy clock data
  useEffect(() => {
    const timeEvents = clockfyTimeEvents.data || [];
    
    console.log('Clockfy time events for operator:', selectedOperatorId, 'date:', form.watch('date'), 'events:', timeEvents);
    
    if (timeEvents.length > 0) {
      // Use Clockfy data if available
      const shiftTimes = calculateShiftTimes(timeEvents);
      if (shiftTimes) {
        console.log('Using Clockfy data for shift times:', shiftTimes);
        form.setValue('timeStart', shiftTimes.startTime);
        // Only set finish time if the operator has actually clocked out
        if (shiftTimes.endTime) {
          form.setValue('timeFinish', shiftTimes.endTime);
        }
        form.setValue('shift', shiftTimes.shiftType as 'Days' | 'Nights');
        
        // Show toast to indicate auto-population
        toast({
          title: 'Clockfy time auto-populated',
          description: `${shiftTimes.startTime}${shiftTimes.endTime ? ` - ${shiftTimes.endTime}` : ' (currently working)'}`,
        });
      }
    } else if (clockStatus?.isActive && clockStatus.clockIn) {
      // Fallback to legacy clock data
      const clockInTime = new Date(clockStatus.clockIn);
      
      console.log('Using legacy clock data:', clockStatus.clockIn);
      
      const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
      };
      
      const startTime = formatTime(clockInTime);
      form.setValue('timeStart', startTime);
      
      const localHour = clockInTime.getHours();
      form.setValue('shift', localHour < 12 ? 'Days' : 'Nights');
      
      toast({
        title: 'Legacy clock time auto-populated',
        description: `${startTime} (currently working)`,
      });
    } else {
      console.log('No time data available for operator:', selectedOperatorId);
    }
  }, [clockfyTimeEvents.data, clockStatus, form, toast, selectedOperatorId]);

  // Get printed labels for selected operator and date
  const selectedOperator = operators.find(op => op.id === form.watch('operator'));
  
  // Debug logging for operator and date selection
  const watchedDate = form.watch('date');
  const watchedOperatorId = form.watch('operator');
  
  console.log('ShiftForm Debug:', {
    selectedOperatorId: watchedOperatorId,
    selectedOperatorName: selectedOperator?.operator_name,
    selectedOperatorCode: selectedOperator?.operator_code,
    selectedDate: watchedDate,
    usingOperatorName: selectedOperator?.operator_name, // This is what we'll query with
    operatorsAvailable: operators.map(op => ({ id: op.id, name: op.operator_name, code: op.operator_code }))
  });
  
  const printedLabelsQuery = usePrintedLabelsByOperatorDate(
    selectedOperator?.operator_name, // Use operator_name instead of operator_code
    watchedDate
  );
  useEffect(() => {
    fetchInvoiceData();
  }, []);
  const fetchInvoiceData = async () => {
    try {
      const [goodsRes, printedLabelsRes, customerPOsRes] = await Promise.all([
        supabase.from('goods_received').select('reference_number').not('reference_number', 'is', null),
        supabase.from('printed_labels').select('invoice').not('invoice', 'is', null),
        supabase.from('customer_pos').select('po_number')
      ]);

      // Combine invoice numbers from multiple sources
      const invoiceSet = new Set<string>();
      
      // Add from goods_received reference numbers
      if (goodsRes.data) {
        goodsRes.data.forEach(g => {
          if (g.reference_number) invoiceSet.add(g.reference_number);
        });
      }
      
      // Add from printed_labels invoices
      if (printedLabelsRes.data) {
        printedLabelsRes.data.forEach(label => {
          if (label.invoice) invoiceSet.add(label.invoice);
        });
      }
      
      // Add from customer_pos PO numbers (often used as invoice references)
      if (customerPOsRes.data) {
        customerPOsRes.data.forEach(po => {
          if (po.po_number) invoiceSet.add(po.po_number);
        });
      }

      const invoices = Array.from(invoiceSet).sort();
      setInvoiceNumbers(invoices);

      if (goodsRes.error || printedLabelsRes.error || customerPOsRes.error) {
        setInvoicesError('Failed to load some invoice numbers');
      }

    } catch (error) {
      console.error('Error fetching invoice data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invoice data',
        variant: 'destructive'
      });
    } finally {
      setLoadingInvoices(false);
    }
  };
  // Utility functions
  const calculateHoursWorked = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    
    // For timezone-aware calculations, we need to combine date + time
    const date = form.watch('date');
    if (!date) return 0;
    
    try {
      // Create full timestamps in the user's timezone
      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(`${date}T${endTime}`);
      
      // Handle overnight shifts
      if (endDateTime < startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }
      
      const diffMs = endDateTime.getTime() - startDateTime.getTime();
      return diffMs / (1000 * 60 * 60); // Convert to hours
    } catch (error) {
      console.error('Error calculating hours worked:', error);
      return 0;
    }
  };

  const calculateHoursBooked = (activities: ShiftFormData['activities']): number => {
    return activities.reduce((total, activity) => {
      return total + activity.entries.reduce((entryTotal, entry) => {
        return entryTotal + (entry.time_spent || 0);
      }, 0);
    }, 0);
  };
  // Function to get filtered invoice numbers for a specific SKU
  const getFilteredInvoicesForSku = (sku: string): string[] => {
    if (!sku || !customerPOs.length) return [];
    
    return customerPOs
      .filter(po => !po.status) // Only open POs (status = false means open)
      .filter(po => po.items.some(item => item.sku === sku)) // Only POs that contain the selected SKU
      .map(po => po.po_number);
  };

  const checkTimeSpentRequired = (activityIndex: number, entryIndex: number, fieldName: string, value: any) => {
    const entry = form.watch(`activities.${activityIndex}.entries.${entryIndex}`);
    const activity = form.watch(`activities.${activityIndex}`);

    // If Time Spent is already filled, no need to prompt
    if (entry.time_spent && entry.time_spent > 0) {
      return;
    }

    // Check if this field change makes the entry have data
    const updatedEntry = {
      ...entry,
      [fieldName]: value
    };
    const isAnyFieldFilled = updatedEntry.units_produced && updatedEntry.units_produced > 0 || updatedEntry.scrap && updatedEntry.scrap > 0 || updatedEntry.sku || updatedEntry.invoice_number || updatedEntry.boxes_complete && updatedEntry.boxes_complete > 0;

    // For now, don't auto-trigger time spent dialog for individual entries
    // We'll handle this through the mass populate function
  };
  const calculateBoxesComplete = (unitsProduced: number, sku: string): number | null => {
    if (!unitsProduced || !sku) return null;
    
    const product = products.find(p => p.product_code === sku);
    if (!product || !product.box_amount) return null;
    
    return Math.floor(unitsProduced / product.box_amount);
  };

  const handleUnitsProducedChange = (value: number, activityIndex: number, entryIndex: number) => {
    if (value > 9999) {
      setOpenMaxUnitsDialog(true);
    }
    form.setValue(`activities.${activityIndex}.entries.${entryIndex}.units_produced`, value);
    
    // Auto-calculate boxes complete for laser activities
    const activity = form.watch(`activities.${activityIndex}`);
    if (['Laser1', 'Laser2', 'Laser3'].includes(activity.name)) {
      const entry = form.watch(`activities.${activityIndex}.entries.${entryIndex}`);
      const boxesComplete = calculateBoxesComplete(value, entry.sku || '');
      if (boxesComplete !== null) {
        form.setValue(`activities.${activityIndex}.entries.${entryIndex}.boxes_complete`, boxesComplete);
      }
    }
    
    setTimeout(() => {
      checkTimeSpentRequired(activityIndex, entryIndex, 'units_produced', value);
    }, 100);
  };
  const handleFieldChangeWithTimeCheck = (fieldName: string, value: any, activityIndex: number, entryIndex: number) => {
    form.setValue(`activities.${activityIndex}.entries.${entryIndex}.${fieldName}` as any, value);
    
    // Auto-calculate boxes complete when SKU changes for laser activities
    if (fieldName === 'sku') {
      const activity = form.watch(`activities.${activityIndex}`);
      if (['Laser1', 'Laser2', 'Laser3'].includes(activity.name)) {
        const entry = form.watch(`activities.${activityIndex}.entries.${entryIndex}`);
        const boxesComplete = calculateBoxesComplete(entry.units_produced || 0, value);
        if (boxesComplete !== null) {
          form.setValue(`activities.${activityIndex}.entries.${entryIndex}.boxes_complete`, boxesComplete);
        }
      }
    }
    
    setTimeout(() => {
      checkTimeSpentRequired(activityIndex, entryIndex, fieldName, value);
    }, 100);
  };
  const handleLaserTimesSave = (entries: LaserTimeEntry[]) => {
    entries.forEach(entry => {
      form.setValue(`activities.${entry.activityIndex}.entries.${entry.entryIndex}.time_spent`, parseFloat(entry.timeSpent));
      if (entry.scrap) {
        form.setValue(`activities.${entry.activityIndex}.entries.${entry.entryIndex}.scrap`, parseInt(entry.scrap) || 0);
      }
    });

    toast({
      title: 'Time entries completed',
      description: `Saved time spent for ${entries.length} laser activities`,
    });
  };

  const populateFromPrintedLabels = () => {
    const printedLabels = printedLabelsQuery.data || [];
    
    console.log('populateFromPrintedLabels called:', {
      selectedOperator: selectedOperator?.operator_name,
      selectedOperatorCode: selectedOperator?.operator_code,
      selectedDate: form.watch('date'),
      printedLabelsCount: printedLabels.length,
      printedLabels: printedLabels
    });
    
    if (printedLabels.length === 0) {
      toast({
        title: 'No printed labels found',
        description: `No printed labels found for ${selectedOperator?.operator_name} on ${form.watch('date')}`,
        variant: 'default'
      });
      return;
    }

    // Group printed labels by laser, SKU, and invoice to create separate entries for each combination
    const groupedData = printedLabels.reduce((acc, label) => {
      const key = `${label.laser}-${label.sku}-${label.invoice || 'no-invoice'}`;
      if (!acc[key]) {
        acc[key] = {
          laser: label.laser,
          sku: label.sku,
          invoice: label.invoice || '',
          totalQuantity: 0,
          boxCount: 0
        };
      }
      acc[key].totalQuantity += label.quantity;
      acc[key].boxCount += 1;
      return acc;
    }, {} as Record<string, { laser: string, sku: string, invoice: string, totalQuantity: number, boxCount: number }>);

    const newAutoPopulatedFields = new Set<string>();

    // Map laser names to activity indices - handle both with and without spaces
    const laserToActivityMap: Record<string, number> = {
      'Laser1': 0, 'Laser2': 1, 'Laser3': 2,
      'Laser 1': 0, 'Laser 2': 1, 'Laser 3': 2  // Handle labels with spaces
    };

    // Clear existing entries in laser activities first
    ['Laser1', 'Laser2', 'Laser3'].forEach((laser, index) => {
        const emptyEntry = {
          units_produced: undefined,
          scrap: undefined,
          sku: undefined,
          time_spent: undefined,
          invoice_number: undefined,
          boxes_complete: undefined,
          machine_id: undefined,
          downtime_duration: undefined,
          downtime_reason: undefined
        };
      form.setValue(`activities.${index}.entries`, [emptyEntry]);
    });

    // Sort grouped data by laser to ensure consistent ordering
    const sortedEntries = Object.values(groupedData).sort((a, b) => {
      if (a.laser !== b.laser) return a.laser.localeCompare(b.laser);
      if (a.sku !== b.sku) return a.sku.localeCompare(b.sku);
      return a.invoice.localeCompare(b.invoice);
    });

    let currentActivityEntries: Record<number, number> = { 0: 0, 1: 0, 2: 0 }; // Track entry count per activity

    sortedEntries.forEach(({ laser, sku, invoice, totalQuantity }) => {
      const activityIndex = laserToActivityMap[laser];
      if (activityIndex === undefined) return;

      const entryIndex = currentActivityEntries[activityIndex];
      
      // If this is not the first entry for this activity, add a new entry
      if (entryIndex > 0) {
        const newEntry = {
          units_produced: undefined,
          scrap: undefined,
          sku: undefined,
          time_spent: undefined,
          invoice_number: undefined,
          boxes_complete: undefined,
          machine_id: undefined,
          downtime_duration: undefined,
          downtime_reason: undefined
        };
        const currentEntries = form.getValues(`activities.${activityIndex}.entries`);
        form.setValue(`activities.${activityIndex}.entries`, [...currentEntries, newEntry]);
      }

      // Populate the entry
      console.log('Populating entry:', { activityIndex, entryIndex, totalQuantity, sku, invoice });
      form.setValue(`activities.${activityIndex}.entries.${entryIndex}.units_produced`, totalQuantity);
      form.setValue(`activities.${activityIndex}.entries.${entryIndex}.sku`, sku);
      
      if (invoice) {
        form.setValue(`activities.${activityIndex}.entries.${entryIndex}.invoice_number`, invoice);
        console.log('Set invoice:', invoice, 'for activity', activityIndex, 'entry', entryIndex);
      }

      // Auto-calculate boxes complete
      const boxesComplete = calculateBoxesComplete(totalQuantity, sku);
      if (boxesComplete !== null) {
        form.setValue(`activities.${activityIndex}.entries.${entryIndex}.boxes_complete`, boxesComplete);
      }

      // Track auto-populated fields
      newAutoPopulatedFields.add(`${activityIndex}-${entryIndex}-units_produced`);
      newAutoPopulatedFields.add(`${activityIndex}-${entryIndex}-sku`);
      if (invoice) {
        newAutoPopulatedFields.add(`${activityIndex}-${entryIndex}-invoice_number`);
      }
      if (boxesComplete !== null) {
        newAutoPopulatedFields.add(`${activityIndex}-${entryIndex}-boxes_complete`);
      }

      currentActivityEntries[activityIndex]++;
    });

    setAutoPopulatedFields(newAutoPopulatedFields);
    
    // Create laser time entries for the dialog with invoice information
    const laserEntries: LaserTimeEntry[] = sortedEntries.map(({ laser, sku, totalQuantity, invoice }) => {
      const activityIndex = laserToActivityMap[laser];
      const entryIndex = 0;
      
      console.log('Creating laser entry:', { laser, sku, totalQuantity, invoice, activityIndex });
      
      return {
        laserName: laser,
        activityIndex,
        entryIndex,
        sku,
        unitsProduced: totalQuantity,
        timeSpent: '',
        scrap: '0',
        invoice: invoice || undefined // Include invoice information
      };
    }).filter(entry => entry.activityIndex !== undefined);

    console.log('Created laser time entries:', laserEntries);
    console.log('Current dialog state - openTimeSpentDialog:', openTimeSpentDialog);
    
    // Show time spent dialog for all lasers
    if (laserEntries.length > 0) {
      console.log('Setting laser time entries and opening dialog:', laserEntries);
      setLaserTimeEntries(laserEntries);
      setOpenTimeSpentDialog(true);
    } else {
      console.log('No laser entries created, not showing time dialog');
    }
    
    toast({
      title: 'Timesheet auto-populated from printed labels',
      description: `Created ${Object.keys(groupedData).length} entries. Please add time spent for each laser.`,
    });
  };

  const handleRemoveAutoPopulatedFlag = (activityIndex: number, entryIndex: number, fieldName: string) => {
    setAutoPopulatedFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(`${activityIndex}-${entryIndex}-${fieldName}`);
      return newSet;
    });
  };

  const onSubmit = async (data: ShiftFormData) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to save a timesheet',
        variant: 'destructive'
      });
      return;
    }

    // Validate data for common errors BEFORE submission
    const validation = validateShiftFormData({
      activities: data.activities.map(activity => ({
        name: activity.name,
        entries: activity.entries.map(entry => ({
          time_spent: entry.time_spent,
          units_produced: entry.units_produced,
          sku: entry.sku
        }))
      })),
      timeStart: data.timeStart,
      timeFinish: data.timeFinish
    });
    
    if (!validation.isValid) {
      toast({
        title: 'Data Validation Error',
        description: `Please fix the following errors: ${validation.errors.join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    // Show warnings if any (but don't block submission)
    if (validation.warnings.length > 0) {
      toast({
        title: 'Data Quality Warning',
        description: `Please review: ${validation.warnings.slice(0, 2).join(', ')}${validation.warnings.length > 2 ? '...' : ''}`,
        variant: 'default'
      });
    }

    setLoading(true);
    try {
      const hoursWorked = calculateHoursWorked(data.timeStart, data.timeFinish);
      const hoursBooked = calculateHoursBooked(data.activities);

      // Calculate time balance difference (but don't block submission)
      const timeBalanceDifference = hoursBooked - hoursWorked;
      
      // Show warning if there's a significant time difference
      if (Math.abs(timeBalanceDifference) > 0.25) {
        toast({
          title: 'Time Balance Notice',
          description: `Hours Worked (${hoursWorked.toFixed(2)}) and Hours Booked (${hoursBooked.toFixed(2)}) differ by ${Math.abs(timeBalanceDifference).toFixed(2)} hours. Timesheet will still be submitted.`,
          variant: 'default'
        });
      }

      // Calculate total production
      const totalPieces = data.activities.reduce((sum, activity) => sum + activity.entries.reduce((entrySum, entry) => entrySum + (entry.units_produced || 0), 0), 0);

      // Find operator details
      const selectedOperator = operators.find(op => op.id === data.operator);
      
      // Create timezone-aware timestamps
      const startTimestamp = new Date(`${data.date}T${data.timeStart}`).toISOString();
      let endTimestamp = new Date(`${data.date}T${data.timeFinish}`).toISOString();
      
      // Handle overnight shifts
      if (data.timeFinish < data.timeStart) {
        const endDate = new Date(`${data.date}T${data.timeFinish}`);
        endDate.setDate(endDate.getDate() + 1);
        endTimestamp = endDate.toISOString();
      }
      
      // Calculate correct shift_date based on shift type and business day
      const actualShiftDate = calculateShiftDate(data.date, data.timeStart, data.timeFinish, data.shift);
      
      const shiftRecord = {
        shift_date: actualShiftDate,
        shift_type: data.shift,
        operator_id: data.operator,
        user_id: user.id,
        start_time: startTimestamp,
        end_time: endTimestamp,
        notes: data.comments || null,
        production_data: {
          pieces_produced: totalPieces,
          hours_worked: hoursWorked,
          hours_booked: hoursBooked,
          time_balance_difference: timeBalanceDifference,
          activities: data.activities,
          operator_name: selectedOperator?.operator_name,
          operator_code: selectedOperator?.operator_code,
          uptime_downtime: []
        }
      };
      const {
        error
      } = await supabase.from('shift_records').insert([shiftRecord]);
      if (error) throw error;

      // Immediately update timesheet tracking to mark this as submitted
      await supabase.rpc('update_timesheet_tracking');

      toast({
        title: 'Success',
        description: 'Shift record saved successfully'
      });
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error saving shift record:', error);
      toast({
        title: 'Error',
        description: 'Failed to save shift record',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  // Computed values
  const watchedValues = form.watch();
  const hoursWorked = calculateHoursWorked(watchedValues.timeStart, watchedValues.timeFinish);
  const hoursBooked = calculateHoursBooked(watchedValues.activities);

  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl">
          {preselectedOperator ? `${preselectedOperator.operator_name} - Daily Timesheet` : 'Daily Timesheet'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Manual Override Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
            <div className="space-y-1">
              <Label htmlFor="manual-override" className="text-sm font-medium">
                Manual Override Mode
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable to manually edit invoice and boxes fields when they are auto-populated
              </p>
            </div>
            <Switch
              id="manual-override"
              checked={allowManualOverride}
              onCheckedChange={setAllowManualOverride}
            />
          </div>

          {/* Submit Button and Validation Check */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              type="button"
              onClick={() => setShowValidationSummary(!showValidationSummary)}
              variant="outline"
              className="flex-1"
            >
              {showValidationSummary ? 'Hide' : 'Show'} Data Quality Check
              {(validationResult?.errors.length > 0 || validationResult?.warnings.length > 0) && (
                <Badge variant="secondary" className="ml-2">
                  {(validationResult?.errors.length || 0) + (validationResult?.warnings.length || 0)}
                </Badge>
              )}
            </Button>
            <Button 
              type="submit" 
              disabled={loading || referenceLoading || loadingInvoices} 
              className="flex-1 py-3"
              variant="default"
            >
              {loading ? 'Submitting...' : 'Submit Timesheet'}
            </Button>
          </div>

          {/* Validation Summary */}
          {showValidationSummary && validationResult && (
            <ValidationSummary 
              validationResults={[validationResult]}
              className="mt-4"
            />
          )}

          <ShiftFormFields
            form={form}
            operators={operators}
            loadingOperators={referenceLoading}
            preselectedOperator={preselectedOperator}
            hoursWorked={hoursWorked}
            hoursBooked={hoursBooked}
            hasClockfyData={clockfyTimeEvents.data && clockfyTimeEvents.data.length > 0}
            isCurrentlyWorking={clockfyTimeEvents.data && clockfyTimeEvents.data.length > 0 && 
              clockfyTimeEvents.data.some(event => event.clock_in && !event.clock_out)}
          />

          <ActivitySection
            form={form}
            products={products}
            machines={machines}
            invoiceNumbers={invoiceNumbers}
            loadingProducts={referenceLoading}
            loadingInvoices={loadingInvoices}
            loadingMachines={referenceLoading}
            autoPopulatedFields={autoPopulatedFields}
            allowManualOverride={allowManualOverride}
            selectedOperator={selectedOperator}
            printedLabelsQuery={printedLabelsQuery}
            onUnitsProducedChange={handleUnitsProducedChange}
            onFieldChangeWithTimeCheck={handleFieldChangeWithTimeCheck}
            onPopulateFromPrintedLabels={populateFromPrintedLabels}
            onRemoveAutoPopulatedFlag={handleRemoveAutoPopulatedFlag}
            getFilteredInvoicesForSku={getFilteredInvoicesForSku}
          />


          {/* Submit Button at Bottom */}
          <Button 
            type="submit" 
            disabled={loading || referenceLoading || loadingInvoices} 
            className="w-full py-3"
            variant="outline"
          >
            {loading ? 'Submitting...' : 'Submit Timesheet'}
          </Button>
        </form>

        {/* Error Messages */}
        {invoicesError && <Alert className="mt-4">
            <AlertDescription>{invoicesError}</AlertDescription>
          </Alert>}

        {/* Warning Dialog for High Units */}
        <Dialog open={openMaxUnitsDialog} onOpenChange={setOpenMaxUnitsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Warning: High Value Entered</DialogTitle>
            </DialogHeader>
            <p>You have entered a value above 9999 in "Units Produced." Please verify this is correct.</p>
            <DialogFooter>
              <Button onClick={() => setOpenMaxUnitsDialog(false)}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <TimeSpentDialog
          open={openTimeSpentDialog}
          onOpenChange={setOpenTimeSpentDialog}
          laserEntries={laserTimeEntries}
          onSaveAll={handleLaserTimesSave}
        />
      </CardContent>
    </Card>
  );
}