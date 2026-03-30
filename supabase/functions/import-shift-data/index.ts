import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FirebaseShiftData {
  date: any; // Firebase Timestamp
  shift: string;
  operator: string;
  timeStart: string;
  timeFinish: string;
  hoursWorked: number;
  hoursBooked: number;
  comments?: string;
  activities?: {
    [key: string]: Array<{
      UnitsProduced?: number;
      Scrap?: number;
      Sku?: string;
      TimeSpent?: number;
      InvoiceNumber?: string;
      BoxesComplete?: number;
    }>;
  };
}

interface TransformedShiftData {
  shift_date: string;
  shift_type: string;
  start_time: string; // Now stores full ISO timestamp
  end_time: string;   // Now stores full ISO timestamp
  operator_id: string | null;
  machine_id: string | null;
  production_data: any;
  notes: string | null;
  user_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { shiftData, userId } = await req.json();
    
    if (!Array.isArray(shiftData)) {
      throw new Error('Shift data must be an array');
    }

    console.log(`Processing ${shiftData.length} shift records for user ${userId}`);

    // Get existing operators and machines for mapping
    const { data: operators } = await supabaseClient
      .from('operators')
      .select('id, operator_name, operator_code');
    
    const { data: machines } = await supabaseClient
      .from('machines')
      .select('id, machine_name, machine_code');

    const operatorMap = new Map();
    operators?.forEach(op => {
      operatorMap.set(op.operator_name.toLowerCase(), op.id);
      operatorMap.set(op.operator_code.toLowerCase(), op.id);
    });

    const machineMap = new Map();
    machines?.forEach(machine => {
      machineMap.set(machine.machine_name.toLowerCase(), machine.id);
      machineMap.set(machine.machine_code.toLowerCase(), machine.id);
    });

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    const transformedRecords: TransformedShiftData[] = [];

    // Helper function to convert Firebase timestamp
    const convertFirebaseTimestamp = (timestamp: any): string => {
      if (!timestamp) return new Date().toISOString().split('T')[0];
      
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toISOString().split('T')[0];
      }
      
