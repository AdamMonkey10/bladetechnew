
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OEETargetRates } from '@/hooks/useOEESettings';
import { RotateCcw, Save, Clock, Target } from 'lucide-react';

interface OEESettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetRates: OEETargetRates;
  defaultRates: OEETargetRates;
  onUpdateAllRates: (rates: Partial<OEETargetRates>) => void;
  onResetToDefaults: () => void;
}

export const OEESettingsDialog = ({
  open,
  onOpenChange,
  targetRates,
  defaultRates,
  onUpdateAllRates,
  onResetToDefaults,
}: OEESettingsDialogProps) => {
  const [tempRates, setTempRates] = useState<OEETargetRates>(targetRates);

  const handleSave = () => {
    onUpdateAllRates(tempRates);
    onOpenChange(false);
  };

  const handleReset = () => {
    setTempRates(defaultRates);
    onResetToDefaults();
  };

  const updateTempRate = (activity: keyof OEETargetRates, value: string) => {
    const numValue = parseFloat(value) || 0;
    setTempRates(prev => ({ ...prev, [activity]: numValue }));
  };

  const activities = Object.keys(targetRates) as (keyof OEETargetRates)[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>OEE Target Rate Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure target production rates for calculating OEE metrics.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activities.map((activity) => (
              <Card key={activity}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{activity}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor={`rate-${activity}`}>Target Rate (units/hour)</Label>
                    <Input
                      id={`rate-${activity}`}
                      type="number"
                      value={tempRates[activity]}
                      onChange={(e) => updateTempRate(activity, e.target.value)}
                      min="0"
                      step="1"
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Default: {defaultRates[activity]} units/hour
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
