import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { qcApiService, QCApiResponse } from '@/services/qcApiService';
import { BatchOverview } from './BatchOverview';
import { QualitySummary } from './QualitySummary';
import { CoilMapVisualization } from './CoilMapVisualization';

interface CoilMapViewerProps {
  batchNumber: string;
}

export function CoilMapViewer({ batchNumber }: CoilMapViewerProps) {
  const [coilData, setCoilData] = useState<QCApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!batchNumber) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await qcApiService.fetchBatchData(batchNumber);
        setCoilData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`Error loading coil map data: ${errorMessage}`);
        console.error('Failed to load coil map data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [batchNumber]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!coilData || !coilData.success) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No data available for batch number: {batchNumber}
        </AlertDescription>
      </Alert>
    );
  }

  const { batch, quality, coil_map } = coilData.data;

  return (
    <div className="space-y-6">
      <BatchOverview batch={batch} />
      <QualitySummary quality={quality} />
      <CoilMapVisualization coilMap={coil_map} />
    </div>
  );
}