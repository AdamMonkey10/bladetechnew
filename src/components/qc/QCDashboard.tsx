import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CoilMapViewer } from './CoilMapViewer';
import { Search, Microscope, BarChart3, Map, ClipboardList } from 'lucide-react';

export function QCDashboard() {
  const [batchNumber, setBatchNumber] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');

  const handleSearch = () => {
    if (batchNumber.trim()) {
      setSelectedBatch(batchNumber.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const quickSearchBatches = [
    '250001', '250002', '250003', '250004', '250005'
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Microscope className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Quality Control</h1>
          <p className="text-muted-foreground">
            Batch analysis with coil maps and SPC data
          </p>
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Lookup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 max-w-md">
            <div className="flex-1">
              <Label htmlFor="batch-number">Batch Number</Label>
              <Input
                id="batch-number"
                placeholder="Enter batch number..."
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={!batchNumber.trim()}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {/* Quick Search Options */}
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {quickSearchBatches.map((batch) => (
                <Button
                  key={batch}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBatchNumber(batch);
                    setSelectedBatch(batch);
                  }}
                >
                  {batch}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {selectedBatch ? (
        <CoilMapViewer batchNumber={selectedBatch} />
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Microscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Enter a batch number to begin</p>
              <p className="text-sm">
                View coil maps, SPC analysis, and test results
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}