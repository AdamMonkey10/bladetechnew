import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Clock, User, AlertTriangle, Edit3, Save, X, Package } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { validateNightShiftTimes, calculateShiftEndTime } from "@/utils/dataValidation";
import { usePrintedLabelsByOperatorDate } from "@/hooks/usePrintedLabels";

interface TimesheetEditDialogProps {
  record: any;
  onClose: () => void;
  onSave: () => void;
}

interface ShiftRecord {
  id?: string;
  user_id?: string;
  shift_date: string;
  shift_type: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  production_data?: any;
}

interface ClockfyEvent {
  id: string;
  clock_in: string;
  clock_out?: string;
  total_hours?: number;
}

export function TimesheetEditDialog({ record, onClose, onSave }: TimesheetEditDialogProps) {
  const { toast } = useToast();
  
  // Helper function to safely format dates
  const safeFormatDate = (dateValue: string | null | undefined, formatString: string = "HH:mm") => {
    if (!dateValue) return "";
    try {
      const date = new Date(dateValue);
      if (!isValid(date)) return "";
      return format(date, formatString);
    } catch (error) {
      console.warn("Invalid date value:", dateValue, error);
      return "";
    }
  };
  
  // State for form data
  const [workDate, setWorkDate] = useState<Date>(() => {
    try {
      const date = new Date(record.work_date);
      return isValid(date) ? date : new Date();
    } catch {
      return new Date();
    }
  });
  const [shiftType, setShiftType] = useState("Day");
  const [notes, setNotes] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // State for additional data
  const [shiftRecord, setShiftRecord] = useState<ShiftRecord | null>(null);
  const [clockfyEvents, setClockfyEvents] = useState<ClockfyEvent[]>([]);
  const [operatorName, setOperatorName] = useState("");
  const [timeSubmitted, setTimeSubmitted] = useState(record.timesheet_submitted || false);
  
  // Fetch printed labels for this operator and date
  const printedLabelsQuery = usePrintedLabelsByOperatorDate(
    operatorName,
    record.work_date
  );
  
  // State for production data editing
  const [editingProduction, setEditingProduction] = useState(false);
  const [editableProductionData, setEditableProductionData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);

  // Fetch products for SKU dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, product_code, product_name, box_amount')
        .order('product_code');
      if (data) setProducts(data);
    };
    fetchProducts();
  }, []);

  // Fetch complete timesheet data
  useEffect(() => {
    const fetchCompleteData = async () => {
      setLoading(true);
      try {
        // Fetch operator name
        if (record.operator_id) {
          const { data: operator } = await supabase
            .from('operators')
            .select('operator_name')
            .eq('id', record.operator_id)
            .maybeSingle();
          
          if (operator) {
            setOperatorName(operator.operator_name);
          }
        }

        // Fetch existing shift record if it exists
        const { data: existingShift } = await supabase
          .from('shift_records')
          .select('*')
          .eq('operator_id', record.operator_id)
          .eq('shift_date', record.work_date)
          .maybeSingle();

        if (existingShift) {
          setShiftRecord(existingShift);
          setShiftType(existingShift.shift_type || "Day");
          setNotes(existingShift.notes || "");
          if (existingShift.start_time) {
            setStartTime(safeFormatDate(existingShift.start_time));
          }
          if (existingShift.end_time) {
            setEndTime(safeFormatDate(existingShift.end_time));
          }
          // Initialize editable production data
          if (existingShift.production_data) {
            setEditableProductionData(JSON.parse(JSON.stringify(existingShift.production_data)));
          }
        }

        // Fetch clockfy events for this date
        const { data: events } = await supabase
          .from('clockfy_time_events')
          .select('*')
          .eq('operator_id', record.operator_id)
          .gte('clock_in', `${record.work_date}T00:00:00`)
          .lt('clock_in', `${record.work_date}T23:59:59`)
          .order('clock_in');

        if (events) {
          setClockfyEvents(events);
          
          // If no manual times set and we have clockfy data, use those as defaults
          if (!existingShift && events.length > 0) {
            const firstEvent = events[0];
            const lastEvent = events[events.length - 1];
            const startTimeFormatted = safeFormatDate(firstEvent.clock_in);
            if (startTimeFormatted) setStartTime(startTimeFormatted);
            if (lastEvent.clock_out) {
              const endTimeFormatted = safeFormatDate(lastEvent.clock_out);
              if (endTimeFormatted) setEndTime(endTimeFormatted);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching timesheet data:", error);
        toast({
          title: "Error",
          description: "Failed to load timesheet data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCompleteData();
  }, [record, toast]);

  const populateFromPrintedLabels = () => {
    const printedLabels = printedLabelsQuery.data || [];
    
    if (printedLabels.length === 0) {
      toast({
        title: 'No printed labels found',
        description: `No printed labels found for ${operatorName} on ${record.work_date}`,
        variant: 'default'
      });
      return;
    }

    // Group printed labels by laser, SKU, and invoice
    const groupedData = printedLabels.reduce((acc, label) => {
      const key = `${label.laser}-${label.sku}-${label.invoice || 'no-invoice'}`;
      if (!acc[key]) {
        acc[key] = {
          laser: label.laser,
          sku: label.sku,
          invoice: label.invoice || '',
          totalQuantity: 0,
          boxCount: 0
        };
      }
      acc[key].totalQuantity += label.quantity;
      acc[key].boxCount += 1;
      return acc;
    }, {} as Record<string, { laser: string, sku: string, invoice: string, totalQuantity: number, boxCount: number }>);

    // Map laser names to activity names
    const laserToActivityMap: Record<string, string> = {
      'Laser1': 'Laser1',
      'Laser2': 'Laser2', 
      'Laser3': 'Laser3',
      'Laser 1': 'Laser1',
      'Laser 2': 'Laser2',
      'Laser 3': 'Laser3'
    };

    // Create activities from grouped data
    const activities: any[] = [];
    const sortedEntries = Object.values(groupedData).sort((a, b) => {
      if (a.laser !== b.laser) return a.laser.localeCompare(b.laser);
      if (a.sku !== b.sku) return a.sku.localeCompare(b.sku);
      return a.invoice.localeCompare(b.invoice);
    });

    // Group entries by activity
    const activitiesMap: Record<string, any[]> = {};
    sortedEntries.forEach(({ laser, sku, invoice, totalQuantity, boxCount }) => {
      const activityName = laserToActivityMap[laser] || laser;
      if (!activitiesMap[activityName]) {
        activitiesMap[activityName] = [];
      }
      
      // Calculate boxes complete
      const product = products.find(p => p.product_code === sku);
      const boxesComplete = product?.box_amount ? Math.floor(totalQuantity / product.box_amount) : 0;
      
      activitiesMap[activityName].push({
        sku,
        units_produced: totalQuantity,
        boxes_complete: boxesComplete,
        invoice_number: invoice || undefined,
        time_spent: 0,
        scrap: 0
      });
    });

    // Convert to activities array
    Object.entries(activitiesMap).forEach(([name, entries]) => {
      activities.push({ name, entries });
    });

    // Set the production data
    setEditableProductionData({
      activities,
      hours_booked: 0
    });
    setEditingProduction(true);

    toast({
      title: 'Production data auto-populated',
      description: `Created ${sortedEntries.length} entries from ${printedLabels.length} printed labels. Please add time spent for each activity.`,
    });
  };


  const handleSave = async () => {
    console.log('=== SAVE STARTED ===');
    console.log('shiftRecord:', shiftRecord);
    console.log('editableProductionData:', editableProductionData);
    console.log('editingProduction:', editingProduction);
    
    // Validation for night shifts
    if (startTime && endTime) {
      const validation = validateNightShiftTimes(startTime, endTime, record.work_date);
      
      if (!validation.isValid) {
        toast({
          title: "Validation Error",
          description: validation.errors.join(', '),
          variant: "destructive"
        });
        return;
      }

      if (validation.warnings.length > 0) {
        // Show warnings but don't block save
        console.log("Shift warnings:", validation.warnings);
      }
    }

    setSaving(true);
    try {
      // Prepare start and end timestamps with proper overnight handling
      let startDateTime = null;
      let endDateTime = null;
      
      if (startTime && endTime) {
        const { startDateTime: calcStart, endDateTime: calcEnd } = calculateShiftEndTime(
          startTime, 
          endTime, 
          record.work_date
        );
        startDateTime = calcStart;
        endDateTime = calcEnd;
      } else {
        // Fallback for partial times
        startDateTime = startTime ? `${record.work_date}T${startTime}:00` : null;
        endDateTime = endTime ? `${record.work_date}T${endTime}:00` : null;
      }

      // Calculate total hours from activities if production data was edited
      let finalProductionData = editableProductionData;
      console.log('editableProductionData before processing:', editableProductionData);
      
      if (finalProductionData && Array.isArray(finalProductionData.activities)) {
        let totalActivityHours = 0;
        finalProductionData.activities.forEach((activity: any) => {
          if (Array.isArray(activity.entries)) {
            activity.entries.forEach((entry: any) => {
              const timeSpent = parseFloat(entry.time_spent) || 0;
              console.log(`Adding time_spent: ${timeSpent} from activity: ${activity.name}`);
              totalActivityHours += timeSpent;
            });
          }
        });
        finalProductionData.hours_booked = totalActivityHours;
        console.log('Calculated total hours from production data:', totalActivityHours);
        console.log('Final production data to save:', finalProductionData);
      }

      // Check what we're actually going to save
      const saveData = {
        shift_type: shiftType,
        start_time: startDateTime,
        end_time: endDateTime,
        notes,
        production_data: finalProductionData
      };
      console.log('=== DATA TO SAVE ===', saveData);

      // Update or create shift record with ALL data (timesheet + production)
      if (shiftRecord) {
        // Check current user vs record user_id for RLS debugging
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Current user ID:', user?.id);
        console.log('Record user_id:', shiftRecord.user_id);
        console.log('User IDs match:', user?.id === shiftRecord.user_id);
        
        // Update existing shift record
        console.log('UPDATING existing shift record ID:', shiftRecord.id);
        const { data: updatedData, error } = await supabase
          .from('shift_records')
          .update(saveData)
          .eq('id', shiftRecord.id)
          .select();

        console.log('UPDATE RESULT:', { data: updatedData, error });
        console.log('Rows affected:', updatedData?.length || 0);
        if (error) throw error;
        
        // Update local state with the saved data
        setShiftRecord(prev => prev ? {
          ...prev,
          production_data: finalProductionData,
          shift_type: shiftType,
          start_time: startDateTime,
          end_time: endDateTime,
          notes
        } : null);
        
      } else if (startTime || endTime || notes || shiftType !== "Day" || finalProductionData) {
        // Create new shift record if we have data to save
        console.log('CREATING new shift record with production data:', finalProductionData);
        const { data: newRecord, error } = await supabase
          .from('shift_records')
          .insert({
            operator_id: record.operator_id,
            shift_date: record.work_date,
            shift_type: shiftType,
            start_time: startDateTime,
            end_time: endDateTime,
            notes,
            production_data: finalProductionData, // This will save the production data
            user_id: (await supabase.auth.getUser()).data.user?.id
          })
          .select()
          .single();

        console.log('CREATE RESULT:', { data: newRecord, error });
        if (error) throw error;
        setShiftRecord(newRecord);
      }

      // Update timesheet tracking if submission status changed
      if (timeSubmitted !== record.timesheet_submitted) {
        const { error } = await supabase
          .from('timesheet_tracking')
          .update({
            timesheet_submitted: timeSubmitted,
            timesheet_submitted_at: timeSubmitted ? new Date().toISOString() : null,
            days_overdue: timeSubmitted ? 0 : record.days_overdue,
            escalation_level: timeSubmitted ? 'none' : record.escalation_level
          })
          .eq('id', record.id);

        if (error) throw error;
      }

      // Reset editing state
      setEditingProduction(false);

      console.log('=== SAVE COMPLETED SUCCESSFULLY ===');
      toast({
        title: "Success",
        description: "Timesheet and production data updated successfully"
      });
      
      console.log("Calling onSave callback...");
      await onSave();
    } catch (error) {
      console.error("=== SAVE ERROR ===", error);
      toast({
        title: "Error",
        description: "Failed to save timesheet",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-[700px]">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading timesheet data...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Timesheet
          </DialogTitle>
          <DialogDescription>
            Modify timesheet details for <strong>{operatorName || "Unknown Operator"}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Submission Status:</span>
                <Badge variant={record.timesheet_submitted ? "default" : "destructive"}>
                  {record.timesheet_submitted ? "Submitted" : "Not Submitted"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Escalation Level:</span>
                <Badge variant={
                  record.escalation_level === 'critical' ? "destructive" :
                  record.escalation_level === 'urgent' ? "secondary" :
                  record.escalation_level === 'warning' ? "outline" : "default"
                }>
                  {record.escalation_level || 'none'}
                </Badge>
              </div>
              {record.days_overdue > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Days Overdue:</span>
                  <Badge variant="destructive">{record.days_overdue}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clockfy Data */}
          {clockfyEvents.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Clockfy Time Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {clockfyEvents.map((event, index) => (
                    <div key={event.id} className="flex items-center justify-between text-sm">
                      <span>Event {index + 1}:</span>
                      <span>
                        {safeFormatDate(event.clock_in)} - {" "}
                        {event.clock_out ? safeFormatDate(event.clock_out) : "Still clocked in"}
                        {event.total_hours && ` (${event.total_hours.toFixed(2)}h)`}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>Total Hours:</span>
                      <span>
                        {clockfyEvents.reduce((total, event) => total + (event.total_hours || 0), 0).toFixed(2)}h
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Production Data */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm">Production Data & Hours Booked</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={populateFromPrintedLabels}
                  disabled={!printedLabelsQuery.data || printedLabelsQuery.data.length === 0 || editingProduction}
                  title={printedLabelsQuery.data?.length ? `${printedLabelsQuery.data.length} boxes found` : 'No boxes found'}
                >
                  <Package className="h-4 w-4 mr-1" />
                  Call Boxes ({printedLabelsQuery.data?.length || 0})
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (editingProduction) {
                      // Cancel editing
                      if (shiftRecord?.production_data) {
                        setEditableProductionData(JSON.parse(JSON.stringify(shiftRecord.production_data)));
                      } else {
                        setEditableProductionData(null);
                      }
                      setEditingProduction(false);
                    } else {
                      // Start editing - create default structure if none exists
                      if (!editableProductionData) {
                        setEditableProductionData({
                          activities: [
                            {
                              name: "Laser1",
                              entries: [{ sku: "", units_produced: 0, time_spent: 0, scrap: 0 }]
                            }
                          ],
                          hours_booked: 0
                        });
                      }
                      setEditingProduction(true);
                    }
                  }}
                >
                  {editingProduction ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                  {editingProduction ? "Cancel" : "Edit"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {shiftRecord?.production_data || editableProductionData ? (
                <div className="space-y-3">
                  {/* Hours booked display */}
                  <div className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                    <span className="text-muted-foreground">Total Hours Booked:</span>
                    <span className="font-medium text-lg">
                      {(() => {
                        const data = editingProduction ? editableProductionData : shiftRecord?.production_data;
                        if (data?.activities && Array.isArray(data.activities)) {
                          const total = data.activities.reduce((sum: number, activity: any) => {
                            if (Array.isArray(activity.entries)) {
                              return sum + activity.entries.reduce((entrySum: number, entry: any) => {
                                return entrySum + (parseFloat(entry.time_spent) || 0);
                              }, 0);
                            }
                            return sum;
                          }, 0);
                          return `${total.toFixed(1)}h`;
                        }
                        return `${data?.hours_booked || 0}h`;
                      })()}
                    </span>
                  </div>
                  
                  {/* Activities */}
                  {(editingProduction ? editableProductionData : shiftRecord?.production_data)?.activities && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Activities:</h4>
                      {Array.isArray((editingProduction ? editableProductionData : shiftRecord?.production_data)?.activities) ? 
                        (editingProduction ? editableProductionData : shiftRecord?.production_data)?.activities.map((activity: any, activityIdx: number) => (
                          <div key={activityIdx} className="pl-2 border-l-2 border-muted">
                            <div className="text-sm font-medium text-primary">{activity.name}</div>
                             {Array.isArray(activity.entries) && activity.entries.map((entry: any, entryIdx: number) => (
                              <div key={entryIdx} className="bg-muted/50 rounded p-2 ml-2 mt-1 space-y-2">
                                {editingProduction ? (
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <Label>SKU</Label>
                                      <Select
                                        value={entry.sku || ""}
                                        onValueChange={(value) => {
                                          const newActivities = [...editableProductionData.activities];
                                          newActivities[activityIdx].entries[entryIdx].sku = value;
                                          
                                          // Auto-calculate boxes for laser activities
                                          if (['Laser1', 'Laser2', 'Laser3'].includes(activity.name)) {
                                            const product = products.find(p => p.product_code === value);
                                            const unitsProduced = newActivities[activityIdx].entries[entryIdx].units_produced || 0;
                                            if (product?.box_amount && unitsProduced > 0) {
                                              newActivities[activityIdx].entries[entryIdx].boxes_complete = Math.floor(unitsProduced / product.box_amount);
                                            }
                                          }
                                          
                                          setEditableProductionData(prev => ({
                                            ...prev,
                                            activities: newActivities
                                          }));
                                        }}
                                      >
                                        <SelectTrigger className="h-7">
                                          <SelectValue placeholder="Select SKU" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {products.map((product) => (
                                            <SelectItem key={product.id} value={product.product_code}>
                                              {product.product_code} - {product.product_name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label>Units</Label>
                                      <Input
                                        type="number"
                                        value={entry.units_produced || ""}
                                        onChange={(e) => {
                                          const newActivities = [...editableProductionData.activities];
                                          const value = e.target.value ? parseInt(e.target.value) : 0;
                                          newActivities[activityIdx].entries[entryIdx].units_produced = value;
                                          
                                          // Auto-calculate boxes for laser activities
                                          if (['Laser1', 'Laser2', 'Laser3'].includes(activity.name)) {
                                            const product = products.find(p => p.product_code === entry.sku);
                                            if (product?.box_amount && value > 0) {
                                              newActivities[activityIdx].entries[entryIdx].boxes_complete = Math.floor(value / product.box_amount);
                                            }
                                          }
                                          
                                          setEditableProductionData(prev => ({
                                            ...prev,
                                            activities: newActivities
                                          }));
                                        }}
                                        className="h-7"
                                      />
                                    </div>
                                    {['Laser1', 'Laser2', 'Laser3'].includes(activity.name) && (
                                      <div>
                                        <Label>Boxes Complete</Label>
                                        <Input
                                          type="number"
                                          value={entry.boxes_complete || ""}
                                          onChange={(e) => {
                                            const newActivities = [...editableProductionData.activities];
                                            newActivities[activityIdx].entries[entryIdx].boxes_complete = e.target.value ? parseInt(e.target.value) : 0;
                                            setEditableProductionData(prev => ({
                                              ...prev,
                                              activities: newActivities
                                            }));
                                          }}
                                          className="h-7"
                                        />
                                      </div>
                                    )}
                                    <div>
                                      <Label>Time Spent (hours)</Label>
                                      <Input
                                        type="number"
                                        step="0.1"
                                        value={entry.time_spent || ""}
                                        onChange={(e) => {
                                          const newActivities = [...editableProductionData.activities];
                                          newActivities[activityIdx].entries[entryIdx].time_spent = e.target.value ? parseFloat(e.target.value) : 0;
                                          setEditableProductionData(prev => ({
                                            ...prev,
                                            activities: newActivities
                                          }));
                                        }}
                                        className="h-7"
                                      />
                                    </div>
                                    <div>
                                      <Label>Scrap</Label>
                                      <Input
                                        type="number"
                                        value={entry.scrap || ""}
                                        onChange={(e) => {
                                          const newActivities = [...editableProductionData.activities];
                                          newActivities[activityIdx].entries[entryIdx].scrap = e.target.value ? parseInt(e.target.value) : 0;
                                          setEditableProductionData(prev => ({
                                            ...prev,
                                            activities: newActivities
                                          }));
                                        }}
                                        className="h-7"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-xs space-y-1">
                                    {entry.sku && <div><span className="font-medium">SKU:</span> {entry.sku}</div>}
                                    {entry.units_produced && <div><span className="font-medium">Units:</span> {entry.units_produced}</div>}
                                    {entry.boxes_complete && <div><span className="font-medium">Boxes:</span> {entry.boxes_complete}</div>}
                                    {entry.time_spent && <div><span className="font-medium">Time:</span> {entry.time_spent}h</div>}
                                    {entry.scrap && <div><span className="font-medium">Scrap:</span> {entry.scrap}</div>}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )) :
                        // Fallback for legacy format (display only)
                        Object.entries((shiftRecord?.production_data?.activities || {})).map(([activityType, activities]: [string, any]) => (
                          <div key={activityType} className="pl-2 border-l-2 border-muted">
                            <div className="text-sm font-medium text-primary">{activityType}</div>
                            {Array.isArray(activities) && activities.map((activity: any, index: number) => (
                              <div key={index} className="text-xs text-muted-foreground pl-2 space-y-1">
                                {activity.sku && <div>SKU: {activity.sku}</div>}
                                {activity.UnitsProduced && <div>Units: {activity.UnitsProduced}</div>}
                                {activity.TimeSpent && <div>Time: {activity.TimeSpent}h</div>}
                                {activity.Scrap && <div>Scrap: {activity.Scrap}</div>}
                              </div>
                            ))}
                          </div>
                        ))
                      }

                      {editingProduction && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newActivity = {
                                name: "Laser2",
                                entries: [{ sku: "", units_produced: 0, time_spent: 0, scrap: 0 }]
                              };
                              setEditableProductionData(prev => ({
                                ...prev,
                                activities: [...(prev?.activities || []), newActivity]
                              }));
                            }}
                          >
                            Add Activity
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No production data found for this timesheet.
                    <br />
                    Add production activities to track hours booked.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditableProductionData({
                        activities: [
                          {
                            name: "Laser1",
                            entries: [{ sku: "", units_produced: 0, time_spent: 0, scrap: 0 }]
                          }
                        ],
                        hours_booked: 0
                      });
                      setEditingProduction(true);
                    }}
                  >
                    Add Production Data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Form Fields */}
          <div className="grid gap-4">
            {/* Work Date */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="workDate" className="text-right">
                Work Date
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !workDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {workDate ? format(workDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={workDate}
                      onSelect={(date) => date && setWorkDate(date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Submission Status */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="submitted" className="text-right">
                Mark as Submitted
              </Label>
              <div className="col-span-3">
                <Select value={timeSubmitted.toString()} onValueChange={(value) => setTimeSubmitted(value === 'true')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes - Timesheet Submitted</SelectItem>
                    <SelectItem value="false">No - Not Submitted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Shift Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shiftType" className="text-right">
                Shift Type
              </Label>
              <div className="col-span-3">
                <Select value={shiftType} onValueChange={setShiftType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select shift type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Day">Day Shift</SelectItem>
                    <SelectItem value="Night">Night Shift</SelectItem>
                    <SelectItem value="Weekend">Weekend</SelectItem>
                    <SelectItem value="Overtime">Overtime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Start Time */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">
                Start Time
              </Label>
              <div className="col-span-3">
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="From Clockfy data if available"
                />
              </div>
            </div>

            {/* End Time */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endTime" className="text-right">
                End Time
              </Label>
              <div className="col-span-3">
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="From Clockfy data if available"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this timesheet..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}