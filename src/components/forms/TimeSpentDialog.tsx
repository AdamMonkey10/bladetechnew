import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LaserTimeEntry } from './shift-form-types';
import { NumericTextField } from './NumericTextField';
import { validateShiftFormData } from '@/utils/dataValidation';

interface TimeSpentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  laserEntries: LaserTimeEntry[];
  onSaveAll: (entries: LaserTimeEntry[]) => void;
}

export function TimeSpentDialog({
  open,
  onOpenChange,
  laserEntries,
  onSaveAll
}: TimeSpentDialogProps) {
  const [entries, setEntries] = useState<LaserTimeEntry[]>(laserEntries);

  console.log('TimeSpentDialog render:', { open, laserEntriesCount: laserEntries.length, entries });

  const updateEntry = (index: number, field: keyof LaserTimeEntry, value: string) => {
    setEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  const handleSave = () => {
    console.log('handleSave called with entries:', entries);
    onSaveAll(entries);
    onOpenChange(false);
  };

  // Validate entries
  const validationResult = validateShiftFormData({
    activities: entries.map(entry => ({
      name: entry.laserName,
      entries: [{
        time_spent: parseFloat(entry.timeSpent) || 0,
        units_produced: entry.unitsProduced
      }]
    })),
    timeStart: '07:00',
    timeFinish: '17:00'
  });

  const isValid = entries.every(entry => 
    entry.timeSpent && parseFloat(entry.timeSpent) > 0
  ) && validationResult.isValid;

  // Update entries when laserEntries prop changes
  React.useEffect(() => {
    console.log('TimeSpentDialog: laserEntries changed:', laserEntries);
    setEntries(laserEntries);
  }, [laserEntries]);

  if (!open) {
    console.log('TimeSpentDialog: not open, returning null');
    return null;
  }

  console.log('TimeSpentDialog: rendering dialog with', entries.length, 'entries');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Time Spent & Scrap for All Lasers
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please enter time spent and scrap for each laser activity:
          </p>
          
          {entries.map((entry, index) => (
            <Card key={index} className="p-4 border-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg text-primary">{entry.laserName}</h4>
                  <div className="text-sm text-muted-foreground">
                    SKU: <span className="font-medium">{entry.sku}</span> • Units: <span className="font-medium">{entry.unitsProduced}</span>
                    {entry.invoice && (
                      <>
                        <br />
                        Invoice: <span className="font-medium text-blue-600">{entry.invoice}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <NumericTextField
                    label="Time Spent (hours)"
                    value={entry.timeSpent}
                    onChange={value => updateEntry(index, 'timeSpent', value)}
                    placeholder="0.0"
                    required
                    decimalPlaces={2}
                    isTimeField={true}
                    activityName={entry.laserName}
                    showValidation={true}
                  />
                  
                  <div className="space-y-2">
                    <Label htmlFor={`scrap-${index}`} className="text-base font-medium">
                      Scrap (units)
                    </Label>
                    <Input 
                      id={`scrap-${index}`}
                      type="number" 
                      min="0" 
                      value={entry.scrap} 
                      onChange={e => updateEntry(index, 'scrap', e.target.value)}
                      placeholder="0"
                      className="text-lg"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter scrap units (default: 0)
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <NumericTextField
                    label="Downtime (hours)"
                    value={entry.downtime_duration || ''}
                    onChange={value => updateEntry(index, 'downtime_duration', value)}
                    placeholder="0.0"
                    decimalPlaces={2}
                    isTimeField={true}
                    activityName={entry.laserName}
                  />
                  
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Downtime Reason</Label>
                    <Select 
                      value={entry.downtime_reason || ''} 
                      onValueChange={value => updateEntry(index, 'downtime_reason', value)}
                    >
                      <SelectTrigger className="text-lg">
                        <SelectValue placeholder="Select reason (optional)" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border">
                        <SelectItem value="Breakdown">Breakdown</SelectItem>
                        <SelectItem value="Setup/Changeover">Setup/Changeover</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Waiting for Instructions">Waiting for Instructions</SelectItem>
                        <SelectItem value="Training">Training</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Select downtime reason (optional)
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Show validation errors */}
        {validationResult.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {validationResult.errors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!isValid}
          >
            Save All ({entries.length} lasers)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}