import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Calendar, AlertCircle, AlertTriangle, Triangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/utils/dateUtils';
import { format } from 'date-fns';

export interface MissingTimesheetDetails {
  work_date: string;
  clock_in: string;
  clock_out: string | null;
  hours_worked: number;
  escalation_level: 'none' | 'warning' | 'urgent' | 'critical';
  days_overdue: number;
}

interface MissingTimesheetsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  operator: {
    id: string;
    operator_name: string;
    operator_code: string;
  };
  missingTimesheets: MissingTimesheetDetails[];
}

export function MissingTimesheetsDialog({ 
  isOpen, 
  onClose, 
  operator, 
  missingTimesheets 
}: MissingTimesheetsDialogProps) {
  const navigate = useNavigate();

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

  const handleCreateTimesheet = (workDate: string) => {
    navigate(`/shifts/${operator.operator_code}/${workDate}`);
    onClose();
  };

  const formatTime = (timeString: string) => {
    return format(new Date(timeString), 'HH:mm');
  };

  const formatDateDisplay = (dateString: string) => {
    return formatDate(dateString, 'EEE, dd/MM/yyyy');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Missing Timesheets - {operator.operator_name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {missingTimesheets.length} work session{missingTimesheets.length !== 1 ? 's' : ''} missing timesheet{missingTimesheets.length !== 1 ? 's' : ''}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {missingTimesheets.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No missing timesheets found.</p>
              </CardContent>
            </Card>
          ) : (
            missingTimesheets.map((timesheet) => (
              <Card key={timesheet.work_date} className="border-l-4 border-l-orange-400">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{formatDateDisplay(timesheet.work_date)}</h3>
                        <Badge className={getEscalationColor(timesheet.escalation_level)}>
                          {React.createElement(getEscalationIcon(timesheet.escalation_level), { 
                            className: "w-3 h-3 mr-1" 
                          })}
                          {timesheet.days_overdue > 0 && `${timesheet.days_overdue} days overdue`}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-green-600" />
                          <span>Clock In: {formatTime(timesheet.clock_in)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-red-600" />
                          <span>
                            Clock Out: {timesheet.clock_out ? formatTime(timesheet.clock_out) : 'Still active'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <span className="text-sm font-medium">
                          Hours Worked: {timesheet.hours_worked.toFixed(2)}h
                        </span>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <Button 
                        onClick={() => handleCreateTimesheet(timesheet.work_date)}
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                      >
                        Create Timesheet
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}