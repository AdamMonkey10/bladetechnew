import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { 
  CalendarIcon, 
  Download, 
  FileText, 
  BarChart3,
  Users,
  Clock,
  AlertTriangle,
  Eye,
  FileSpreadsheet,
  Mail,
  Settings,
  Filter,
  Save,
  Share,
  Bookmark,
  Play,
  RefreshCw,
  Zap
} from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ReportViewer } from "@/components/timesheet-management/ReportViewer";

export function InteractiveTimesheetReports() {
  const [activeTab, setActiveTab] = useState("builder");
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [reportType, setReportType] = useState("");
  const [operatorFilter, setOperatorFilter] = useState("all");
  const [outputFormat, setOutputFormat] = useState("view");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [reportName, setReportName] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const { toast } = useToast();

  // Predefined report templates
  const reportTemplates = [
    {
      id: "weekly-compliance",
      name: "Weekly Compliance Summary",
      description: "Standard weekly compliance report with key metrics",
      type: "compliance",
      dateRange: 7,
      format: "pdf",
      icon: <Calendar className="h-4 w-4" />
    },
    {
      id: "operator-deep-dive",
      name: "Operator Performance Deep Dive",
      description: "Detailed analysis of individual operator performance",
      type: "operator-summary",
      dateRange: 30,
      format: "excel",
      icon: <Users className="h-4 w-4" />
    },
    {
      id: "monthly-trends",
      name: "Monthly Trends Analysis",
      description: "Comprehensive monthly trends and patterns analysis",
      type: "productivity",
      dateRange: 30,
      format: "view",
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      id: "data-quality-audit",
      name: "Data Quality Audit",
      description: "Comprehensive data quality and integrity check",
      type: "data-quality",
      dateRange: 90,
      format: "csv",
      icon: <AlertTriangle className="h-4 w-4" />
    }
  ];

  const reportTypes = [
    {
      id: "compliance",
      name: "Timesheet Compliance Report",
      description: "Shows submission rates and overdue timesheets by operator",
      icon: <Clock className="h-4 w-4" />,
      features: ["Compliance metrics", "Overdue tracking", "Escalation analysis"],
      estimatedTime: "2-3 minutes"
    },
    {
      id: "productivity",
      name: "Productivity Analysis",
      description: "Detailed productivity metrics and trends by operator",
      icon: <BarChart3 className="h-4 w-4" />,
      features: ["Performance trends", "Output analysis", "Efficiency metrics"],
      estimatedTime: "3-5 minutes"
    },
    {
      id: "operator-summary",
      name: "Operator Summary Report",
      description: "Individual operator performance and timesheet history",
      icon: <Users className="h-4 w-4" />,
      features: ["Individual profiles", "Performance history", "Recommendations"],
      estimatedTime: "1-2 minutes"
    },
    {
      id: "data-quality",
      name: "Data Quality Report",
      description: "Identifies data inconsistencies and missing information",
      icon: <AlertTriangle className="h-4 w-4" />,
      features: ["Data validation", "Missing data detection", "Quality scores"],
      estimatedTime: "4-6 minutes"
    }
  ];

  const outputFormats = [
    {
      id: "view",
      name: "Interactive Dashboard",
      description: "Real-time web report with interactive charts and filtering",
      icon: <Eye className="h-4 w-4" />,
      features: ["Interactive charts", "Live filtering", "Drill-down capability"]
    },
    {
      id: "pdf",
      name: "Professional PDF",
      description: "Formatted document ready for printing and sharing",
      icon: <FileText className="h-4 w-4" />,
      features: ["Professional layout", "Charts included", "Print-ready"]
    },
    {
      id: "excel",
      name: "Excel Workbook",
      description: "Comprehensive spreadsheet with multiple worksheets",
      icon: <FileSpreadsheet className="h-4 w-4" />,
      features: ["Multiple sheets", "Raw data", "Pivot tables"]
    },
    {
      id: "csv",
      name: "CSV Export",
      description: "Raw data export for further analysis",
      icon: <Download className="h-4 w-4" />,
      features: ["Raw data", "Machine readable", "Analysis ready"]
    },
    {
      id: "email",
      name: "Email Distribution",
      description: "Automated email delivery to stakeholders",
      icon: <Mail className="h-4 w-4" />,
      features: ["Auto delivery", "Custom recipients", "Scheduled sending"]
    }
  ];

  const loadTemplate = (template: typeof reportTemplates[0]) => {
    setReportType(template.type);
    setOutputFormat(template.format);
    setDateFrom(subDays(new Date(), template.dateRange));
    setDateTo(new Date());
    setReportName(template.name);
    setReportDescription(template.description);
    
    toast({
      title: "Template Loaded",
      description: `${template.name} template has been applied`,
    });
  };

  const handleGenerateReport = async () => {
    if (!reportType) {
      toast({
        title: "Missing Information",
        description: "Please select a report type",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const params = {
        type: reportType,
        dateFrom: dateFrom?.toISOString(),
        dateTo: dateTo?.toISOString(),
        operator: operatorFilter,
        format: outputFormat,
        includeCharts,
        includeRecommendations,
        reportName,
        reportDescription
      };

      console.log("Generating enhanced report:", params);

      const { data, error } = await supabase.functions.invoke('generate-timesheet-report', {
        body: params
      });

      if (error) throw error;

      if (outputFormat === 'view') {
        setCurrentReport({
          data: data,
          type: reportType,
          title: reportName || reportTypes.find(t => t.id === reportType)?.name || 'Report',
          description: reportDescription,
          generatedAt: new Date().toISOString(),
          includeCharts,
          includeRecommendations
        });
        setActiveTab("viewer");
        toast({
          title: "Report Generated",
          description: "Interactive report is ready for viewing",
        });
      } else if (outputFormat === 'email') {
        toast({
          title: "Report Sent",
          description: "Report has been sent to the specified recipients",
        });
      } else {
        if (data?.content) {
          const blob = new Blob([data.content], { 
            type: data.contentType || 'text/plain' 
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = data.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
        toast({
          title: "Report Generated",
          description: `${reportName || 'Report'} has been downloaded`,
        });
      }
    } catch (error: any) {
      console.error('Report generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate report",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedReportType = reportTypes.find(type => type.id === reportType);
  const selectedOutputFormat = outputFormats.find(format => format.id === outputFormat);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Interactive Report Builder</h2>
          <p className="text-muted-foreground">
            Create customized timesheet and compliance reports with advanced options
          </p>
        </div>
        {currentReport && (
          <Button variant="outline" onClick={() => setCurrentReport(null)}>
            Create New Report
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="builder">Report Builder</TabsTrigger>
          <TabsTrigger value="schedule">Schedule & Automation</TabsTrigger>
          <TabsTrigger value="viewer" disabled={!currentReport}>Report Viewer</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Start Templates</CardTitle>
              <CardDescription>
                Pre-configured report templates for common use cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportTemplates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {template.icon}
                        {template.name}
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Type: {reportTypes.find(t => t.id === template.type)?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Period: {template.dateRange} days
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Format: {outputFormats.find(f => f.id === template.format)?.name}
                          </p>
                        </div>
                        <Button onClick={() => loadTemplate(template)}>
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report Configuration */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Report Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure your report parameters and options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Report Name</Label>
                      <Input
                        value={reportName}
                        onChange={(e) => setReportName(e.target.value)}
                        placeholder="Enter report name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Report Type</Label>
                      <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          {reportTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              <div className="flex items-center gap-2">
                                {type.icon}
                                {type.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Textarea
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Describe the purpose or context of this report"
                      rows={2}
                    />
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>From Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !dateFrom && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateFrom ? format(dateFrom, "PPP") : "Start date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateFrom}
                            onSelect={setDateFrom}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>To Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !dateTo && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateTo ? format(dateTo, "PPP") : "End date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateTo}
                            onSelect={setDateTo}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="space-y-2">
                    <Label>Operator Filter (Optional)</Label>
                    <Select value={operatorFilter} onValueChange={setOperatorFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All operators" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All operators</SelectItem>
                        <SelectItem value="craig">Craig Mitchell</SelectItem>
                        <SelectItem value="john">John Smith</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Report Options */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Report Options</Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-normal">Include Charts & Visualizations</Label>
                          <p className="text-sm text-muted-foreground">Add graphs and charts to the report</p>
                        </div>
                        <Switch checked={includeCharts} onCheckedChange={setIncludeCharts} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-normal">Include AI Recommendations</Label>
                          <p className="text-sm text-muted-foreground">Add AI-powered insights and suggestions</p>
                        </div>
                        <Switch checked={includeRecommendations} onCheckedChange={setIncludeRecommendations} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-normal">Auto-refresh Report</Label>
                          <p className="text-sm text-muted-foreground">Automatically update data when viewing</p>
                        </div>
                        <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Output Format Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Output Format</CardTitle>
                  <CardDescription>Choose how you want to receive your report</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={outputFormat} onValueChange={setOutputFormat} className="grid grid-cols-1 gap-4">
                    {outputFormats.map((format) => (
                      <div key={format.id} className="flex items-center space-x-3">
                        <RadioGroupItem value={format.id} id={format.id} />
                        <Label 
                          htmlFor={format.id} 
                          className="flex-1 cursor-pointer p-4 border rounded-lg hover:bg-accent transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            {format.icon}
                            <div className="flex-1">
                              <div className="font-medium">{format.name}</div>
                              <div className="text-sm text-muted-foreground">{format.description}</div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {format.features.map((feature, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Preview & Actions */}
            <div className="space-y-6">
              {selectedReportType && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {selectedReportType.icon}
                      Report Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-medium">{selectedReportType.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedReportType.description}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Features Included:</Label>
                      <div className="space-y-1">
                        {selectedReportType.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Estimated time: {selectedReportType.estimatedTime}
                      </p>
                      {selectedOutputFormat && (
                        <p className="text-sm text-muted-foreground">
                          <FileText className="h-3 w-3 inline mr-1" />
                          Output: {selectedOutputFormat.name}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={handleGenerateReport}
                    disabled={!reportType || isGenerating}
                    className="w-full flex items-center gap-2"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Generate Report
                      </>
                    )}
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Save className="h-3 w-3" />
                      Save Template
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Bookmark className="h-3 w-3" />
                      Bookmark
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Automation & Scheduling
              </CardTitle>
              <CardDescription>
                Set up automated report generation and distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4" />
                <p className="font-medium">Automation Features Coming Soon</p>
                <p className="text-sm">Schedule automatic report generation and distribution</p>
                <Button variant="outline" className="mt-4">
                  Request Early Access
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="viewer" className="space-y-6">
          {currentReport && (
            <ReportViewer 
              reportData={currentReport.data} 
              reportType={currentReport.type}
              title={currentReport.title}
              description={currentReport.description}
              generatedAt={currentReport.generatedAt}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}