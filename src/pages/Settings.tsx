import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePrinterSettings } from "@/hooks/usePrinterSettings";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Ruler, Printer } from "lucide-react";
import { LABEL_PRESETS, validateLabelDimensions, LabelDimensions } from "@/utils/labelScaling";

export default function Settings() {
  const { printerSettings, updatePrinterSettings, loading } = usePrinterSettings();
  const { toast } = useToast();
  
  // Printer settings state
  const [ip, setIp] = useState(printerSettings.IP);
  const [port, setPort] = useState(printerSettings.Port.toString());
  
  // Label settings state
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [labelWidth, setLabelWidth] = useState(printerSettings.labelWidth.toString());
  const [labelHeight, setLabelHeight] = useState(printerSettings.labelHeight.toString());
  const [isCustomSize, setIsCustomSize] = useState(false);

  // Update local state when printer settings change
  useEffect(() => {
    setIp(printerSettings.IP);
    setPort(printerSettings.Port.toString());
    setLabelWidth(printerSettings.labelWidth.toString());
    setLabelHeight(printerSettings.labelHeight.toString());
    
    // Find matching preset or set to custom
    const matchingPreset = LABEL_PRESETS.find(
      preset => 
        preset.dimensions.widthMm === printerSettings.labelWidth && 
        preset.dimensions.heightMm === printerSettings.labelHeight
    );
    
    if (matchingPreset && matchingPreset.name !== 'Custom') {
      setSelectedPreset(matchingPreset.name);
      setIsCustomSize(false);
    } else {
      setSelectedPreset('Custom');
      setIsCustomSize(true);
    }
  }, [printerSettings]);

  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName);
    
    if (presetName === 'Custom') {
      setIsCustomSize(true);
      return;
    }
    
    setIsCustomSize(false);
    const preset = LABEL_PRESETS.find(p => p.name === presetName);
    if (preset) {
      setLabelWidth(preset.dimensions.widthMm.toString());
      setLabelHeight(preset.dimensions.heightMm.toString());
    }
  };

  const handleSavePrinterSettings = () => {
    const portNumber = parseInt(port);
    if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      toast({
        title: "Invalid Port",
        description: "Please enter a valid port number (1-65535)",
        variant: "destructive",
      });
      return;
    }

    updatePrinterSettings({
      IP: ip,
      Port: portNumber,
    });
  };

  const handleSaveLabelSettings = () => {
    const width = parseFloat(labelWidth);
    const height = parseFloat(labelHeight);
    
    if (isNaN(width) || isNaN(height)) {
      toast({
        title: "Invalid Dimensions",
        description: "Please enter valid numeric dimensions",
        variant: "destructive",
      });
      return;
    }
    
    const dimensions: LabelDimensions = { widthMm: width, heightMm: height };
    const validation = validateLabelDimensions(dimensions);
    
    if (!validation.valid) {
      toast({
        title: "Invalid Dimensions",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    updatePrinterSettings({
      labelWidth: width,
      labelHeight: height,
    });
  };

  // Preview scaling - max 150px for the preview box
  const previewMaxSize = 150;
  const widthNum = parseFloat(labelWidth) || 101;
  const heightNum = parseFloat(labelHeight) || 101;
  const scale = Math.min(previewMaxSize / widthNum, previewMaxSize / heightNum);
  const previewWidth = widthNum * scale;
  const previewHeight = heightNum * scale;

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Printer Configuration Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              <CardTitle>Printer Configuration</CardTitle>
            </div>
            <CardDescription>
              Configure the printer IP address and port for direct printing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="printer-ip">Printer IP Address</Label>
              <Input
                id="printer-ip"
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="10.0.0.14"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="printer-port">Printer Port</Label>
              <Input
                id="printer-port"
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="443"
                min="1"
                max="65535"
                disabled={loading}
              />
            </div>
            <Button onClick={handleSavePrinterSettings} className="w-full" disabled={loading}>
              {loading ? "Loading..." : "Save Printer Settings"}
            </Button>
          </CardContent>
        </Card>

        {/* Label Configuration Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              <CardTitle>Label Configuration</CardTitle>
            </div>
            <CardDescription>
              Configure the label size for printing. All elements will scale proportionally.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label-preset">Preset Size</Label>
              <Select value={selectedPreset} onValueChange={handlePresetChange} disabled={loading}>
                <SelectTrigger id="label-preset">
                  <SelectValue placeholder="Select a preset size" />
                </SelectTrigger>
                <SelectContent>
                  {LABEL_PRESETS.map((preset) => (
                    <SelectItem key={preset.name} value={preset.name}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="label-width">Width (mm)</Label>
                <Input
                  id="label-width"
                  type="number"
                  value={labelWidth}
                  onChange={(e) => {
                    setLabelWidth(e.target.value);
                    setSelectedPreset('Custom');
                    setIsCustomSize(true);
                  }}
                  placeholder="101"
                  min="25"
                  max="300"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="label-height">Height (mm)</Label>
                <Input
                  id="label-height"
                  type="number"
                  value={labelHeight}
                  onChange={(e) => {
                    setLabelHeight(e.target.value);
                    setSelectedPreset('Custom');
                    setIsCustomSize(true);
                  }}
                  placeholder="101"
                  min="25"
                  max="300"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Label Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="flex flex-col items-center gap-2 p-4 bg-muted/50 rounded-lg">
                <div 
                  className="border-2 border-dashed border-primary/50 bg-background flex items-center justify-center text-xs text-muted-foreground"
                  style={{ 
                    width: `${previewWidth}px`, 
                    height: `${previewHeight}px`,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {widthNum}mm × {heightNum}mm
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(widthNum / 25.4 * 10) / 10}" × {Math.round(heightNum / 25.4 * 10) / 10}" 
                  ({Math.round(widthNum * 8)} × {Math.round(heightNum * 8)} dots)
                </p>
              </div>
            </div>

            <Button onClick={handleSaveLabelSettings} className="w-full" disabled={loading}>
              {loading ? "Loading..." : "Save Label Settings"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
