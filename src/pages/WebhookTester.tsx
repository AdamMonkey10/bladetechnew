import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

export default function WebhookTester() {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testClockOut = async () => {
    setLoading(true);
    setResponse('');

    // Test clock-out for Matt's existing record
    const testPayload = {
      event_type: "time_record",
      data: {
        id: "rec_matt_today_001", // Matt's existing record ID
        employee_id: "emp_matt_001", // Matt's employee ID
        clock_in: "2025-07-08T06:58:59.322Z",
        clock_out: new Date().toISOString(),
        total_hours: 8.5
      }
    };

    try {
      console.log('Sending clock-out test webhook:', testPayload);
      
      const result = await fetch('https://bujljvgiskdxzahztybs.supabase.co/functions/v1/clockfy-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });

      const responseText = await result.text();
      console.log('Webhook response:', responseText);

      setResponse(`Status: ${result.status}\n\nResponse:\n${responseText}`);
    } catch (error) {
      console.error('Webhook test error:', error);
      setResponse(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Webhook Tester</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>Webhook URL:</strong> https://bujljvgiskdxzahztybs.supabase.co/functions/v1/clockfy-webhook
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button onClick={testClockOut} disabled={loading}>
              {loading ? 'Testing...' : 'Test Clock-Out for Matt'}
            </Button>
          </div>

          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> The webhook at 18:09 UTC only processed a clock-in event. 
              Matt is still showing as clocked in because Clockfy hasn't sent a clock-out event yet.
              Use the button above to simulate a proper clock-out.
            </p>
          </div>

          {response && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Response:</h3>
              <Textarea
                value={response}
                readOnly
                className="h-48 font-mono text-sm"
              />
            </div>
          )}

          <Alert>
            <AlertDescription>
              <strong>Check these after testing:</strong>
              <br />• Edge Function Logs (link below)
              <br />• Database sync_log table
              <br />• Console logs in browser dev tools
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}