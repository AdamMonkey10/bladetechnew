import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface POLineItem {
  sku: string;
  quantity: number;
  dispatch_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

interface ImportedPO {
  id?: string;
  customer: string;
  po: string;
  status: boolean;
  quantity?: number;
  sku?: string;
  createdAt?: any;
  dispatchDate?: string;
  lineItems?: Array<{
    sku: string;
    quantity: number;
    dispatchDate?: string;
  }>;
}

interface ImportResult {
  summary: {
    totalRecords: number;
    transformed: number;
    skipped: number;
    imported: number;
    failed: number;
  };
  skippedRecords: Array<{ id: string; reason: string }>;
  batchResults: Array<{
    batch: number;
    status: string;
    recordCount: number;
    error?: string;
  }>;
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
    )

    const { records } = await req.json()
    
    if (!Array.isArray(records)) {
      throw new Error('Records must be an array')
    }

    console.log(`Starting import of ${records.length} customer PO records`)
    console.log('Sample record:', JSON.stringify(records[0], null, 2))

    const result: ImportResult = {
      summary: {
        totalRecords: records.length,
        transformed: 0,
        skipped: 0,
        imported: 0,
        failed: 0
      },
      skippedRecords: [],
      batchResults: []
    }

    // Transform records
    const transformedRecords = []
    
    for (const record of records as ImportedPO[]) {
      try {
        // Skip if missing required fields
        if (!record.customer || !record.po) {
          result.skippedRecords.push({
            id: record.id || 'unknown',
            reason: 'Missing required fields: customer or po'
          })
          result.summary.skipped++
          continue
        }

        // Transform Firebase timestamp to date string
        let poDate = new Date().toISOString().split('T')[0] // Default to today
        if (record.createdAt) {
          try {
            if (record.createdAt.seconds) {
              // Firebase timestamp format with seconds property
              poDate = new Date(record.createdAt.seconds * 1000).toISOString().split('T')[0]
            } else if (record.createdAt._seconds) {
              // Firebase timestamp format with _seconds property
              poDate = new Date(record.createdAt._seconds * 1000).toISOString().split('T')[0]
            } else if (typeof record.createdAt === 'string') {
              poDate = new Date(record.createdAt).toISOString().split('T')[0]
            } else if (typeof record.createdAt === 'object' && record.createdAt.toDate) {
              // Firebase Timestamp object with toDate method
              poDate = record.createdAt.toDate().toISOString().split('T')[0]
            }
          } catch (e) {
            console.warn('Failed to parse createdAt for record:', record.id, e)
          }
        }

        // Handle dispatch date similarly
        let deliveryDate = null
        if (record.dispatchDate) {
          try {
            if (typeof record.dispatchDate === 'object' && record.dispatchDate.seconds) {
              deliveryDate = new Date(record.dispatchDate.seconds * 1000).toISOString().split('T')[0]
            } else if (typeof record.dispatchDate === 'string') {
              deliveryDate = new Date(record.dispatchDate).toISOString().split('T')[0]
            }
          } catch (e) {
            console.warn('Failed to parse dispatchDate for record:', record.id, e)
          }
        }

        // Process line items
        let items: POLineItem[] = []
        if (record.lineItems && Array.isArray(record.lineItems) && record.lineItems.length > 0) {
          // Use lineItems array
          items = record.lineItems.map(item => ({
            sku: item.sku || '',
            quantity: item.quantity || 1,
            dispatch_date: item.dispatchDate || record.dispatchDate || deliveryDate || '',
            status: item.status || 'pending'
          }))
        } else if (record.sku && record.quantity) {
          // Create single line item from top-level data
          items = [{
            sku: record.sku,
            quantity: record.quantity,
            dispatch_date: record.dispatchDate || deliveryDate || '',
            status: record.status ? 'completed' : 'pending'
          }]
        }

        const transformedRecord = {
          customer_name: record.customer,
          po_number: record.po,
          po_date: poDate,
          delivery_date: deliveryDate,
          status: Boolean(record.status),
          items: items,
          notes: null
        }

        transformedRecords.push(transformedRecord)
        result.summary.transformed++

      } catch (error) {
        console.error('Error transforming record:', record.id, error)
        result.skippedRecords.push({
          id: record.id || 'unknown',
          reason: `Transformation error: ${error.message}`
        })
        result.summary.skipped++
      }
    }

    console.log(`Transformed ${transformedRecords.length} records`)

    // Import in batches of 50
    const batchSize = 50
    const batches = []
    for (let i = 0; i < transformedRecords.length; i += batchSize) {
      batches.push(transformedRecords.slice(i, i + batchSize))
    }

    // Process each batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      try {
        console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} records)`)

        console.log('Inserting batch:', JSON.stringify(batch[0], null, 2));
        
        const { data, error } = await supabase
          .from('customer_pos')
          .insert(batch)
          .select()

        if (error) {
          console.error('Batch import error:', error)
          result.batchResults.push({
            batch: batchIndex + 1,
            status: 'failed',
            recordCount: batch.length,
            error: error.message
          })
          result.summary.failed += batch.length
        } else {
          console.log(`Successfully imported batch ${batchIndex + 1}`)
          result.batchResults.push({
            batch: batchIndex + 1,
            status: 'success',
            recordCount: batch.length
          })
          result.summary.imported += (data?.length || batch.length)
        }
      } catch (error) {
        console.error('Batch processing error:', error)
        result.batchResults.push({
          batch: batchIndex + 1,
          status: 'failed',
          recordCount: batch.length,
          error: error.message
        })
        result.summary.failed += batch.length
      }
    }

    console.log('Import completed:', result.summary)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Import function error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      summary: { totalRecords: 0, transformed: 0, skipped: 0, imported: 0, failed: 0 },
      skippedRecords: [],
      batchResults: []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})