import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClockfyEmployeeMapping } from '@/components/ClockfyEmployeeMapping';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Database, AlertCircle } from 'lucide-react';

export default function ClockfyIntegration() {
  const webhookUrl = `https://bujljvgiskdxzahztybs.supabase.co/functions/v1/clockfy-webhook`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Clockfy Integration</h1>
        <p className="text-muted-foreground">Manage time tracking integration between Clockfy and Production systems</p>
      </div>

      <Tabs defaultValue="mapping" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mapping">Employee Mapping</TabsTrigger>
          <TabsTrigger value="webhook">Webhook Setup</TabsTrigger>
          <TabsTrigger value="status">Integration Status</TabsTrigger>
        </TabsList>

        <TabsContent value="mapping" className="space-y-6">
          <ClockfyEmployeeMapping />
        </TabsContent>

        <TabsContent value="webhook" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Webhook Configuration
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure your Clockfy system to send data to this Production system
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Webhook URL</label>
                <div className="mt-1 p-3 bg-muted rounded-md font-mono text-sm">
                  {webhookUrl}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Use this URL in your Clockfy webhook configuration
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Supported Events</label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">time_record</Badge>
                    <span className="text-sm">Clock-in and clock-out events</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">employee</Badge>
                    <span className="text-sm">Employee creation and updates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">shift_assignment</Badge>
                    <span className="text-sm">Shift scheduling changes</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Setup Instructions</h4>
                    <ol className="mt-2 text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Copy the webhook URL above</li>
                      <li>Configure your Clockfy system to send POST requests to this URL</li>
                      <li>Ensure webhook payloads include event_type and data fields</li>
                      <li>Test the integration with sample data</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Webhook Status</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Active</div>
                <p className="text-xs text-muted-foreground">Ready to receive data</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Flow</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">Pending</div>
                <p className="text-xs text-muted-foreground">Waiting for Clockfy data</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Analytics Ready</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">Ready</div>
                <p className="text-xs text-muted-foreground">Analytics integration enabled</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Integration Health</CardTitle>
              <p className="text-sm text-muted-foreground">
                Current status of the Clockfy to Production integration
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Database Tables</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Created
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Webhook Endpoint</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Deployed
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Analytics Integration</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Ready
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="font-medium">Data Sync</span>
                  </div>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    Pending Setup
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}