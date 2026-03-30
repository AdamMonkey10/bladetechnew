import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, CheckCircle, UserCheck } from 'lucide-react';
import { ShiftForm } from '@/components/forms/ShiftForm';
import { ShiftDataImport } from '@/components/import/ShiftDataImport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useClockStatus } from '@/hooks/useClockStatus';
import { usePrintedLabelsByOperatorDate } from '@/hooks/usePrintedLabels';
import { useAuth } from '@/hooks/useAuth';

interface Operator {
  id: string;
  operator_name: string;
  operator_code: string;
}

export default function OperatorTimesheet() {
  const { operatorCode, date } = useParams();
  const navigate = useNavigate();
  const [operator, setOperator] = useState<Operator | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingAdminTimesheet, setSubmittingAdminTimesheet] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { status: clockStatus, loading: clockLoading } = useClockStatus(operator?.id);
  
  // Check if operator has printed labels for today
  const today = new Date().toISOString().split('T')[0];
  const printedLabelsQuery = usePrintedLabelsByOperatorDate(operator?.operator_name, today);
  
  // Check if this is Matt (admin user)
  const isAdminUser = operator?.operator_code === 'MH';
  const hasLabelsToday = (printedLabelsQuery.data || []).length > 0;

  useEffect(() => {
    if (operatorCode) {
      fetchOperator();
    }
  }, [operatorCode]);

  const fetchOperator = async () => {
    try {
      const { data, error } = await supabase
        .from('operators')
        .select('id, operator_name, operator_code')
        .eq('operator_code', operatorCode)
        .eq('active', true)
        .single();

      if (error) throw error;

      setOperator(data);
    } catch (error) {
      console.error('Error fetching operator:', error);
      toast({
        title: 'Error',
        description: 'Operator not found or inactive',
        variant: 'destructive'
      });
      navigate('/shifts');
    } finally {
      setLoading(false);
    }
  };

  const handleDataChange = () => {
    // Callback for when data is updated - components handle their own refresh
  };

  const handleAdminQuickSubmit = async () => {
    if (!operator || !user) return;
    
    setSubmittingAdminTimesheet(true);
    
    try {
      // Check if timesheet already exists for today
      const { data: existingTimesheet, error: checkError } = await supabase
        .from('shift_records')
        .select('id')
        .eq('operator_id', operator.id)
        .eq('shift_date', today)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingTimesheet) {
        toast({
          title: 'Timesheet already exists',
          description: 'A timesheet has already been submitted for today',
          variant: 'destructive'
        });
        return;
      }

      // Get clock times if available
      let startTime = '07:00';
      let endTime = '17:00';
      let shiftType = 'Days';

      if (clockStatus?.clockIn) {
        const clockIn = new Date(clockStatus.clockIn);
        startTime = clockIn.toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
        shiftType = clockIn.getHours() < 12 ? 'Days' : 'Nights';
        
        if (clockStatus.clockOut) {
          const clockOut = new Date(clockStatus.clockOut);
          endTime = clockOut.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
          });
        }
      }

      // Submit minimal admin timesheet
      const { error: submitError } = await supabase
        .from('shift_records')
        .insert({
          operator_id: operator.id,
          shift_date: today,
          shift_type: shiftType,
          start_time: `${today}T${startTime}:00`,
          end_time: `${today}T${endTime}:00`,
          user_id: user.id,
          notes: 'Admin timesheet - no production activities',
          production_data: {
            activities: {}
          }
        });

      if (submitError) throw submitError;

      toast({
        title: 'Admin timesheet submitted',
        description: 'Empty timesheet successfully submitted for today',
      });

      handleDataChange();

    } catch (error) {
      console.error('Error submitting admin timesheet:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit admin timesheet',
        variant: 'destructive'
      });
    } finally {
      setSubmittingAdminTimesheet(false);
    }
  };

  if (loading || clockLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/shifts')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Operators
          </Button>
        </div>
        <p className="text-center text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!operator) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/shifts')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Operators
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {operator.operator_name} - Timesheet
            </h1>
            <p className="text-muted-foreground">
              Operator Code: {operator.operator_code} | Book time to activities and manage your shift data
            </p>
          </div>
        </div>
      </div>

      {clockStatus && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Clock Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {clockStatus.isActive ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Clocked In
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        Since {clockStatus.clockIn ? new Date(clockStatus.clockIn).toLocaleTimeString() : 'Unknown'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-5 w-5 rounded-full bg-gray-300"></div>
                    <div>
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                        Not Clocked In
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        No active session
                      </p>
                    </div>
                  </>
                )}
              </div>
              {clockStatus.isActive && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {clockStatus.hoursWorked.toFixed(1)}h
                  </div>
                  <p className="text-xs text-muted-foreground">Hours worked</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {isAdminUser && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <UserCheck className="h-5 w-5" />
              Admin Quick Submit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700 mb-2">
                  Submit an empty timesheet for administrative days with no production work
                </p>
                {hasLabelsToday && (
                  <p className="text-xs text-amber-600 bg-amber-100 p-2 rounded">
                    Note: You have printed labels today, consider using the regular timesheet form
                  </p>
                )}
              </div>
              <Button
                onClick={handleAdminQuickSubmit}
                disabled={submittingAdminTimesheet}
                variant={hasLabelsToday ? "outline" : "default"}
                className={hasLabelsToday ? "border-amber-300 text-amber-700 hover:bg-amber-100" : "bg-amber-600 text-white hover:bg-amber-700"}
              >
                {submittingAdminTimesheet ? 'Submitting...' : 'Submit Admin Timesheet'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="book" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="book">Book Time</TabsTrigger>
          <TabsTrigger value="import">Import Data</TabsTrigger>
        </TabsList>

        <TabsContent value="book" className="space-y-6">
          <ShiftForm preselectedOperator={operator} preselectedDate={date} onSuccess={handleDataChange} />
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <ShiftDataImport onSuccess={handleDataChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}