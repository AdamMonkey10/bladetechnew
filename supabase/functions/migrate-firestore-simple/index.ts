import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { collections } = await req.json();
    
    let migrationResults = {
      machines: 0,
      operators: 0,
      products: 0,
      stockItems: 0,
      milwaukeeTests: 0,
      calibrations: 0,
      goodsReceived: 0,
      shifts: 0,
      customerPOs: 0,
      errors: []
    };

    console.log('Starting migration with collections:', Object.keys(collections));

    // Migrate each collection
    for (const [collectionName, documents] of Object.entries(collections)) {
      if (!documents || !Array.isArray(documents)) continue;
      
      console.log(`Migrating ${collectionName}: ${documents.length} documents`);

      for (const doc of documents) {
        try {
          // Always generate a proper UUID instead of using Firestore document ID
          const docId = crypto.randomUUID();
          const originalFirestoreId = doc.id;
          
          switch (collectionName.toLowerCase()) {
            case 'machines':
              const { error: machineError } = await supabase
                .from('machines')
                .upsert({
                  id: docId,
                  machine_code: doc.machineCode || doc.machine_code || doc.code || `M${Date.now()}`,
                  machine_name: doc.machineName || doc.machine_name || doc.name || 'Unknown Machine',
                  machine_type: doc.machineType || doc.machine_type || doc.type,
                  active: doc.active !== false,
                });
              if (machineError) {
                migrationResults.errors.push(`Machine ${docId}: ${machineError.message}`);
              } else {
                migrationResults.machines++;
              }
              break;

            case 'operators':
              const { error: operatorError } = await supabase
                .from('operators')
                .upsert({
                  id: docId,
                  operator_code: doc.operatorCode || doc.operator_code || doc.code || `O${Date.now()}`,
                  operator_name: doc.operatorName || doc.operator_name || doc.name || 'Unknown Operator',
                  active: doc.active !== false,
                });
              if (operatorError) {
                migrationResults.errors.push(`Operator ${docId}: ${operatorError.message}`);
              } else {
                migrationResults.operators++;
              }
              break;

            case 'products':
              const { error: productError } = await supabase
                .from('products')
                .upsert({
                  id: docId,
                  product_code: originalFirestoreId || doc.productCode || doc.product_code || doc.code || `P${Date.now()}`,
                  product_name: originalFirestoreId || doc.productName || doc.product_name || doc.name || 'Unknown Product',
                  description: doc.Type || doc.description || null,
                });
              
              // Handle specifications if they exist
              if (doc.specifications && !productError) {
                const specs = doc.specifications;
                await supabase
                  .from('product_specifications')
                  .upsert({
                    product_code: originalFirestoreId || doc.productCode || doc.product_code || doc.code || `P${Date.now()}`,
                    height_min: specs.height?.min,
                    height_max: specs.height?.max,
                    gauge_min: specs.gauge?.min,
                    gauge_max: specs.gauge?.max,
                    set_left_min: specs.toothSet?.min || specs.setLeft?.min,
                    set_left_max: specs.toothSet?.max || specs.setLeft?.max,
                    set_right_min: specs.bladeBody?.min || specs.setRight?.min,
                    set_right_max: specs.bladeBody?.max || specs.setRight?.max,
                  });
              }
              
              if (productError) {
                migrationResults.errors.push(`Product ${docId}: ${productError.message}`);
              } else {
                migrationResults.products++;
              }
              break;

            case 'stockitems':
            case 'stock_items':
            case 'finishedstock':
            case 'raw material':
            case 'rawsteel':
              const { error: stockError } = await supabase
                .from('stock_items')
                .upsert({
                  id: docId,
                  item_code: doc.itemCode || doc.item_code || doc.code || `S${Date.now()}`,
                  item_name: doc.itemName || doc.item_name || doc.name || 'Unknown Item',
                  category: doc.category || collectionName,
                  quantity: parseInt(doc.quantity) || 0,
                  unit: doc.unit || null,
                  location: doc.location || null,
                  minimum_stock: parseInt(doc.minimumStock || doc.minimum_stock) || 0,
                });
              if (stockError) {
                migrationResults.errors.push(`Stock Item ${docId}: ${stockError.message}`);
              } else {
                migrationResults.stockItems++;
              }
              break;

            case 'milwaukeetests':
            case 'milwaukee_tests':
            case 'tests':
            case 'milwaukeetestreports':
            case 'measurements':
              // Convert date if it's a Firebase timestamp
              let testDate = doc.testDate || doc.test_date || doc.date;
              if (testDate && typeof testDate === 'object' && testDate.seconds) {
                testDate = new Date(testDate.seconds * 1000).toISOString().split('T')[0];
              } else if (testDate && typeof testDate === 'string') {
                testDate = testDate.split('T')[0];
              } else {
                testDate = new Date().toISOString().split('T')[0];
              }

              const { error: testError } = await supabase
                .from('milwaukee_test_reports')
                .upsert({
                  id: docId,
                  test_date: testDate,
                  machine_id: doc.machineId || doc.machine_id || null,
                  operator_id: doc.operatorId || doc.operator_id || null,
                  product_id: doc.productId || doc.product_id || null,
                  shift: doc.shift || null,
                  total_saws: parseInt(doc.totalSaws || doc.total_saws) || null,
                  total_defects: parseInt(doc.totalDefects || doc.total_defects) || null,
                  defect_rate: parseFloat(doc.defectRate || doc.defect_rate) || null,
                  test_data: doc.testData || doc.test_data || doc.measurements || null,
                  notes: doc.notes || null,
                  user_id: doc.userId || doc.user_id || null,
                });
              if (testError) {
                migrationResults.errors.push(`Milwaukee Test ${docId}: ${testError.message}`);
              } else {
                migrationResults.milwaukeeTests++;
              }
              break;

            case 'calibrations':
            case 'block-calibration':
            case 'calibrationacknowledgments':
              // Convert dates
              let calibrationDate = doc.calibrationDate || doc.calibration_date || doc.date;
              if (calibrationDate && typeof calibrationDate === 'object' && calibrationDate.seconds) {
                calibrationDate = new Date(calibrationDate.seconds * 1000).toISOString().split('T')[0];
              } else if (calibrationDate && typeof calibrationDate === 'string') {
                calibrationDate = calibrationDate.split('T')[0];
              }

              let nextCalibrationDate = doc.nextCalibrationDate || doc.next_calibration_date;
              if (nextCalibrationDate && typeof nextCalibrationDate === 'object' && nextCalibrationDate.seconds) {
                nextCalibrationDate = new Date(nextCalibrationDate.seconds * 1000).toISOString().split('T')[0];
              } else if (nextCalibrationDate && typeof nextCalibrationDate === 'string') {
                nextCalibrationDate = nextCalibrationDate.split('T')[0];
              }

              const { error: calibrationError } = await supabase
                .from('calibration_records')
                .upsert({
                  id: docId,
                  equipment_name: doc.equipmentName || doc.equipment_name || doc.name || 'Unknown Equipment',
                  equipment_serial: doc.equipmentSerial || doc.equipment_serial || doc.serial || null,
                  calibration_date: calibrationDate || new Date().toISOString().split('T')[0],
                  next_calibration_date: nextCalibrationDate || null,
                  status: doc.status || 'active',
                  notes: doc.notes || null,
                  calibration_data: doc.calibrationData || doc.calibration_data || doc.data || null,
                  user_id: doc.userId || doc.user_id || null,
                });
              if (calibrationError) {
                migrationResults.errors.push(`Calibration ${docId}: ${calibrationError.message}`);
              } else {
                migrationResults.calibrations++;
              }
              break;

            case 'goodsreceived':
            case 'goods_received':
            case 'goodsin':
              // Convert date
              let receivedDate = doc.receivedDate || doc.received_date || doc.date;
              if (receivedDate && typeof receivedDate === 'object' && receivedDate.seconds) {
                receivedDate = new Date(receivedDate.seconds * 1000).toISOString().split('T')[0];
              } else if (receivedDate && typeof receivedDate === 'string') {
                receivedDate = receivedDate.split('T')[0];
              }

              const { error: goodsError } = await supabase
                .from('goods_received')
                .upsert({
                  id: docId,
                  stock_item_id: doc.stockItemId || doc.stock_item_id || null,
                  supplier: doc.supplier || 'Unknown Supplier',
                  reference_number: doc.referenceNumber || doc.reference_number || null,
                  quantity_received: parseInt(doc.quantityReceived || doc.quantity_received || doc.quantity) || 0,
                  received_date: receivedDate || new Date().toISOString().split('T')[0],
                  notes: doc.notes || null,
                  user_id: doc.userId || doc.user_id || null,
                });
              if (goodsError) {
                migrationResults.errors.push(`Goods Received ${docId}: ${goodsError.message}`);
              } else {
                migrationResults.goodsReceived++;
              }
              break;

            case 'shifts':
            case 'shift_records':
            case 'shiftdata':
              // Convert dates
              let shiftDate = doc.shiftDate || doc.shift_date || doc.date;
              if (shiftDate && typeof shiftDate === 'object' && shiftDate.seconds) {
                shiftDate = new Date(shiftDate.seconds * 1000).toISOString().split('T')[0];
              } else if (shiftDate && typeof shiftDate === 'string') {
                shiftDate = shiftDate.split('T')[0];
              }

              const { error: shiftError } = await supabase
                .from('shift_records')
                .upsert({
                  id: docId,
                  shift_date: shiftDate || new Date().toISOString().split('T')[0],
                  shift_type: doc.shiftType || doc.shift_type || 'day',
                  machine_id: doc.machineId || doc.machine_id || null,
                  operator_id: doc.operatorId || doc.operator_id || null,
                  start_time: doc.startTime || doc.start_time || null,
                  end_time: doc.endTime || doc.end_time || null,
                  production_data: doc.productionData || doc.production_data || null,
                  notes: doc.notes || null,
                  user_id: doc.userId || doc.user_id || null,
                });
              if (shiftError) {
                migrationResults.errors.push(`Shift ${docId}: ${shiftError.message}`);
              } else {
                migrationResults.shifts++;
              }
              break;

            case 'customerpos':
            case 'customer_pos':
            case 'customerpurchaseorders':
              // Convert dates
              let poDate = doc.poDate || doc.po_date || doc.date;
              if (poDate && typeof poDate === 'object' && poDate.seconds) {
                poDate = new Date(poDate.seconds * 1000).toISOString().split('T')[0];
              } else if (poDate && typeof poDate === 'string') {
                poDate = poDate.split('T')[0];
              }

              let deliveryDate = doc.deliveryDate || doc.delivery_date;
              if (deliveryDate && typeof deliveryDate === 'object' && deliveryDate.seconds) {
                deliveryDate = new Date(deliveryDate.seconds * 1000).toISOString().split('T')[0];
              } else if (deliveryDate && typeof deliveryDate === 'string') {
                deliveryDate = deliveryDate.split('T')[0];
              }

              const { error: poError } = await supabase
                .from('customer_pos')
                .upsert({
                  id: docId,
                  po_number: doc.poNumber || doc.po_number || `PO${Date.now()}`,
                  customer_name: doc.customerName || doc.customer_name || 'Unknown Customer',
                  po_date: poDate || new Date().toISOString().split('T')[0],
                  delivery_date: deliveryDate || null,
                  status: doc.status || 'pending',
                  total_amount: parseFloat(doc.totalAmount || doc.total_amount) || null,
                  items: doc.items || null,
                  notes: doc.notes || null,
                  user_id: doc.userId || doc.user_id || null,
                });
              if (poError) {
                migrationResults.errors.push(`Customer PO ${docId}: ${poError.message}`);
              } else {
                migrationResults.customerPOs++;
              }
              break;

            default:
              // Log unknown collections for review
              console.log(`Skipping unknown collection: ${collectionName} with ${Object.keys(doc).length} fields:`, Object.keys(doc).slice(0, 5).join(', '));
              migrationResults.errors.push(`Unknown collection type: ${collectionName}`);
          }
        } catch (error) {
          migrationResults.errors.push(`${collectionName} document error: ${error.message}`);
          console.error(`Error processing ${collectionName} document:`, error);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Migration completed successfully',
      results: migrationResults,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});