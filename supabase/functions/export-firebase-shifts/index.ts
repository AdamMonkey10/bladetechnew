import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to get Google OAuth2 access token
async function getAccessToken(serviceAccount: any): Promise<string> {
  const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = btoa(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }));

  const jwtData = `${jwtHeader}.${jwtPayload}`;
  
  // Import crypto for signing
  const crypto = await import('https://deno.land/std@0.168.0/crypto/mod.ts');
  
  // Create signing key
  const privateKey = await crypto.importKey(
    'pkcs8',
    new TextEncoder().encode(serviceAccount.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Sign the JWT
  const signature = await crypto.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(jwtData)
  );
  
  const jwt = `${jwtData}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;
  
  // Get access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });
  
  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Token response error:', errorText);
    throw new Error(`Failed to get access token: ${errorText}`);
  }
  
  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Helper function to fetch subcollections for a document
async function fetchSubcollections(projectId: string, accessToken: string, documentPath: string) {
  const listUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${documentPath}:listCollections`;
  
  const listResponse = await fetch(listUrl, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!listResponse.ok) {
    console.log(`No subcollections found for ${documentPath}`);
    return {};
  }
  
  const collections = await listResponse.json();
  const subcollectionData: any = {};
  
  if (collections.collectionIds) {
    for (const collectionId of collections.collectionIds) {
      const subcollectionUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${documentPath}/${collectionId}`;
      
      const subcollectionResponse = await fetch(subcollectionUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (subcollectionResponse.ok) {
        const subcollectionResult = await subcollectionResponse.json();
        
        if (subcollectionResult.documents) {
          subcollectionData[collectionId] = subcollectionResult.documents.map((doc: any) => {
            const data: any = { id: doc.name.split('/').pop() };
            
            if (doc.fields) {
              for (const [key, field] of Object.entries(doc.fields as any)) {
                data[key] = convertFirestoreValue(field);
              }
            }
            
            return data;
          });
        }
      }
    }
  }
  
  return subcollectionData;
}

// Helper function to convert Firestore field values to JavaScript values
function convertFirestoreValue(field: any): any {
  if (field.stringValue) return field.stringValue;
  if (field.integerValue) return parseInt(field.integerValue);
  if (field.doubleValue) return parseFloat(field.doubleValue);
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.timestampValue) return { seconds: Math.floor(new Date(field.timestampValue).getTime() / 1000) };
  if (field.nullValue) return null;
  if (field.arrayValue) return field.arrayValue.values?.map(convertFirestoreValue) || [];
  if (field.mapValue) {
    const obj: any = {};
    if (field.mapValue.fields) {
      for (const [key, value] of Object.entries(field.mapValue.fields)) {
        obj[key] = convertFirestoreValue(value);
      }
    }
    return obj;
  }
  return field;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountKey = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY');
    
    if (!serviceAccountKey) {
      throw new Error('Firebase service account key not configured');
    }

    // Parse the service account key
    const serviceAccount = JSON.parse(serviceAccountKey);
    
    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
      throw new Error('Invalid service account key format');
    }
    
    console.log('Getting access token...');
    const accessToken = await getAccessToken(serviceAccount);
    console.log('Access token obtained successfully');
    
    console.log('Fetching shifts and their subcollections...');
    
    // Get all shift documents using REST API
    const shiftsUrl = `https://firestore.googleapis.com/v1/projects/${serviceAccount.project_id}/databases/(default)/documents/Shiftdata`;
    const shiftsResponse = await fetch(shiftsUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!shiftsResponse.ok) {
      const errorText = await shiftsResponse.text();
      console.error('Shifts fetch error:', errorText);
      throw new Error(`Failed to fetch shifts: ${errorText}`);
    }
    
    const shiftsData = await shiftsResponse.json();
    const shiftsWithActivities = [];
    
    if (shiftsData.documents) {
      for (const doc of shiftsData.documents) {
        const documentId = doc.name.split('/').pop();
        const shiftData: any = {
          id: documentId,
          firebaseId: documentId
        };
        
        console.log(`Processing shift ${documentId}...`);
        
        // Convert Firestore fields to JavaScript values
        if (doc.fields) {
          for (const [key, field] of Object.entries(doc.fields)) {
            shiftData[key] = convertFirestoreValue(field);
          }
        }
        
        // Get subcollections (activities) for this shift
        const documentPath = `Shiftdata/${documentId}`;
        const activities = await fetchSubcollections(serviceAccount.project_id, accessToken, documentPath);
        
        // Add activities to shift data
        if (Object.keys(activities).length > 0) {
          shiftData.activities = activities;
          console.log(`  - Found ${Object.keys(activities).length} activity types`);
        }
        
        shiftsWithActivities.push(shiftData);
      }
    }
    
    console.log(`Export completed: ${shiftsWithActivities.length} shifts with activities`);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: shiftsWithActivities,
        count: shiftsWithActivities.length,
        export_date: new Date().toISOString(),
        includes_subcollections: true
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="firebase-shifts-export.json"'
        } 
      }
    );

  } catch (error) {
    console.error('Firebase export error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Make sure your Firebase service account has the Firebase Admin role and Firestore API is enabled'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});