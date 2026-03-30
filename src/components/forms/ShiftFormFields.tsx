import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { format } from 'date-fns';
import { calculateShiftDate } from '@/utils/dataValidation';
import { CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ShiftFormData, Operator } from './shift-form-types';

interface ShiftFormFieldsProps {
  form: UseFormReturn<ShiftFormData>;
  operators: Operator[];
  loadingOperators: boolean;
  preselectedOperator?: {
    id: string;
    operator_name: string;
    operator_code: string;
  };
  hoursWorked: number;
  hoursBooked: number;
  hasClockfyData?: boolean;
  isCurrentlyWorking?: boolean;
}

export function ShiftFormFields({
  form,
  operators,
  loadingOperators,
  preselectedOperator,
  hoursWorked,
  hoursBooked,
  hasClockfyData = false,
  isCurrentlyWorking = false
}: ShiftFormFieldsProps) {
  const selectedDate = form.watch('date');
  const timeStart = form.watch('timeStart');
  const timeFinish = form.watch('timeFinish');
  const shiftType = form.watch('shift');
  
  // Calculate the actual shift date that will be saved (based on shift type and business day)
  const effectiveShiftDate = selectedDate && timeStart && timeFinish
    ? calculateShiftDate(selectedDate, timeStart, timeFinish, shiftType)
    : selectedDate;

  // Check for unreasonable shift hours
  const hasUnreasonableHours = hoursWorked > 16;
  const hasExcessiveHours = hoursWorked > 20;
  return (
    <>
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !form.watch('date') && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.watch('date') ? (
                  format(new Date(form.watch('date')), 'dd/MM/yyyy')
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={form.watch('date') ? new Date(form.watch('date')) : undefined}
                onSelect={(date) => {
                  if (date) {
                    form.setValue('date', format(date, 'yyyy-MM-dd'));
                  }
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
              </PopoverContent>
            </Popover>
            {effectiveShiftDate && effectiveShiftDate !== selectedDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Will save as: {format(new Date(effectiveShiftDate), 'dd/MM/yyyy')} (6am boundary)
              </p>
            )}
            {form.formState.errors.date && (
              <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
            )}
          </div>

        <div className="space-y-2">
          <Label>Shift *</Label>
          <Select 
            value={form.watch('shift')} 
            onValueChange={(value: 'Days' | 'Nights') => form.setValue('shift', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Days">Days</SelectItem>
              <SelectItem value="Nights">Nights</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.shift && (
            <p className="text-sm text-destructive">{form.formState.errors.shift.message}</p>
          )}
        </div>

        {!preselectedOperator && (
          <div className="space-y-2">
            <Label>Operator *</Label>
            <Select 
              value={form.watch('operator')} 
              onValueChange={value => form.setValue('operator', value)} 
              disabled={loadingOperators}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingOperators ? "Loading..." : "Select operator"} />
              </SelectTrigger>
              <SelectContent>
                {operators.map(operator => (
                  <SelectItem key={operator.id} value={operator.id}>
                    {operator.operator_code} - {operator.operator_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.operator && (
              <p className="text-sm text-destructive">{form.formState.errors.operator.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Time Information */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="timeStart">Time Start *</Label>
            {hasClockfyData && (
              <Badge variant="secondary" className="text-xs">
                Auto-filled
              </Badge>
            )}
          </div>
          <Input 
            id="timeStart" 
            type="time" 
            {...form.register('timeStart')}
            className="w-full"
            placeholder="07:00"
          />
          {form.formState.errors.timeStart && (
            <p className="text-sm text-destructive">{form.formState.errors.timeStart.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="timeFinish">Time Finish *</Label>
            {hasClockfyData && (
              <Badge 
                variant={isCurrentlyWorking ? "destructive" : "secondary"} 
                className="text-xs"
              >
                {isCurrentlyWorking ? "Still working" : "Auto-filled"}
              </Badge>
            )}
          </div>
          <Input 
            id="timeFinish" 
            type="time" 
            {...form.register('timeFinish')}
            className="w-full"
            placeholder="17:00"
          />
          {form.formState.errors.timeFinish && (
            <p className="text-sm text-destructive">{form.formState.errors.timeFinish.message}</p>
          )}
          {isCurrentlyWorking && (
            <p className="text-xs text-muted-foreground">
              Operator is currently working - set finish time manually or wait for clock out
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Hours Worked</Label>
          <Input 
            value={hoursWorked.toFixed(2)} 
            readOnly 
            className={cn(
              "bg-muted",
              hasExcessiveHours && "border-destructive text-destructive",
              hasUnreasonableHours && !hasExcessiveHours && "border-yellow-500 text-yellow-700"
            )} 
          />
          <p className="text-xs text-muted-foreground">
            Difference between Time Start and Time Finish
          </p>
          {hasExcessiveHours && (
            <p className="text-xs text-destructive font-medium">
              ⚠️ Excessive hours ({hoursWorked.toFixed(1)}h) - Likely data error
            </p>
          )}
          {hasUnreasonableHours && !hasExcessiveHours && (
            <p className="text-xs text-yellow-700 font-medium">
              ⚠️ Long shift ({hoursWorked.toFixed(1)}h) - Please verify times
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Hours Booked</Label>
          <Input value={hoursBooked.toFixed(2)} readOnly className="bg-muted" />
          <p className="text-xs text-muted-foreground">Sum of Time Spent across all activities</p>
        </div>

        <div className="space-y-2">
          <Label>Time Balance</Label>
          <Input 
            value={`${(hoursBooked - hoursWorked).toFixed(2)} hrs (${hoursWorked > 0 ? ((hoursBooked / hoursWorked) * 100).toFixed(1) : '0.0'}%)`} 
            readOnly 
            className={`bg-muted ${
              Math.abs(hoursBooked - hoursWorked) <= 0.25 
                ? 'text-green-600 border-green-300' 
                : Math.abs(hoursBooked - hoursWorked) <= 1.0 
                ? 'text-yellow-600 border-yellow-300' 
                : 'text-red-600 border-red-300'
            }`} 
          />
          <p className="text-xs text-muted-foreground">
            Difference: {hoursBooked - hoursWorked >= 0 ? '+' : ''}{(hoursBooked - hoursWorked).toFixed(2)}h
            {Math.abs(hoursBooked - hoursWorked) > 0.25 && ' (⚠️ Large difference)'}
          </p>
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-2">
        <Label htmlFor="comments">Comments</Label>
        <Textarea 
          id="comments" 
          placeholder="Additional comments about the shift..." 
          rows={4} 
          {...form.register('comments')} 
        />
      </div>
    </>
  );
}