import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2 } from 'lucide-react';
import { useOperatorClockStatus } from '@/hooks/useClockfyIntegration';

interface ClockStatusIndicatorProps {
  operatorId: string;
  operatorName: string;
  compact?: boolean;
}

export function ClockStatusIndicator({ operatorId, operatorName, compact = false }: ClockStatusIndicatorProps) {
  const { data: clockStatus, isLoading } = useOperatorClockStatus(operatorId);

  if (isLoading) {
    return (
      <Badge variant="secondary" className="animate-pulse">
        <Clock className="h-3 w-3 mr-1" />
        Loading...
      </Badge>
    );
  }

  if (!clockStatus) {
    return (
      <Badge variant="outline">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        {compact ? 'Off' : 'Clocked Out'}
      </Badge>
    );
  }

  const clockInTime = new Date(clockStatus.clock_in);
  const formattedTime = clockInTime.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });

  // Calculate hours worked so far
  const hoursWorked = (Date.now() - clockInTime.getTime()) / (1000 * 60 * 60);

  return (
    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
      <Clock className="h-3 w-3 mr-1" />
      {compact ? `Start: ${formattedTime}` : `Working since ${formattedTime}`}
      {!compact && (
        <span className="ml-2 text-xs opacity-90">
          ({hoursWorked.toFixed(1)}h)
        </span>
      )}
    </Badge>
  );
}