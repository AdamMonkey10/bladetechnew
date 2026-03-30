import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Firebase Admin SDK configuration
const getFirebaseConfig = () => {
  const privateKey = Deno.env.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
  return {
    projectId: Deno.env.get('FIREBASE_PROJECT_ID'),
    clientEmail: Deno.env.get('FIREBASE_CLIENT_EMAIL'),
    privateKey: privateKey,
  };
};

// Simple Firestore REST API client
class FirestoreClient {
  private projectId: string;
  private accessToken: string;

  constructor(projectId: string, accessToken: string) {
    this.projectId = projectId;
    this.accessToken = accessToken;
  }

  async getCollection(collectionName: string) {
    const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/${collectionName}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch collection ${collectionName}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.documents || [];
  }
}

// Get OAuth2 access token for Firebase
async function getAccessToken(config: any) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: config.clientEmail,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  // Simple JWT creation (for production, use a proper library)
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = btoa(JSON.stringify(payload));
  
  // Note: This is a simplified version. In production, you'd need proper RSA signing
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claims}.signature` // Simplified - needs proper signing
    }),
  });

  const tokenData = await response.json();
  return tokenData.access_token;
}

// Transform Firestore document to Supabase format
function transformFirestoreDoc(doc: any, docId: string) {
  const fields = doc.fields || {};
  const transformed: any = { id: docId };

  for (const [key, value] of Object.entries(fields)) {
    const fieldValue: any = value;
    
    // Handle different Firestore field types
    if (fieldValue.stringValue !== undefined) {
      transformed[key] = fieldValue.stringValue;
    } else if (fieldValue.integerValue !== undefined) {
      transformed[key] = parseInt(fieldValue.integerValue);
    } else if (fieldValue.doubleValue !== undefined) {
      transformed[key] = parseFloat(fieldValue.doubleValue);
    } else if (fieldValue.booleanValue !== undefined) {
      transformed[key] = fieldValue.booleanValue;
    } else if (fieldValue.timestampValue !== undefined) {
      transformed[key] = new Date(fieldValue.timestampValue).toISOString();
    } else if (fieldValue.arrayValue !== undefined) {
      transformed[key] = fieldValue.arrayValue.values?.map((v: any) => 
        v.stringValue || v.integerValue || v.doubleValue || v.booleanValue
      ) || [];
    } else if (fieldValue.mapValue !== undefined) {
      // Handle nested objects
      const nestedObj: any = {};
      for (const [nestedKey, nestedValue] of Object.entries(fieldValue.mapValue.fields || {})) {
        const nested: any = nestedValue;
        nestedObj[nestedKey] = nested.stringValue || nested.integerValue || nested.doubleValue || nested.booleanValue;
      }
      transformed[key] = nestedObj;
    }
  }

  return transformed;
}

// Migration functions for each collection type
async function migrateMachines(firestore: FirestoreClient) {
  console.log('Migrating machines...');
  const docs = await firestore.getCollection('machines');
  
  for (const doc of docs) {
    const docId = doc.name.split('/').pop();
    const machine = transformFirestoreDoc(doc, docId);
    
    const { error } = await supabase
      .from('machines')
      .upsert({
        id: machine.id,
        machine_code: machine.machine_code || machine.machineCode,
        machine_name: machine.machine_name || machine.machineName,
        machine_type: machine.machine_type || machine.machineType,
        active: machine.active !== false,
      });
    
    if (error) console.error('Error inserting machine:', error);
  }
  
  return docs.length;
}

async function migrateOperators(firestore: FirestoreClient) {
  console.log('Migrating operators...');
  const docs = await firestore.getCollection('operators');
  
  for (const doc of docs) {
    const docId = doc.name.split('/').pop();
    const operator = transformFirestoreDoc(doc, docId);
    
    const { error } = await supabase
      .from('operators')
      .upsert({
        id: operator.id,
        operator_code: operator.operator_code || operator.operatorCode,
        operator_name: operator.operator_name || operator.operatorName,
        active: operator.active !== false,
      });
    
    if (error) console.error('Error inserting operator:', error);
  }
  
  return docs.length;
}

async function migrateProducts(firestore: FirestoreClient) {
  console.log('Migrating products...');
  const docs = await firestore.getCollection('products');
  
  for (const doc of docs) {
    const docId = doc.name.split('/').pop();
    const product = transformFirestoreDoc(doc, docId);
    
    const { error } = await supabase
      .from('products')
      .upsert({
        id: product.id,
        product_code: product.product_code || product.productCode,
        product_name: product.product_name || product.productName,
        description: product.description,
      });
    
    if (error) console.error('Error inserting product:', error);
  }
  
  return docs.length;
}

async function migrateStockItems(firestore: FirestoreClient) {
  console.log('Migrating stock items...');
  const docs = await firestore.getCollection('stock_items') || await firestore.getCollection('stockItems');
  
  for (const doc of docs) {
    const docId = doc.name.split('/').pop();
    const item = transformFirestoreDoc(doc, docId);
    
    const { error } = await supabase
      .from('stock_items')
      .upsert({
        id: item.id,
        item_code: item.item_code || item.itemCode,
        item_name: item.item_name || item.itemName,
        category: item.category,
        quantity: item.quantity || 0,
        unit: item.unit,
        location: item.location,
        minimum_stock: item.minimum_stock || item.minimumStock || 0,
      });
    
    if (error) console.error('Error inserting stock item:', error);
  }
  
  return docs.length;
}

async function migrateMilwaukeeTests(firestore: FirestoreClient) {
  console.log('Migrating Milwaukee tests...');
  const docs = await firestore.getCollection('milwaukee_tests') || await firestore.getCollection('milwaukeeTests');
  
  for (const doc of docs) {
    const docId = doc.name.split('/').pop();
    const test = transformFirestoreDoc(doc, docId);
    
    const { error } = await supabase
      .from('milwaukee_test_reports')
      .upsert({
        id: test.id,
        test_date: test.test_date || test.testDate,
        machine_id: test.machine_id || test.machineId,
        operator_id: test.operator_id || test.operatorId,
        product_id: test.product_id || test.productId,
        shift: test.shift,
        total_saws: test.total_saws || test.totalSaws,
        total_defects: test.total_defects || test.totalDefects,
        defect_rate: test.defect_rate || test.defectRate,
        test_data: test.test_data || test.testData,
        notes: test.notes,
        user_id: test.user_id || test.userId,
      });
    
    if (error) console.error('Error inserting Milwaukee test:', error);
  }
  
  return docs.length;
}

async function migrateCalibrations(firestore: FirestoreClient) {
  console.log('Migrating calibrations...');
  const docs = await firestore.getCollection('calibrations');
  
  for (const doc of docs) {
    const docId = doc.name.split('/').pop();
    const calibration = transformFirestoreDoc(doc, docId);
    
    const { error } = await supabase
      .from('calibration_records')
      .upsert({
        id: calibration.id,
        equipment_name: calibration.equipment_name || calibration.equipmentName,
        equipment_serial: calibration.equipment_serial || calibration.equipmentSerial,
        calibration_date: calibration.calibration_date || calibration.calibrationDate,
        next_calibration_date: calibration.next_calibration_date || calibration.nextCalibrationDate,
        status: calibration.status || 'active',
        notes: calibration.notes,
        calibration_data: calibration.calibration_data || calibration.calibrationData,
        user_id: calibration.user_id || calibration.userId,
      });
    
    if (error) console.error('Error inserting calibration:', error);
  }
  
  return docs.length;
}

async function migrateGoodsReceived(firestore: FirestoreClient) {
  console.log('Migrating goods received...');
  const docs = await firestore.getCollection('goods_received') || await firestore.getCollection('goodsReceived');
  
  for (const doc of docs) {
    const docId = doc.name.split('/').pop();
    const goods = transformFirestoreDoc(doc, docId);
    
    const { error } = await supabase
      .from('goods_received')
      .upsert({
        id: goods.id,
        stock_item_id: goods.stock_item_id || goods.stockItemId,
        supplier: goods.supplier,
        reference_number: goods.reference_number || goods.referenceNumber,
        quantity_received: goods.quantity_received || goods.quantityReceived,
        received_date: goods.received_date || goods.receivedDate,
        notes: goods.notes,
        user_id: goods.user_id || goods.userId,
      });
    
    if (error) console.error('Error inserting goods received:', error);
  }
  
  return docs.length;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Firestore migration...');
    
    const config = getFirebaseConfig();
    if (!config.projectId || !config.clientEmail || !config.privateKey) {
      throw new Error('Missing Firebase configuration');
    }

    // For this simplified version, we'll use a different approach
    // In production, you'd need proper JWT signing for Firebase
    console.log('Note: This migration requires Firebase service account credentials');
    
    // Alternative approach: Ask user to provide exported JSON data
    const { exportedData } = await req.json();
    
    if (exportedData) {
      console.log('Processing exported Firestore data...');
      
      let migrationResults = {
        machines: 0,
        operators: 0,
        products: 0,
        stockItems: 0,
        milwaukeeTests: 0,
        calibrations: 0,
        goodsReceived: 0,
      };

      // Process each collection from exported data
      for (const [collectionName, documents] of Object.entries(exportedData)) {
        console.log(`Processing ${collectionName}...`);
        
        const docs = Array.isArray(documents) ? documents : Object.values(documents);
        
        for (const doc of docs) {
          try {
            switch (collectionName) {
              case 'machines':
                const { error: machineError } = await supabase
                  .from('machines')
                  .upsert({
                    id: doc.id || crypto.randomUUID(),
                    machine_code: doc.machine_code || doc.machineCode || doc.code,
                    machine_name: doc.machine_name || doc.machineName || doc.name,
                    machine_type: doc.machine_type || doc.machineType || doc.type,
                    active: doc.active !== false,
                  });
                if (!machineError) migrationResults.machines++;
                break;

              case 'operators':
                const { error: operatorError } = await supabase
                  .from('operators')
                  .upsert({
                    id: doc.id || crypto.randomUUID(),
                    operator_code: doc.operator_code || doc.operatorCode || doc.code,
                    operator_name: doc.operator_name || doc.operatorName || doc.name,
                    active: doc.active !== false,
                  });
                if (!operatorError) migrationResults.operators++;
                break;

              case 'products':
                const { error: productError } = await supabase
                  .from('products')
                  .upsert({
                    id: doc.id || crypto.randomUUID(),
                    product_code: doc.product_code || doc.productCode || doc.code,
                    product_name: doc.product_name || doc.productName || doc.name,
                    description: doc.description,
                  });
                if (!productError) migrationResults.products++;
                break;

              case 'stockItems':
              case 'stock_items':
                const { error: stockError } = await supabase
                  .from('stock_items')
                  .upsert({
                    id: doc.id || crypto.randomUUID(),
                    item_code: doc.item_code || doc.itemCode || doc.code,
                    item_name: doc.item_name || doc.itemName || doc.name,
                    category: doc.category,
                    quantity: doc.quantity || 0,
                    unit: doc.unit,
                    location: doc.location,
                    minimum_stock: doc.minimum_stock || doc.minimumStock || 0,
                  });
                if (!stockError) migrationResults.stockItems++;
                break;

              case 'milwaukeeTests':
              case 'milwaukee_tests':
                const { error: testError } = await supabase
                  .from('milwaukee_test_reports')
                  .upsert({
                    id: doc.id || crypto.randomUUID(),
                    test_date: doc.test_date || doc.testDate || doc.date,
                    machine_id: doc.machine_id || doc.machineId,
                    operator_id: doc.operator_id || doc.operatorId,
                    product_id: doc.product_id || doc.productId,
                    shift: doc.shift,
                    total_saws: doc.total_saws || doc.totalSaws,
                    total_defects: doc.total_defects || doc.totalDefects,
                    defect_rate: doc.defect_rate || doc.defectRate,
                    test_data: doc.test_data || doc.testData || doc.measurements,
                    notes: doc.notes,
                    user_id: doc.user_id || doc.userId,
                  });
                if (!testError) migrationResults.milwaukeeTests++;
                break;

              case 'calibrations':
                const { error: calibrationError } = await supabase
                  .from('calibration_records')
                  .upsert({
                    id: doc.id || crypto.randomUUID(),
                    equipment_name: doc.equipment_name || doc.equipmentName || doc.name,
                    equipment_serial: doc.equipment_serial || doc.equipmentSerial || doc.serial,
                    calibration_date: doc.calibration_date || doc.calibrationDate || doc.date,
                    next_calibration_date: doc.next_calibration_date || doc.nextCalibrationDate,
                    status: doc.status || 'active',
                    notes: doc.notes,
                    calibration_data: doc.calibration_data || doc.calibrationData || doc.data,
                    user_id: doc.user_id || doc.userId,
                  });
                if (!calibrationError) migrationResults.calibrations++;
                break;

              case 'goodsReceived':
              case 'goods_received':
                const { error: goodsError } = await supabase
                  .from('goods_received')
                  .upsert({
                    id: doc.id || crypto.randomUUID(),
                    stock_item_id: doc.stock_item_id || doc.stockItemId,
                    supplier: doc.supplier,
                    reference_number: doc.reference_number || doc.referenceNumber,
                    quantity_received: doc.quantity_received || doc.quantityReceived || doc.quantity,
                    received_date: doc.received_date || doc.receivedDate || doc.date,
                    notes: doc.notes,
                    user_id: doc.user_id || doc.userId,
                  });
                if (!goodsError) migrationResults.goodsReceived++;
                break;
            }
          } catch (error) {
            console.error(`Error processing ${collectionName} document:`, error);
          }
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Migration completed',
        results: migrationResults,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('No exported data provided');

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