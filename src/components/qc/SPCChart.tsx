import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, Target, AlertTriangle } from 'lucide-react';
import { SPCData } from '@/services/qcApiService';
import { format } from 'date-fns';

interface SPCChartProps {
  spcData: SPCData;
}

export function SPCChart({ spcData }: SPCChartProps) {
  // Safety check for spcData and measurements
  if (!spcData || !Array.isArray(spcData.measurements) || spcData.measurements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Statistical Process Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No SPC data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = spcData.measurements.map((measurement, index) => {
    const value = spcData.type === 'milling_depth' 
      ? measurement.averageDepth 
      : (measurement.topCoil + measurement.bottomCoil) / 2;
    
    return {
      index: index + 1,
      value: value,
      target: spcData.specifications.target,
      upperLimit: spcData.specifications.upperLimit,
      lowerLimit: spcData.specifications.lowerLimit,
      date: measurement.testDate,
      operator: measurement.operator,
      status: measurement.status,
      testType: measurement.testType
    };
  });

  const getCpkStatus = (cpk: number) => {
    if (cpk >= 1.33) return { color: 'text-green-600', label: 'Excellent', variant: 'default' as const };
    if (cpk >= 1.0) return { color: 'text-yellow-600', label: 'Acceptable', variant: 'secondary' as const };
    return { color: 'text-red-600', label: 'Poor', variant: 'destructive' as const };
  };

  const cpkStatus = getCpkStatus(spcData.specifications.cpk);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          SPC Control Chart
          <Badge variant="outline" className="ml-2">
            {spcData.type === 'milling_depth' ? 'Milling Depth' : 'Grinding Coil'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Cpk</div>
              <div className={`text-lg font-bold ${cpkStatus.color}`}>
                {spcData.specifications.cpk}
              </div>
              <Badge variant={cpkStatus.variant} className="text-xs mt-1">
                {cpkStatus.label}
              </Badge>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Average</div>
              <div className="text-lg font-semibold">
                {spcData.statistics.average.toFixed(4)}
              </div>
              <div className="text-xs text-muted-foreground">{spcData.unit}</div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Range</div>
              <div className="text-lg font-semibold">
                {spcData.statistics.range.toFixed(4)}
              </div>
              <div className="text-xs text-muted-foreground">{spcData.unit}</div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Count</div>
              <div className="text-lg font-semibold">
                {spcData.statistics.count}
              </div>
              <div className="text-xs text-muted-foreground">measurements</div>
            </div>
          </div>

          {/* Control Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="index" 
                  label={{ value: 'Measurement #', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  domain={['dataMin - 0.001', 'dataMax + 0.001']}
                  label={{ value: `Value (${spcData.unit})`, angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => value.toFixed(4)}
                />
                
                {/* Control Limits */}
                <ReferenceLine 
                  y={spcData.specifications.upperLimit} 
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                  label={{ value: "UCL", position: "right" }}
                />
                <ReferenceLine 
                  y={spcData.specifications.target} 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  label={{ value: "Target", position: "right" }}
                />
                <ReferenceLine 
                  y={spcData.specifications.lowerLimit} 
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                  label={{ value: "LCL", position: "right" }}
                />
                
                {/* Data Line */}
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
                />
                
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    `${Number(value).toFixed(4)} ${spcData.unit}`,
                    'Value'
                  ]}
                  labelFormatter={(label: any) => `Measurement #${label}`}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3">
                          <p className="font-semibold">Measurement #{label}</p>
                          <p className="text-sm">
                            Value: {Number(payload[0].value).toFixed(4)} {spcData.unit}
                          </p>
                          <p className="text-sm">
                            Date: {format(new Date(data.date), 'MMM dd, HH:mm')}
                          </p>
                          <p className="text-sm">Operator: {data.operator}</p>
                          <p className="text-sm">Type: {data.testType}</p>
                          <Badge 
                            variant={data.status === 'pass' ? 'default' : 'destructive'}
                            className="text-xs mt-1"
                          >
                            {data.status.toUpperCase()}
                          </Badge>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-sm font-medium">Target</div>
                <div className="text-sm text-muted-foreground">
                  {spcData.specifications.target.toFixed(4)} {spcData.unit}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <div className="text-sm font-medium">Upper Limit</div>
                <div className="text-sm text-muted-foreground">
                  {spcData.specifications.upperLimit.toFixed(4)} {spcData.unit}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <div className="text-sm font-medium">Lower Limit</div>
                <div className="text-sm text-muted-foreground">
                  {spcData.specifications.lowerLimit.toFixed(4)} {spcData.unit}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}