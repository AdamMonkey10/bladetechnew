import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Clock, CheckCircle, AlertCircle, AlertTriangle, Triangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ClockStatus } from '@/hooks/useClockStatus';
import { useTimesheetTracking } from '@/hooks/useTimesheetTracking';
import { MissingTimesheetsDialog, MissingTimesheetDetails } from './MissingTimesheetsDialog';
import { cn } from '@/lib/utils';

interface Operator {
  id: string;
  operator_name: string;
  operator_code: string;
}

interface OperatorCardProps {
  operator: Operator;
  clockStatus?: ClockStatus;
}

export function OperatorCard({ operator, clockStatus }: OperatorCardProps) {
  const navigate = useNavigate();
  const { getOperatorMissingTimesheets } = useTimesheetTracking();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [missingTimesheets, setMissingTimesheets] = useState<MissingTimesheetDetails[]>([]);
  const [loadingTimesheets, setLoadingTimesheets] = useState(false);
  
  const isActive = clockStatus?.isActive || false;
  const needsTimesheet = clockStatus?.needsTimesheet || false;
  const overdueTimesheets = clockStatus?.overdueTimesheets || 0;
  const highestEscalation = clockStatus?.highestEscalation || 'none';

  const hasAnyIssues = needsTimesheet || overdueTimesheets > 0;

  const handleCardClick = () => {
    // Always navigate to timesheet form - warnings are just visual indicators
    navigate(`/shifts/${operator.operator_code}`);
  };

  const handleMissingTimesheetsClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    // Get missing timesheets to find the oldest date
    setLoadingTimesheets(true);
    const timesheets = await getOperatorMissingTimesheets(operator.id);
    
    // If there's only one overdue timesheet, navigate directly to that date
    if (overdueTimesheets === 1 && timesheets.length > 0) {
      const oldestDate = timesheets[0].work_date; // Already sorted by date
      navigate(`/shifts/${operator.operator_code}/${oldestDate}`);
      setLoadingTimesheets(false);
      return;
    }
    
    // Otherwise, show the dialog with all missing timesheets
    setMissingTimesheets(timesheets);
    setIsDialogOpen(true);
    setLoadingTimesheets(false);
  };

  const getEscalationColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500 text-white';
      case 'urgent': return 'bg-orange-500 text-white';
      case 'warning': return 'bg-yellow-500 text-white';
      default: return 'bg-primary text-primary-foreground';
    }
  };

  const getEscalationIcon = (level: string) => {
    switch (level) {
      case 'critical': return Triangle;
      case 'urgent': return AlertTriangle;
      case 'warning': return AlertCircle;
      default: return AlertCircle;
    }
  };

  return (
    <>
      <Card 
        className={cn(
          "hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden",
          hasAnyIssues && "ring-2 ring-primary/30 shadow-lg border-primary/20",
          hasAnyIssues && "before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/5 before:to-transparent before:pointer-events-none"
        )} 
        onClick={handleCardClick}
      >
      <CardContent className="p-6 text-center relative z-10">
        {hasAnyIssues && (
          <div className="absolute top-2 right-2 z-20 space-y-1">
            {needsTimesheet && (
              <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 text-white block">
                <AlertCircle className="w-3 h-3 mr-1" />
                Today's Timesheet
              </Badge>
            )}
            {overdueTimesheets > 0 && (
              <Badge 
                className={cn("block cursor-pointer hover:opacity-80 transition-opacity", getEscalationColor(highestEscalation))}
                onClick={handleMissingTimesheetsClick}
              >
                {React.createElement(getEscalationIcon(highestEscalation), { className: "w-3 h-3 mr-1" })}
                {overdueTimesheets} Overdue
              </Badge>
            )}
          </div>
        )}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
              hasAnyIssues 
                ? "bg-primary/10 border-2 border-primary/30 shadow-md" 
                : "bg-muted"
            )}>
              <User className={cn(
                "w-8 h-8 transition-colors duration-300",
                hasAnyIssues ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            {clockStatus?.isActive && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{operator.operator_name}</h3>
            <p className="text-sm text-muted-foreground">Code: {operator.operator_code}</p>
          </div>
          
          {clockStatus && (
            <div className="w-full">
              {clockStatus.isActive ? (
                <div className="space-y-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Clock className="w-3 h-3 mr-1" />
                    Currently Working
                  </Badge>
                  {hasAnyIssues && (
                    <p className="text-xs font-medium text-orange-600">
                      {clockStatus.hoursWorked.toFixed(1)}h worked
                      {needsTimesheet && " • Today's timesheet pending"}
                      {overdueTimesheets > 0 && ` • ${overdueTimesheets} overdue`}
                    </p>
                  )}
                </div>
              ) : clockStatus.clockOut ? (
                <div className="space-y-2">
                  <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                    Clocked Out
                  </Badge>
                  {hasAnyIssues && (
                    <p className="text-xs font-medium text-orange-600">
                      {clockStatus.hoursWorked.toFixed(1)}h worked
                      {needsTimesheet && " • Today's timesheet pending"}
                      {overdueTimesheets > 0 && ` • ${overdueTimesheets} overdue`}
                    </p>
                  )}
                </div>
              ) : (
                <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                  Not Clocked In
                </Badge>
              )}
            </div>
          )}
          
          <Button 
            variant={hasAnyIssues ? "default" : "outline"} 
            size="sm"
            className={cn(
              "transition-all duration-300",
              hasAnyIssues && "bg-primary hover:bg-primary/90 shadow-md"
            )}
            disabled={loadingTimesheets}
          >
            {loadingTimesheets ? "Loading..." : "Open Timesheet"}
          </Button>
        </div>
      </CardContent>
    </Card>
    
    <MissingTimesheetsDialog
      isOpen={isDialogOpen}
      onClose={() => setIsDialogOpen(false)}
      operator={operator}
      missingTimesheets={missingTimesheets}
    />
    </>
  );
}