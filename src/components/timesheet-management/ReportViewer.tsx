import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ReportViewerProps {
  reportData: any;
  reportType: string;
  title: string;
  generatedAt: string;
  description?: string;
}

export function ReportViewer({ reportData, reportType, title, generatedAt, description }: ReportViewerProps) {
  const renderComplianceReport = (data: any) => {
    console.log('renderComplianceReport called with:', data);
    
    // Handle the case where data might be wrapped in a 'data' property
    const actualData = data?.data || data;
    
    if (!actualData || !actualData.summary) {
      console.log('No compliance data available:', { data, actualData });
      return <div className="text-center text-muted-foreground">No data available for compliance report</div>;
    }
    
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{actualData.summary?.total_records || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{actualData.summary?.compliance_rate || 0}%</div>
              <Progress value={actualData.summary?.compliance_rate || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{actualData.summary?.on_time_rate || 0}%</div>
              <Progress value={actualData.summary?.on_time_rate || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Count</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{actualData.summary?.overdue_count || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Escalation Levels */}
        <Card>
          <CardHeader>
            <CardTitle>Escalation Levels</CardTitle>
            <CardDescription>Current escalation status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <Badge variant="destructive" className="mb-2">Critical</Badge>
                <div className="text-2xl font-bold">{actualData.escalation_levels?.critical || 0}</div>
              </div>
              <div className="text-center">
                <Badge variant="secondary" className="mb-2">Urgent</Badge>
                <div className="text-2xl font-bold">{actualData.escalation_levels?.urgent || 0}</div>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="mb-2">Warning</Badge>
                <div className="text-2xl font-bold">{actualData.escalation_levels?.warning || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Operator</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Days Overdue</th>
                    <th className="text-left p-2">Escalation</th>
                  </tr>
                </thead>
                <tbody>
                  {actualData.details?.slice(0, 20).map((record: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{format(new Date(record.work_date), 'MMM dd, yyyy')}</td>
                      <td className="p-2">{record.operators?.operator_name || 'Unknown'}</td>
                      <td className="p-2">
                        {record.timesheet_submitted ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Submitted
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Missing
                          </Badge>
                        )}
                      </td>
                      <td className="p-2">{record.days_overdue || 0}</td>
                      <td className="p-2">
                        <Badge variant={
                          record.escalation_level === 'critical' ? 'destructive' :
                          record.escalation_level === 'urgent' ? 'secondary' : 'outline'
                        }>
                          {record.escalation_level || 'none'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderProductivityReport = (data: any) => {
    console.log('renderProductivityReport called with:', data);
    // Handle case where data is the full response object vs just the data part
    const actualData = data.data || data;
    if (!actualData) {
      return <div className="text-center text-muted-foreground">No data available for productivity report</div>;
    }

    // Prepare data for charts
    const operatorData = Object.entries(actualData.byOperator || actualData.by_operator || {}).map(([operator, metrics]: [string, any]) => ({
      name: operator,
      units: metrics.units || 0,
      time: Math.round(metrics.time || 0),
      efficiency: metrics.time > 0 ? Math.round((metrics.units / metrics.time) * 100) / 100 : 0
    }));

    const activityData = Object.entries(actualData.byActivity || actualData.by_activity || {}).map(([activity, metrics]: [string, any]) => ({
      name: activity,
      units: metrics.units || 0,
      time: Math.round(metrics.time || 0),
      efficiency: metrics.time > 0 ? Math.round((metrics.units / metrics.time) * 100) / 100 : 0
    }));

    const skuData = Object.entries(actualData.bySKU || actualData.by_sku || {}).map(([sku, metrics]: [string, any]) => ({
      name: sku,
      units: metrics.units || 0,
      time: Math.round(metrics.time || 0),
      efficiency: metrics.efficiency || 0,
      activities: metrics.activities || [],
      operators: metrics.operators || []
    }));

    const ACTIVITY_COLORS = {
      'Laser1': '#3b82f6',
      'Laser2': '#10b981', 
      'Laser3': '#f59e0b',
      'Welder': '#ef4444',
      'Other': '#8b5cf6',
    };
    
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Total Shifts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{actualData.summary?.total_shifts || 0}</div>
              <div className="text-xs text-muted-foreground">Recorded shifts</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Total Units Produced</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(actualData.summary?.total_units || 0).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">All activities</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Total Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(actualData.summary?.total_time || 0)}h</div>
              <div className="text-xs text-muted-foreground">Production time</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Average Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{actualData.summary?.average_efficiency || 0}%</div>
              <div className="text-xs text-muted-foreground">Units per hour</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Operator Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Operator Performance</CardTitle>
              <p className="text-sm text-muted-foreground">Units produced and time spent by operator</p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={operatorData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      fontSize={12}
                    />
                    <YAxis tickFormatter={(value) => value.toLocaleString()} />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'Units') return [value.toLocaleString(), name];
                        if (name === 'Hours') return [`${value}h`, name];
                        return [value, name];
                      }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="units" fill="#3b82f6" name="Units" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="time" fill="#10b981" name="Hours" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Activity Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Performance</CardTitle>
              <p className="text-sm text-muted-foreground">Production breakdown by activity type</p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      fontSize={12}
                    />
                    <YAxis tickFormatter={(value) => value.toLocaleString()} />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'Units') return [value.toLocaleString(), name];
                        if (name === 'Hours') return [`${value}h`, name];
                        return [value, name];
                      }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="units" 
                      fill="#3b82f6"
                      name="Units" 
                      radius={[2, 2, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SKU Breakdown Chart */}
        {skuData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Production by SKU</CardTitle>
              <p className="text-sm text-muted-foreground">Units produced breakdown by SKU</p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skuData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      fontSize={12}
                    />
                    <YAxis tickFormatter={(value) => value.toLocaleString()} />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'Units') return [value.toLocaleString(), name];
                        if (name === 'Hours') return [`${value}h`, name];
                        return [value, name];
                      }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="units" fill="#f59e0b" name="Units" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Performance Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Operator Details</CardTitle>
              <p className="text-sm text-muted-foreground">Detailed performance metrics by operator</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {operatorData.map((operator) => (
                  <div key={operator.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="font-medium">{operator.name}</span>
                    <div className="text-right">
                      <div className="font-bold">{operator.units.toLocaleString()} units</div>
                      <div className="text-sm text-muted-foreground">{operator.time}h • {operator.efficiency} units/h</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Details</CardTitle>
              <p className="text-sm text-muted-foreground">Detailed performance metrics by activity</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activityData.map((activity) => (
                  <div key={activity.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="font-medium">{activity.name}</span>
                    <div className="text-right">
                      <div className="font-bold">{activity.units.toLocaleString()} units</div>
                      <div className="text-sm text-muted-foreground">{activity.time}h • {activity.efficiency} units/h</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SKU Details</CardTitle>
              <p className="text-sm text-muted-foreground">Detailed production metrics by SKU</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {skuData.map((sku) => (
                  <div key={sku.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex-1">
                      <span className="font-medium">{sku.name}</span>
                      <div className="text-xs text-muted-foreground mt-1">
                        Activities: {sku.activities.join(', ') || 'None'} • 
                        Operators: {sku.operators.join(', ') || 'None'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{sku.units.toLocaleString()} units</div>
                      <div className="text-sm text-muted-foreground">{sku.time}h • {sku.efficiency} units/h</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderDataQualityReport = (data: any) => {
    console.log('renderDataQualityReport called with:', data);
    
    // Handle the case where data might be wrapped in a 'data' property
    const actualData = data.data || data;
    if (!actualData) {
      return <div className="text-center text-muted-foreground">No data available for data quality report</div>;
    }

    // Prepare data for charts - QC data
    const productData = Object.entries(actualData.byProduct || {}).map(([product, metrics]: [string, any]) => ({
      name: product,
      tests: metrics.tests || 0,
      blades: metrics.blades || 0,
      defects: metrics.defects || 0,
      defectRate: Math.round((metrics.defectRate || 0) * 100) / 100
    }));

    const operatorQCData = Object.entries(actualData.byOperator || {}).map(([operator, metrics]: [string, any]) => ({
      name: operator,
      tests: metrics.tests || 0,
      blades: metrics.blades || 0,
      defects: metrics.defects || 0,
      defectRate: Math.round((metrics.defectRate || 0) * 100) / 100
    }));

    // Prepare data for charts - SKU data
    const skuData = Object.entries(actualData.bySKU || {}).map(([sku, metrics]: [string, any]) => ({
      name: sku,
      units: metrics.units || 0,
      scrap: metrics.scrap || 0,
      scrapRate: Math.round((metrics.scrapRate || 0) * 100) / 100,
      operators: metrics.operators || []
    }));

    // Prepare scrap data by operator
    const operatorScrapData = Object.entries(actualData.scrap_by_operator || {}).map(([operator, metrics]: [string, any]) => ({
      name: operator,
      scrap: metrics.scrap || 0,
      units: metrics.units || 0,
      scrapRate: Math.round((metrics.scrapRate || 0) * 100) / 100
    }));

    // Prepare scrap data by activity
    const activityScrapData = Object.entries(actualData.scrap_by_activity || {}).map(([activity, metrics]: [string, any]) => ({
      name: activity,
      scrap: metrics.scrap || 0,
      units: metrics.units || 0,
      scrapRate: Math.round((metrics.scrapRate || 0) * 100) / 100
    }));

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Total QC Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{actualData.total_tests || 0}</div>
              <div className="text-xs text-muted-foreground">Quality checks</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Total Blades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(actualData.total_blades || 0).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Tested blades</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Total Defects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{(actualData.total_defects || 0).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Failed QC</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Defect Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{actualData.overall_defect_rate || 0}%</div>
              <div className="text-xs text-muted-foreground">QC failure rate</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Scrap Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{actualData.scrap_summary?.scrap_rate || 0}%</div>
              <div className="text-xs text-muted-foreground">Production scrap</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Defect Rate Chart */}
          {productData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>QC Defect Rate by Product</CardTitle>
                <p className="text-sm text-muted-foreground">Quality performance across different products</p>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productData}>
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        height={60}
                        angle={-45}
                        textAnchor="end"
                      />
                      <YAxis tickFormatter={(value) => `${value}%`} />
                      <Tooltip 
                        formatter={(value: number, name: string) => {
                          if (name === 'Defect Rate') return [`${value}%`, name];
                          return [value.toLocaleString(), name];
                        }}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="defectRate" fill="#ef4444" name="Defect Rate" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SKU Scrap Rate Chart */}
          {skuData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Scrap Rate by SKU</CardTitle>
                <p className="text-sm text-muted-foreground">Production waste by product SKU</p>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={skuData}>
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        height={60}
                        angle={-45}
                        textAnchor="end"
                      />
                      <YAxis tickFormatter={(value) => `${value}%`} />
                      <Tooltip 
                        formatter={(value: number, name: string) => {
                          if (name === 'Scrap Rate') return [`${value}%`, name];
                          return [value.toLocaleString(), name];
                        }}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="scrapRate" fill="#f59e0b" name="Scrap Rate" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Detailed Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>QC Results by Product</CardTitle>
              <p className="text-sm text-muted-foreground">Detailed quality metrics by product</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {productData.map((product) => (
                  <div key={product.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="font-medium">{product.name}</span>
                    <div className="text-right">
                      <div className="font-bold">{product.tests} tests</div>
                      <div className="text-sm text-muted-foreground">
                        {product.blades.toLocaleString()} blades • {product.defects} defects • {product.defectRate}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scrap by SKU</CardTitle>
              <p className="text-sm text-muted-foreground">Production waste metrics by SKU</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {skuData.map((sku) => (
                  <div key={sku.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex-1">
                      <span className="font-medium">{sku.name}</span>
                      <div className="text-xs text-muted-foreground mt-1">
                        Operators: {sku.operators.join(', ') || 'None'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{sku.scrap} scrap</div>
                      <div className="text-sm text-muted-foreground">
                        {sku.units.toLocaleString()} units • {sku.scrapRate}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Scrap Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Scrap by Operator</CardTitle>
              <p className="text-sm text-muted-foreground">Production waste by operator</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {operatorScrapData.map((operator) => (
                  <div key={operator.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="font-medium">{operator.name}</span>
                    <div className="text-right">
                      <div className="font-bold">{operator.scrap} scrap</div>
                      <div className="text-sm text-muted-foreground">
                        {operator.units.toLocaleString()} units • {operator.scrapRate}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scrap by Activity</CardTitle>
              <p className="text-sm text-muted-foreground">Production waste by activity type</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activityScrapData.map((activity) => (
                  <div key={activity.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="font-medium">{activity.name}</span>
                    <div className="text-right">
                      <div className="font-bold">{activity.scrap} scrap</div>
                      <div className="text-sm text-muted-foreground">
                        {activity.units.toLocaleString()} units • {activity.scrapRate}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Quality & Scrap Recommendations</CardTitle>
            <p className="text-sm text-muted-foreground">Insights and recommendations based on current data</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(actualData.recommendations || []).map((recommendation: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-sm">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderReport = () => {
    switch (reportType) {
      case 'compliance':
        return renderComplianceReport(reportData);
      case 'productivity':
        return renderProductivityReport(reportData);
      case 'operator-summary':
        const summaryData = reportData?.data || reportData;
        return (
          <div className="space-y-6">
            {summaryData?.compliance && renderComplianceReport(summaryData.compliance)}
            {summaryData?.productivity && renderProductivityReport(summaryData.productivity)}
          </div>
        );
      case 'data-quality':
        return renderDataQualityReport(reportData);
      default:
        return <div>Report type not supported for viewing</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>
                {description && (
                  <div className="mb-1">{description}</div>
                )}
                Generated on {format(new Date(generatedAt), 'PPP p')}
              </CardDescription>
            </div>
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardHeader>
      </Card>

      {/* Report Content */}
      {renderReport()}
    </div>
  );
}