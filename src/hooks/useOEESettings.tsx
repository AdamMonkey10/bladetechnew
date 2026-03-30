
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface OEETargetRates {
  Laser: number;
  Welder: number;
  'Auto Welding': number;
  Coating: number;
  Stacking: number;
}

// Default target rates for machines
const DEFAULT_RATES: OEETargetRates = {
  Laser: 500,
  Welder: 167,
  'Auto Welding': 150,
  Coating: 200,
  Stacking: 300,
};

export const useOEESettings = () => {
  const [targetRates, setTargetRates] = useState<OEETargetRates>(DEFAULT_RATES);
  const { toast } = useToast();

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedRates = localStorage.getItem('oee-target-rates');
    
    if (savedRates) {
      try {
        const parsed = JSON.parse(savedRates);
        setTargetRates({ ...DEFAULT_RATES, ...parsed });
      } catch (error) {
        console.error('Failed to parse saved OEE rates:', error);
      }
    }
  }, [toast]);

  const updateRate = (activity: keyof OEETargetRates, rate: number) => {
    const newRates = { ...targetRates, [activity]: rate };
    setTargetRates(newRates);
    localStorage.setItem('oee-target-rates', JSON.stringify(newRates));
    
    toast({
      title: "Target Rate Updated",
      description: `${activity}: ${rate} units/hour`,
    });
  };

  const resetToDefaults = () => {
    setTargetRates(DEFAULT_RATES);
    localStorage.setItem('oee-target-rates', JSON.stringify(DEFAULT_RATES));
    
    toast({
      title: "Settings Reset",
      description: "All target rates reset to defaults",
    });
  };

  const updateAllRates = (newRates: Partial<OEETargetRates>) => {
    const updatedRates = { ...targetRates, ...newRates };
    setTargetRates(updatedRates);
    localStorage.setItem('oee-target-rates', JSON.stringify(updatedRates));
    
    toast({
      title: "Target Rates Updated",
      description: "OEE settings saved successfully",
    });
  };

  return {
    targetRates,
    updateRate,
    resetToDefaults,
    updateAllRates,
    defaultRates: DEFAULT_RATES,
    // Legacy compatibility
    bookedTargetRates: targetRates,
    target247Rates: targetRates,
  };
};
