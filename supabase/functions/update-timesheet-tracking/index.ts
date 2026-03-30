import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting timesheet tracking update...');

    // Call the database function to update timesheet tracking
    const { data, error } = await supabase.rpc('update_timesheet_tracking');

    if (error) {
      console.error('Error updating timesheet tracking:', error);
      throw error;
    }

    console.log('Timesheet tracking update completed successfully');

    // Also populate historical data if this is the first run
    const { data: existingTracking, error: checkError } = await supabase
      .from('timesheet_tracking')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing tracking:', checkError);
      throw checkError;
    }

    // If no tracking records exist, populate historical data
    if (!existingTracking || existingTracking.length === 0) {
      console.log('No existing tracking records found, populating historical data...');
      
      // Get all past time events that don't have corresponding shift records
      const { data: historicalData, error: histError } = await supabase
        .from('clockfy_time_events')
        .select(`
          operator_id,
          clock_in,
          shift_records!left(id, shift_date, operator_id)
        `)
        .not('operator_id', 'is', null)
        .lt('clock_in', new Date().toISOString().split('T')[0]);

      if (histError) {
        console.error('Error fetching historical data:', histError);
        throw histError;
      }

      // Process historical data to create tracking records
      const trackingRecords = [];
      const processedDates = new Set();

      for (const event of historicalData || []) {
        const workDate = new Date(event.clock_in).toISOString().split('T')[0];
        const key = `${event.operator_id}-${workDate}`;
        
        if (!processedDates.has(key)) {
          processedDates.add(key);
          
          // Check if there's a shift record for this operator and date
          const hasShiftRecord = event.shift_records && event.shift_records.length > 0;
          const daysOverdue = hasShiftRecord ? 0 : Math.floor((new Date().getTime() - new Date(workDate).getTime()) / (1000 * 60 * 60 * 24));
          
          let escalationLevel = 'none';
          if (!hasShiftRecord) {
            if (daysOverdue >= 2) escalationLevel = 'critical';
            else if (daysOverdue === 1) escalationLevel = 'late';
            else escalationLevel = 'none';
          }

          trackingRecords.push({
            operator_id: event.operator_id,
            work_date: workDate,
            clockfy_events_exist: true,
            timesheet_submitted: hasShiftRecord,
            timesheet_submitted_at: hasShiftRecord ? new Date().toISOString() : null,
            days_overdue: daysOverdue,
            escalation_level: escalationLevel
          });
        }
      }

      if (trackingRecords.length > 0) {
        console.log(`Inserting ${trackingRecords.length} historical tracking records...`);
        
        const { error: insertError } = await supabase
          .from('timesheet_tracking')
          .insert(trackingRecords);

        if (insertError) {
          console.error('Error inserting historical tracking records:', insertError);
          throw insertError;
        }

        console.log('Historical tracking records inserted successfully');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Timesheet tracking updated successfully',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in update-timesheet-tracking function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});