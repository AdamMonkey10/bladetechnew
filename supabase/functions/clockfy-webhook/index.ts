import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ClockfyTimeRecord {
  id: string
  employee_id: string
  clock_in: string
  clock_out?: string
  total_hours?: number
}

interface ClockfyEmployee {
  id: string
  name: string
  email?: string
  pin?: string
  is_active: boolean
  deactivated_at?: string
}

interface ClockfyShiftAssignment {
  id: string
  employee_id: string
  shift_template_id?: string
  start_date: string
  end_date?: string
  shift_pattern?: any
}

interface WebhookPayload {
  event_type: 'time_record' | 'employee' | 'shift_assignment'
  data?: ClockfyTimeRecord | ClockfyEmployee | ClockfyShiftAssignment
  employee_data?: ClockfyEmployee
  time_record_data?: ClockfyTimeRecord
  shift_assignment_data?: ClockfyShiftAssignment
}

Deno.serve(async (req) => {
  console.log('🔥 Webhook request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  })

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled')
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    console.log('❌ Non-POST request rejected:', req.method)
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  let payload: WebhookPayload | null = null
  let supabase: any = null

  try {
    console.log('🔧 Initializing Supabase client...')
    supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    console.log('✅ Supabase client initialized')

    console.log('📦 Parsing request body...')
    const rawBody = await req.text()
    console.log('📄 Raw body:', rawBody)
    
    payload = JSON.parse(rawBody) as WebhookPayload
    console.log('✅ Parsed webhook payload:', JSON.stringify(payload, null, 2))

    // Normalize payload structure - handle different formats from Clockfy
    let actualData: ClockfyTimeRecord | ClockfyEmployee | ClockfyShiftAssignment
    
    if (payload.data) {
      actualData = payload.data
    } else if (payload.employee_data) {
      actualData = payload.employee_data
    } else if (payload.time_record_data) {
      actualData = payload.time_record_data
    } else if (payload.shift_assignment_data) {
      actualData = payload.shift_assignment_data
    } else {
      throw new Error('Invalid payload structure: no data found')
    }

    if (!actualData.id) {
      throw new Error('Invalid payload: missing data.id')
    }

    console.log('📝 Logging webhook event to sync_log...')
    const { data: logData, error: logError } = await supabase
      .from('clockfy_sync_log')
      .insert({
        event_type: payload.event_type,
        clockfy_id: actualData.id,
        payload: payload,
        processing_status: 'pending'
      })
      .select()

    if (logError) {
      console.error('❌ Error logging webhook:', logError)
      throw new Error(`Failed to log webhook: ${logError.message}`)
    }
    console.log('✅ Webhook logged successfully:', logData)

    console.log('🔄 Processing webhook based on event type:', payload.event_type)
    let result
    switch (payload.event_type) {
      case 'time_record':
        console.log('⏰ Processing time record...')
        result = await processTimeRecord(supabase, actualData as ClockfyTimeRecord)
        break
      case 'employee':
        console.log('👤 Processing employee...')
        result = await processEmployee(supabase, actualData as ClockfyEmployee)
        break
      case 'shift_assignment':
        console.log('📅 Processing shift assignment...')
        result = await processShiftAssignment(supabase, actualData as ClockfyShiftAssignment)
        break
      default:
        throw new Error(`Unknown event type: ${payload.event_type}`)
    }
    console.log('✅ Processing completed:', result)

    console.log('📝 Updating sync log with success...')
    const { error: updateError } = await supabase
      .from('clockfy_sync_log')
      .update({
        processing_status: 'success',
        processed_at: new Date().toISOString()
      })
      .eq('clockfy_id', actualData.id)
      .eq('event_type', payload.event_type)

    if (updateError) {
      console.error('⚠️ Error updating sync log:', updateError)
    } else {
      console.log('✅ Sync log updated successfully')
    }

    const response = {
      success: true,
      result,
      message: 'Webhook processed successfully',
      received_at: new Date().toISOString()
    }
    console.log('🎉 Webhook processing completed successfully:', response)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('💥 Webhook processing error:', {
      message: error.message,
      stack: error.stack,
      payload: payload
    })

    // Update sync log with error if we have the payload and supabase client
    if (payload && supabase) {
      try {
        console.log('📝 Updating sync log with error...')
        const { error: updateError } = await supabase
          .from('clockfy_sync_log')
          .update({
            processing_status: 'error',
            error_message: error.message,
            processed_at: new Date().toISOString()
          })
          .eq('clockfy_id', actualData.id)
          .eq('event_type', payload.event_type)

        if (updateError) {
          console.error('❌ Error updating sync log with error:', updateError)
        } else {
          console.log('✅ Sync log updated with error')
        }
      } catch (logError) {
        console.error('💥 Failed to update sync log with error:', logError)
      }
    }

    const errorResponse = {
      success: false,
      error: error.message,
      received_at: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

async function processTimeRecord(supabase: any, record: ClockfyTimeRecord) {
  console.log('🔍 Processing time record:', JSON.stringify(record, null, 2))

  try {
    // Find or create employee
    console.log('👤 Looking for employee with clockfy_employee_id:', record.employee_id)
    const { data: employee, error: employeeError } = await supabase
      .from('clockfy_employees')
      .select('*, mapped_operator_id')
      .eq('clockfy_employee_id', record.employee_id)
      .maybeSingle()

    if (employeeError) {
      console.error('❌ Error querying employee:', employeeError)
      throw new Error(`Failed to query employee: ${employeeError.message}`)
    }

    let finalEmployee = employee

    if (!employee) {
      console.log('➕ Employee not found, creating placeholder employee')
      const { data: newEmployee, error: createError } = await supabase
        .from('clockfy_employees')
        .insert({
          clockfy_employee_id: record.employee_id,
          name: `Employee ${record.employee_id}`,
          is_active: true
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Error creating employee:', createError)
        throw new Error(`Failed to create employee: ${createError.message}`)
      }
      
      finalEmployee = newEmployee
      console.log('✅ Created new employee:', finalEmployee)
    } else {
      console.log('✅ Found existing employee:', finalEmployee)
    }

    // Calculate total hours if both clock_in and clock_out are present
    let totalHours = record.total_hours
    if (record.clock_in && record.clock_out && !totalHours) {
      const clockIn = new Date(record.clock_in)
      const clockOut = new Date(record.clock_out)
      totalHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)
      console.log('⏱️ Calculated total hours:', totalHours)
    }

    // Insert or update time event
    const timeEventData = {
      clockfy_record_id: record.id,
      employee_id: finalEmployee.id,
      operator_id: finalEmployee.mapped_operator_id,
      clock_in: record.clock_in,
      clock_out: record.clock_out,
      total_hours: totalHours
    }
    
    console.log('💾 Upserting time event:', timeEventData)
    const { data, error } = await supabase
      .from('clockfy_time_events')
      .upsert(timeEventData, { 
        onConflict: 'clockfy_record_id' 
      })
      .select()

    if (error) {
      console.error('❌ Error upserting time event:', error)
      throw new Error(`Failed to upsert time event: ${error.message}`)
    }
    
    console.log('✅ Time event processed successfully:', data)
    return data
  } catch (error) {
    console.error('💥 Error in processTimeRecord:', error)
    throw error
  }
}

async function processEmployee(supabase: any, employee: ClockfyEmployee) {
  console.log('🔍 Processing employee:', JSON.stringify(employee, null, 2))

  try {
    // Try to map to existing operator by email or name
    let mappedOperatorId = null
    if (employee.email) {
      console.log('📧 Employee has email, but no automatic mapping implemented yet')
      // Note: operators table doesn't have email, so we'll need to map manually
      // For now, we'll leave it null and let admins map manually
    }

    const employeeData = {
      clockfy_employee_id: employee.id,
      name: employee.name,
      email: employee.email,
      pin: employee.pin,
      is_active: employee.is_active,
      deactivated_at: employee.deactivated_at,
      mapped_operator_id: mappedOperatorId
    }
    
    console.log('💾 Upserting employee:', employeeData)
    const { data, error } = await supabase
      .from('clockfy_employees')
      .upsert(employeeData, { 
        onConflict: 'clockfy_employee_id' 
      })
      .select()

    if (error) {
      console.error('❌ Error upserting employee:', error)
      throw new Error(`Failed to upsert employee: ${error.message}`)
    }
    
    console.log('✅ Employee processed successfully:', data)
    return data
  } catch (error) {
    console.error('💥 Error in processEmployee:', error)
    throw error
  }
}

async function processShiftAssignment(supabase: any, assignment: ClockfyShiftAssignment) {
  console.log('🔍 Processing shift assignment:', JSON.stringify(assignment, null, 2))

  try {
    // Find employee
    console.log('👤 Looking for employee with clockfy_employee_id:', assignment.employee_id)
    const { data: employee, error: employeeError } = await supabase
      .from('clockfy_employees')
      .select('id')
      .eq('clockfy_employee_id', assignment.employee_id)
      .maybeSingle()

    if (employeeError) {
      console.error('❌ Error querying employee:', employeeError)
      throw new Error(`Failed to query employee: ${employeeError.message}`)
    }

    if (!employee) {
      console.error('❌ Employee not found for shift assignment:', assignment.employee_id)
      throw new Error(`Employee not found: ${assignment.employee_id}`)
    }
    
    console.log('✅ Found employee for shift assignment:', employee)

    const assignmentData = {
      clockfy_assignment_id: assignment.id,
      employee_id: employee.id,
      shift_template_id: assignment.shift_template_id,
      start_date: assignment.start_date,
      end_date: assignment.end_date,
      shift_pattern: assignment.shift_pattern
    }
    
    console.log('💾 Upserting shift assignment:', assignmentData)
    const { data, error } = await supabase
      .from('clockfy_shift_assignments')
      .upsert(assignmentData, { 
        onConflict: 'clockfy_assignment_id' 
      })
      .select()

    if (error) {
      console.error('❌ Error upserting shift assignment:', error)
      throw new Error(`Failed to upsert shift assignment: ${error.message}`)
    }
    
    console.log('✅ Shift assignment processed successfully:', data)
    return data
  } catch (error) {
    console.error('💥 Error in processShiftAssignment:', error)
    throw error
  }
}