      if (typeof timestamp === 'string') {
        // Handle different date formats
        const trimmed = timestamp.trim();
        
        // Try DD/MM/YYYY format first (common in CSV exports)
        const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (ddmmyyyyMatch) {
          const [, day, month, year] = ddmmyyyyMatch;
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        }
        
        // Try MM/DD/YYYY format
        const mmddyyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (mmddyyyyMatch) {
          const [, month, day, year] = mmddyyyyMatch;
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        }
        
        // Try YYYY-MM-DD format (ISO format)
        const isoMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}$/);
        if (isoMatch) {
          const date = new Date(trimmed);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        }
        
        // Fallback to JavaScript Date parsing
        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
        
        throw new Error(`Unable to parse date format: "${trimmed}"`);
      }
      
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toISOString().split('T')[0];
      }
      
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      
      throw new Error(`Invalid timestamp format: ${timestamp}`);
    };

    for (const [index, record] of shiftData.entries()) {
      try {
        console.log(`Processing record ${index + 1}:`, {
          hasDate: !!record.date,
          dateType: typeof record.date,
          hasSeconds: record.date?.seconds,
          shift: record.shift,
          operator: record.operator,
          timeStart: record.timeStart,
          timeFinish: record.timeFinish
        });

        // Convert Firebase timestamp to date string
        let shiftDate: string;
        try {
          shiftDate = convertFirebaseTimestamp(record.date);
        } catch (dateError) {
          results.errors.push(`Record ${index + 1}: Invalid date format - ${dateError.message}`);
          results.skipped++;
          continue;
        }

        // Validate required fields
        if (!record.shift || !record.timeStart || !record.timeFinish) {
          const missing = [];
          if (!record.shift) missing.push('shift');
          if (!record.timeStart) missing.push('timeStart');
          if (!record.timeFinish) missing.push('timeFinish');
          results.errors.push(`Record ${index + 1}: Missing required fields: ${missing.join(', ')}`);
          results.skipped++;
          continue;
        }

        // Map operator with better logging
        const operatorId = record.operator ? 
          operatorMap.get(record.operator.toLowerCase()) : null;
        
        if (record.operator && !operatorId) {
          console.log(`Operator "${record.operator}" not found in database. Available operators:`, 
            Array.from(operatorMap.keys()));
        }

        // Normalize shift type
        const shiftType = record.shift === 'Days' ? 'Day' : 
                         record.shift === 'Nights' ? 'Night' : record.shift;

        // Process activities data with enhanced Firebase handling
        const productionData: any = {
          hours_worked: record.hoursWorked || 0,
          hours_booked: record.hoursBooked || 0,
          activities: {},
          totals: {
            pieces_produced: 0,
            scrap_count: 0,
            boxes_completed: 0,
          },
          firebase_id: record.firebaseId || null,
          raw_activities: record.activities || null,
          has_activities: !!(record.activities && Object.keys(record.activities).length > 0)
        };

        // Process subcollection activities with better error handling
        if (record.activities && Object.keys(record.activities).length > 0) {
          try {
            for (const [activityType, activities] of Object.entries(record.activities)) {
              if (Array.isArray(activities)) {
                productionData.activities[activityType] = activities;
                
                // Calculate totals with error handling
                activities.forEach((activity: any, actIndex: number) => {
                  try {
                    if (activity.UnitsProduced && !isNaN(Number(activity.UnitsProduced))) {
                      productionData.totals.pieces_produced += Number(activity.UnitsProduced);
                    }
                    if (activity.Scrap && !isNaN(Number(activity.Scrap))) {
                      productionData.totals.scrap_count += Number(activity.Scrap);
                    }
                    if (activity.BoxesComplete && !isNaN(Number(activity.BoxesComplete))) {
                      productionData.totals.boxes_completed += Number(activity.BoxesComplete);
                    }
                  } catch (activityError) {
                    console.log(`Warning: Error processing activity ${actIndex} in ${activityType}:`, activityError);
                  }
                });
              } else {
                console.log(`Warning: Activities for ${activityType} is not an array:`, activities);
              }
            }
          } catch (activitiesError) {
            console.log(`Warning: Error processing activities for record ${index + 1}:`, activitiesError);
          }
        }

        // Create timezone-aware timestamps for start and end times
        const startTimestamp = new Date(`${shiftDate}T${record.timeStart}`).toISOString();
        let endTimestamp = new Date(`${shiftDate}T${record.timeFinish}`).toISOString();
        
        // Handle overnight shifts
        if (record.timeFinish < record.timeStart) {
          const endDate = new Date(`${shiftDate}T${record.timeFinish}`);
          endDate.setDate(endDate.getDate() + 1);
          endTimestamp = endDate.toISOString();
        }

        const transformedRecord: TransformedShiftData = {
          shift_date: shiftDate,
          shift_type: shiftType,
          start_time: startTimestamp,
          end_time: endTimestamp,
          operator_id: operatorId,
          machine_id: null, // Will be mapped later if needed
          production_data: productionData,
          notes: record.comments || null,
          user_id: userId,
        };

        transformedRecords.push(transformedRecord);
        console.log(`Successfully transformed record ${index + 1}`);
        
      } catch (error) {
        results.errors.push(`Record ${index + 1}: ${error.message}`);
        results.skipped++;
        console.error(`Error processing record ${index + 1}:`, error);
      }
    }

    // Batch insert the transformed records
    if (transformedRecords.length > 0) {
      const { data, error } = await supabaseClient
        .from('shift_records')
        .insert(transformedRecords)
        .select();

      if (error) {
        console.error('Database insertion error:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to insert records', 
            details: error.message,
            results 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      results.imported = data?.length || 0;
    }

    console.log('Import completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: `Import completed: ${results.imported} imported, ${results.skipped} skipped`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Import shift data error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});