import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Map, Ruler } from 'lucide-react';
import { CoilMapData, qcApiService } from '@/services/qcApiService';

interface CoilMapVisualizationProps {
  coilMap: CoilMapData;
}

export function CoilMapVisualization({ coilMap }: CoilMapVisualizationProps) {
  // Safety check for coil map data
  if (!coilMap) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-muted-foreground" />
            Coil Map Visualization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Ruler className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No coil map data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'medium':
        return 'outline';
      case 'low':
        return 'default';
      default:
        return 'outline';
    }
  };

  // Generate scale markers
  const generateScaleMarkers = () => {
    const markers = [];
    const interval = Math.ceil(coilMap.length / 10);
    for (let i = 0; i <= coilMap.length; i += interval) {
      markers.push(i);
    }
    return markers;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5 text-primary" />
          Coil Map Visualization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Length Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Ruler className="h-4 w-4" />
            <span>Total Length: {coilMap.length} feet</span>
          </div>

          {/* Coil Map Visualization */}
          <div className="relative bg-muted/30 rounded-lg p-4 min-h-[120px]">
            {/* Scale */}
            <div className="relative mb-6">
              <div className="h-2 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full relative">
                {/* Scale markers */}
                {generateScaleMarkers().map((position) => (
                  <div
                    key={position}
                    className="absolute top-0 h-full w-0.5 bg-slate-400"
                    style={{ left: `${(position / coilMap.length) * 100}%` }}
                  >
                    <span className="absolute -bottom-6 -translate-x-1/2 text-xs text-muted-foreground">
                      {position.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
                Position (feet)
              </div>
            </div>

            {/* Fault Markers */}
            <TooltipProvider>
              <div className="relative h-8 bg-slate-100 rounded-lg">
                {coilMap.faults.map((fault) => {
                  const startPercent = (fault.startPosition / coilMap.length) * 100;
                  const widthPercent = ((fault.finishPosition - fault.startPosition) / coilMap.length) * 100;
                  
                  return (
                    <Tooltip key={fault.id}>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute top-0 h-full rounded cursor-pointer transition-all hover:scale-105 hover:z-10"
                          style={{
                            left: `${startPercent}%`,
                            width: `${Math.max(widthPercent, 1)}%`,
                            backgroundColor: qcApiService.getSeverityColor(fault.severity),
                            opacity: 0.8
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-2">
                          <div className="font-semibold">{fault.type.replace('_', ' ')}</div>
                          <div className="text-sm">{fault.description}</div>
                          <div className="text-xs text-muted-foreground">
                            Position: {fault.startPosition}ft - {fault.finishPosition}ft
                          </div>
                          <Badge variant={getSeverityBadgeVariant(fault.severity)} className="text-xs">
                            {fault.severity.toUpperCase()}
                          </Badge>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
                
                {coilMap.faults.length === 0 && (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    No faults detected
                  </div>
                )}
              </div>
            </TooltipProvider>
          </div>


          {/* Fault Summary */}
          {coilMap.faults.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="font-semibold text-sm mb-3">Fault Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {coilMap.faults.map((fault, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span>{fault.type.replace('_', ' ')}</span>
                    <Badge variant={getSeverityBadgeVariant(fault.severity)} className="text-xs">
                      {fault.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}