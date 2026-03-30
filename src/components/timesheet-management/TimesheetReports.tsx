import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  Mail
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ReportViewer } from "./ReportViewer";

export function TimesheetReports() {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [reportType, setReportType] = useState("");
  const [operatorFilter, setOperatorFilter] = useState("all");
  const [outputFormat, setOutputFormat] = useState("view");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentReport, setCurrentReport] = useState<any>(null);
  const { toast } = useToast();

  const reportTypes = [
    {
      id: "compliance",
      name: "Timesheet Compliance Report",
      description: "Shows submission rates and overdue timesheets by operator",
      icon: <Clock className="h-4 w-4" />
    },
    {
      id: "productivity",
      name: "Productivity Analysis",
      description: "Detailed productivity metrics and trends by operator",
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      id: "operator-summary",
      name: "Operator Summary Report",
      description: "Individual operator performance and timesheet history",
      icon: <Users className="h-4 w-4" />
    },
    {
      id: "data-quality",
      name: "Data Quality Report",
      description: "Identifies data inconsistencies and missing information",
      icon: <AlertTriangle className="h-4 w-4" />
    }
  ];

  const outputFormats = [
    {
      id: "view",
      name: "View Online",
      description: "Interactive web report with charts and filtering",
      icon: <Eye className="h-4 w-4" />
    },
    {
      id: "csv",
      name: "CSV Download",
      description: "Raw data export for analysis",
      icon: <Download className="h-4 w-4" />
    },
    {
      id: "excel",
      name: "Excel Download",
      description: "Formatted spreadsheet with charts",
      icon: <FileSpreadsheet className="h-4 w-4" />
    },
    {
      id: "pdf",
      name: "PDF Download",
      description: "Professional formatted document",
      icon: <FileText className="h-4 w-4" />
    },
    {
      id: "email",
      name: "Email Report",
      description: "Send report to specified recipients",
      icon: <Mail className="h-4 w-4" />
    }
  ];

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
        format: outputFormat
      };

      console.log("Generating report:", params);

      // Call the edge function for report generation
      const { data, error } = await supabase.functions.invoke('generate-timesheet-report', {
        body: params
      });

      if (error) throw error;

      if (outputFormat === 'view') {
        // Handle web view - set current report to display
        setCurrentReport({
          data: data,
          type: reportType,
          title: reportTypes.find(t => t.id === reportType)?.name || 'Report',
          generatedAt: new Date().toISOString()
        });
        toast({
          title: "Report Generated",
          description: "Report is ready for viewing",
        });
      } else if (outputFormat === 'email') {
        toast({
          title: "Report Sent",
          description: "Report has been sent to the specified recipients",
        });
      } else {
        // Handle file downloads
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
          description: `Report has been downloaded`,
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

  // If viewing a report, show the viewer
  if (currentReport && outputFormat === 'view') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setCurrentReport(null)}
          >
            ← Back to Report Configuration
          </Button>
        </div>
        <ReportViewer 
          reportData={currentReport.data} 
          reportType={currentReport.type}
          title={currentReport.title}
          generatedAt={currentReport.generatedAt}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Reports</CardTitle>
          <CardDescription>
            Create detailed timesheet and productivity reports with customizable filters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Date Range */}
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
                    className="pointer-events-auto"
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
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Report Type */}
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

            {/* Operator Filter */}
            <div className="space-y-2">
              <Label>Operator (Optional)</Label>
              <Select value={operatorFilter} onValueChange={setOperatorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All operators" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All operators</SelectItem>
                  <SelectItem value="craig">Craig Mitchell</SelectItem>
                  <SelectItem value="john">John Smith</SelectItem>
                  {/* TODO: Load operators dynamically */}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Output Format Selection */}
          <div className="space-y-4 mt-6">
            <Label>Output Format</Label>
            <RadioGroup value={outputFormat} onValueChange={setOutputFormat} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {outputFormats.map((format) => (
                <div key={format.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={format.id} id={format.id} />
                  <Label 
                    htmlFor={format.id} 
                    className="flex items-center gap-2 cursor-pointer flex-col text-center p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    {format.icon}
                    <span className="font-medium">{format.name}</span>
                    <span className="text-xs text-muted-foreground">{format.description}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <Button 
              onClick={handleGenerateReport}
              disabled={!reportType || isGenerating}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {isGenerating ? "Generating..." : `Generate ${outputFormats.find(f => f.id === outputFormat)?.name || "Report"}`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((type) => (
          <Card 
            key={type.id} 
            className={cn(
              "cursor-pointer transition-all duration-200",
              reportType === type.id 
                ? "ring-2 ring-primary bg-primary/5 shadow-md" 
                : "hover:shadow-md hover:bg-accent/50"
            )}
          >
            <CardHeader>
              <CardTitle className={cn(
                "flex items-center gap-2",
                reportType === type.id && "text-primary"
              )}>
                {type.icon}
                {type.name}
                {reportType === type.id && (
                  <Badge variant="default" className="ml-auto">Selected</Badge>
                )}
              </CardTitle>
              <CardDescription>{type.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant={reportType === type.id ? "default" : "outline"}
                onClick={() => setReportType(type.id)}
                className="w-full"
              >
                {reportType === type.id ? "Selected" : "Select Report"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>
            Previously generated reports and exports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No recent reports available. Generate your first report above.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}