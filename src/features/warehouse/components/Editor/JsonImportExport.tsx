// JSON import/export component for warehouse layouts
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Download, Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import type { WarehouseLayout } from '../../types';

interface JsonImportExportProps {
  layout: WarehouseLayout;
  open: boolean;
  onClose: () => void;
  onImport: (layout: WarehouseLayout) => void;
}

const JsonImportExport: React.FC<JsonImportExportProps> = ({
  layout,
  open,
  onClose,
  onImport
}) => {
  const [importText, setImportText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const exportJson = JSON.stringify(layout, null, 2);

  const handleExport = () => {
    const blob = new Blob([exportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warehouse-layout-${layout.id}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccess('Layout exported successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleImport = () => {
    try {
      setError('');
      setSuccess('');
      
      const parsed = JSON.parse(importText);
      
      // Basic validation
      if (!parsed.id || !parsed.name || !Array.isArray(parsed.zones)) {
        throw new Error('Invalid layout format. Missing required fields: id, name, or zones.');
      }

      // Validate zones structure
      for (const zone of parsed.zones) {
        if (!zone.id || !zone.name || !Array.isArray(zone.aisles)) {
          throw new Error(`Invalid zone format: ${zone.id || 'unknown'}`);
        }
      }

      onImport(parsed);
      setSuccess('Layout imported successfully!');
      setImportText('');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON format');
    }
  };

  const handleClose = () => {
    setImportText('');
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Layout JSON Editor</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Download the current layout configuration as JSON.
              </p>
              <Textarea
                value={exportJson}
                readOnly
                className="h-96 font-mono text-xs"
              />
            </div>
            <Button onClick={handleExport} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download JSON File
            </Button>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Paste a warehouse layout JSON configuration below.
              </p>
              <Textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste JSON configuration here..."
                className="h-96 font-mono text-xs"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleImport} 
              disabled={!importText.trim()}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Layout
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JsonImportExport;