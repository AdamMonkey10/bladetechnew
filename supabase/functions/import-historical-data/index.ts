import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FirebaseRecord {
  id: string;
  date: { seconds: number; nanoseconds: number };
  createdAt: { seconds: number; nanoseconds: number };
  machine: string;
  operator: string;
  sku: string;
  sampleCount: number;
  Status: boolean;
  bladeWidth: number;
  gauge: number;
  bladeBody: number;
  toothSetLeft: number;
  toothSetRight: number;
  dross: number;
  height?: number;
  bladeBottom?: number;
  flatness?: number;
  withinSpec: Record<string, boolean>;
  notes: string;
  submittedBy: string;
  invoice?: string;
  palletNumber?: number;
  revision?: string;
  profileCheck?: boolean;
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

    const { records } = await req.json() as { records: FirebaseRecord[] };
    
    if (!records || !Array.isArray(records)) {
      throw new Error('Invalid records data provided');
    }

    console.log(`Starting import of ${records.length} records`);
    console.log('Sample input record structure:');
    console.log(JSON.stringify(records[0], null, 2));
    
    // Validate records have required fields
    const sampleRecord = records[0];
    if (!sampleRecord) {
      throw new Error('No records provided');
    }
    
    const missingFields = [];
    if (!sampleRecord.date) missingFields.push('date');
    if (!sampleRecord.machine) missingFields.push('machine');
    if (!sampleRecord.operator) missingFields.push('operator');
    if (!sampleRecord.sku) missingFields.push('sku');
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      console.error('Sample record:', JSON.stringify(sampleRecord, null, 2));
      throw new Error(`Records missing required fields: ${missingFields.join(', ')}`);
    }

    // Get lookup data for mapping
    const [machinesResult, operatorsResult, productsResult] = await Promise.all([
      supabaseClient.from('machines').select('id, machine_code'),
      supabaseClient.from('operators').select('id, operator_name'),
      supabaseClient.from('products').select('id, product_code')
    ]);

    if (machinesResult.error) throw machinesResult.error;
    if (operatorsResult.error) throw operatorsResult.error;
    if (productsResult.error) throw productsResult.error;

    // Create mapping objects
    const machineMap = new Map<string, string>();
    machinesResult.data?.forEach(m => {
      if (m.machine_code === 'LASER01') machineMap.set('1', m.id);
      if (m.machine_code === 'LASER02') machineMap.set('2', m.id);
      if (m.machine_code === 'LASER03') machineMap.set('3', m.id);
    });

    const operatorMap = new Map<string, string>();
    operatorsResult.data?.forEach(op => {
      operatorMap.set(op.operator_name, op.id);
    });

    const productMap = new Map<string, string>();
    productsResult.data?.forEach(prod => {
      productMap.set(prod.product_code, prod.id);
    });

    console.log(`Available machines: ${JSON.stringify(Array.from(machineMap.entries()))}`);
    console.log(`Available operators: ${JSON.stringify(Array.from(operatorMap.entries()))}`);
    console.log(`Available products: ${JSON.stringify(Array.from(productMap.entries()))}`);
    console.log(`Sample record:`, JSON.stringify(records[0], null, 2));

    // Transform records
    const transformedRecords = [];
    const skippedRecords = [];

    for (const record of records) {
      try {
        // Convert Firebase timestamp to date
        const testDate = new Date(record.date.seconds * 1000).toISOString().split('T')[0];
        
        // Map foreign keys
        const machineId = machineMap.get(record.machine);
        const operatorId = operatorMap.get(record.operator);
        const productId = productMap.get(record.sku);

        if (!machineId) {
          console.warn(`Machine '${record.machine}' not found for record ${record.id}. Available machines: ${Array.from(machineMap.keys()).join(', ')}`);
          skippedRecords.push({ id: record.id, reason: `Machine '${record.machine}' not found. Available: ${Array.from(machineMap.keys()).join(', ')}` });
          continue;
        }

        if (!operatorId) {
          console.warn(`Operator '${record.operator}' not found for record ${record.id}. Available operators: ${Array.from(operatorMap.keys()).join(', ')}`);
          skippedRecords.push({ id: record.id, reason: `Operator '${record.operator}' not found. Available: ${Array.from(operatorMap.keys()).join(', ')}` });
          continue;
        }

        if (!productId) {
          console.warn(`Product '${record.sku}' not found for record ${record.id}. Available products: ${Array.from(productMap.keys()).join(', ')}`);
          skippedRecords.push({ id: record.id, reason: `Product '${record.sku}' not found. Available: ${Array.from(productMap.keys()).join(', ')}` });
          continue;
        }

        // Calculate defects from withinSpec - count false values
        const withinSpecEntries = Object.entries(record.withinSpec || {});
        const failedMeasurements = withinSpecEntries.filter(([_, passed]) => !passed);
        const totalDefects = failedMeasurements.length;
        const defectRate = record.sampleCount > 0 ? totalDefects / record.sampleCount : 0;

        // Structure test data with all Firebase fields preserved
        const testData = {
          // Core measurements
          bladeWidth: record.bladeWidth,
          gauge: record.gauge,
          bladeBody: record.bladeBody,
          toothSetLeft: record.toothSetLeft,
          toothSetRight: record.toothSetRight,
          dross: record.dross,
          height: record.height,
          bladeBottom: record.bladeBottom,
          flatness: record.flatness,
          
          // Test results and validation
          withinSpec: record.withinSpec,
          test_passed: record.Status,
          sampleCount: record.sampleCount,
          
          // Additional metadata
          submittedBy: record.submittedBy,
          invoice: record.invoice,
          palletNumber: record.palletNumber,
          revision: record.revision,
          profileCheck: record.profileCheck,
          
          // Failed measurements for reference
          failedMeasurements: failedMeasurements.map(([field]) => field)
        };

        // Determine shift from createdAt timestamp
        let shift = 'day';
        if (record.createdAt && record.createdAt.seconds) {
          const createdHour = new Date(record.createdAt.seconds * 1000).getHours();
          if (createdHour >= 6 && createdHour < 14) shift = 'day';
          else if (createdHour >= 14 && createdHour < 22) shift = 'afternoon';
          else shift = 'night';
        }

        const transformedRecord = {
          test_date: testDate,
          machine_id: machineId,
          operator_id: operatorId,
          product_id: productId,
          shift: shift,
          total_saws: record.sampleCount,
          total_defects: totalDefects,
          defect_rate: defectRate,
          test_data: testData,
          notes: record.notes || '',
          user_id: null // Will need to be set to the importing user's ID
        };

        transformedRecords.push(transformedRecord);

      } catch (error) {
        console.error(`Error transforming record ${record.id}:`, error);
        skippedRecords.push({ id: record.id, reason: error.message });
      }
    }

    console.log(`Transformed ${transformedRecords.length} records, skipped ${skippedRecords.length}`);

    // Import in batches of 50
    const batchSize = 50;
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < transformedRecords.length; i += batchSize) {
      const batch = transformedRecords.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabaseClient
          .from('milwaukee_test_reports')
          .insert(batch)
          .select('id');

        if (error) {
          console.error(`Batch ${Math.floor(i/batchSize) + 1} failed:`, error);
          errorCount += batch.length;
          results.push({
            batch: Math.floor(i/batchSize) + 1,
            status: 'error',
            error: error.message,
            recordCount: batch.length
          });
        } else {
          successCount += batch.length;
          results.push({
            batch: Math.floor(i/batchSize) + 1,
            status: 'success',
            recordCount: batch.length,
            insertedIds: data?.map(r => r.id)
          });
        }
      } catch (error) {
        console.error(`Batch ${Math.floor(i/batchSize) + 1} exception:`, error);
        errorCount += batch.length;
        results.push({
          batch: Math.floor(i/batchSize) + 1,
          status: 'error',
          error: error.message,
          recordCount: batch.length
        });
      }

      // Small delay between batches to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return new Response(JSON.stringify({
      summary: {
        totalRecords: records.length,
        transformed: transformedRecords.length,
        skipped: skippedRecords.length,
        imported: successCount,
        failed: errorCount
      },
      skippedRecords,
      batchResults: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Import function error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});