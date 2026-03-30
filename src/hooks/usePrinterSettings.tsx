import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { DEFAULT_LABEL_SIZE, LabelDimensions, mmToZplDots } from '@/utils/labelScaling';

interface PrinterSettings {
  IP: string;
  Port: number;
  labelWidth: number;  // in mm
  labelHeight: number; // in mm
}

export function usePrinterSettings() {
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>({
    IP: '10.0.0.14',
    Port: 443,
    labelWidth: DEFAULT_LABEL_SIZE.widthMm,
    labelHeight: DEFAULT_LABEL_SIZE.heightMm,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadPrinterSettings = useCallback(async () => {
    try {
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch the user's settings row (unique per user now)
      const { data, error } = await supabase
        .from('printer_settings')
        .select('id, printer_ip, printer_port, label_width_mm, label_height_mm')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Failed to load printer settings:', error);
        throw error;
      }

      if (data) {
        // Row exists - use it
        setSettingsId(data.id);
        setPrinterSettings({
          IP: data.ip_address,
          Port: data.port,
          labelWidth: data.label_width_mm ?? DEFAULT_LABEL_SIZE.widthMm,
          labelHeight: data.label_height_mm ?? DEFAULT_LABEL_SIZE.heightMm,
        });
      } else {
        // No row exists - create default settings for this user
        const { data: newRow, error: insertError } = await supabase
          .from('printer_settings')
          .insert({
            user_id: user.id,
            ip_address: '10.0.0.14',
            port: 443,
            label_width_mm: DEFAULT_LABEL_SIZE.widthMm,
            label_height_mm: DEFAULT_LABEL_SIZE.heightMm,
          })
          .select('id, ip_address, port, label_width_mm, label_height_mm')
          .single();

        if (insertError) {
          console.error('Failed to create default printer settings:', insertError);
          throw insertError;
        }

        if (newRow) {
          setSettingsId(newRow.id);
          setPrinterSettings({
            IP: newRow.ip_address,
            Port: newRow.port,
            labelWidth: newRow.label_width_mm ?? DEFAULT_LABEL_SIZE.widthMm,
            labelHeight: newRow.label_height_mm ?? DEFAULT_LABEL_SIZE.heightMm,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load printer settings:', error);
      toast({
        title: "Error",
        description: "Failed to load printer settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPrinterSettings();
  }, [loadPrinterSettings]);

  const updatePrinterSettings = async (settings: Partial<PrinterSettings>) => {
    const newSettings = { ...printerSettings, ...settings };
    
    try {
      if (!settingsId) {
        // Should not happen if loadPrinterSettings ran, but handle gracefully
        console.error('No settings ID available for update');
        toast({
          title: "Error",
          description: "Settings not loaded yet. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update the existing row by ID
      const { error } = await supabase
        .from('printer_settings')
        .update({
          ip_address: newSettings.IP,
          port: newSettings.Port,
          label_width_mm: newSettings.labelWidth,
          label_height_mm: newSettings.labelHeight,
        })
        .eq('id', settingsId);

      if (error) throw error;

      // Update local state
      setPrinterSettings(newSettings);
      
      toast({
        title: "Settings Saved",
        description: `Label size set to ${newSettings.labelWidth}mm × ${newSettings.labelHeight}mm`,
      });
    } catch (error) {
      console.error('Failed to update printer settings:', error);
      toast({
        title: "Error",
        description: "Failed to save printer settings",
        variant: "destructive",
      });
    }
  };

  // Helper to get label dimensions object
  const getLabelDimensions = (): LabelDimensions => ({
    widthMm: printerSettings.labelWidth,
    heightMm: printerSettings.labelHeight,
  });

  // Helper to get label dimensions in dots
  const getLabelDimensionsDots = () => ({
    widthDots: mmToZplDots(printerSettings.labelWidth),
    heightDots: mmToZplDots(printerSettings.labelHeight),
  });

  return {
    printerSettings,
    updatePrinterSettings,
    loading,
    getLabelDimensions,
    getLabelDimensionsDots,
  };
}
