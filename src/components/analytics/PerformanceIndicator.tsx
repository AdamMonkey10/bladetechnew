import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PerformanceIndicatorProps {
  label: string;
  value: number;
  previousValue?: number;
  type: 'percentage' | 'number' | 'currency';
  target?: number;
  className?: string;
}

export function PerformanceIndicator({ 
  label, 
  value, 
  previousValue, 
  type, 
  target,
  className = "" 
}: PerformanceIndicatorProps) {
  const formatValue = (val: number) => {
    switch (type) {
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'currency':
        return `$${val.toLocaleString()}`;
      default:
        return val.toLocaleString();
    }
  };

  const getTrendIcon = () => {
    if (previousValue === undefined || previousValue === 0) return null;
    
    const change = ((value - previousValue) / previousValue) * 100;
    if (Math.abs(change) < 1) return <Minus className="h-3 w-3 text-muted-foreground" />;
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    return <TrendingDown className="h-3 w-3 text-red-600" />;
  };

  const getTrendBadge = () => {
    if (previousValue === undefined || previousValue === 0) return null;
    
    const change = ((value - previousValue) / previousValue) * 100;
    if (Math.abs(change) < 1) return null;
    
    const variant = change > 0 ? "default" : "destructive";
    const sign = change > 0 ? "+" : "";
    
    return (
      <Badge variant={variant} className="text-xs ml-2">
        {sign}{change.toFixed(1)}% vs last wk
      </Badge>
    );
  };

  const getPerformanceColor = () => {
    if (type === 'percentage') {
      if (value >= 85) return "text-green-600";
      if (value >= 70) return "text-yellow-600";
      return "text-red-600";
    }
    return "text-foreground";
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex items-center">
          {getTrendIcon()}
        </div>
      </div>
      
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className={`text-2xl font-bold ${getPerformanceColor()}`}>
          {formatValue(value)}
        </span>
        {getTrendBadge()}
      </div>
      
      {previousValue !== undefined && previousValue > 0 && (
        <span className="text-xs text-muted-foreground">
          was {formatValue(previousValue)}
        </span>
      )}
    </div>
  );
}
