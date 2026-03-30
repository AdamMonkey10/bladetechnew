import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Package, ClipboardCheck, Tags, Calendar, Database, ShoppingCart, FileText, BarChart3, Wrench, Users, Settings, Boxes } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function HelpSystem() {
  const [open, setOpen] = useState(false);

  const dailyTasks = [
    {
      name: "QC Testing Procedure",
      icon: ClipboardCheck,
      steps: [
        "1. Select the correct product code from the dropdown",
        "2. Use calibrated measuring tools for all measurements",
        "3. Record Gauge: Use micrometer, measure at 3 points, record average",
        "4. Record Height: Use caliper, measure blade height from base",
        "5. Record Set measurements: Left and Right using set gauge",
        "6. Record Flatness: Use precision straight edge and feeler gauges",
        "7. Click Submit - system will automatically check against specifications",
        "8. If FAIL result: Set product aside, notify supervisor immediately"
      ]
    },
    {
      name: "Label Printing Operation", 
      icon: Tags,
      steps: [
        "1. Check work order and customer PO details",
        "2. Select your operator code from dropdown",
        "3. Choose correct laser machine (Laser1/Laser2)",
        "4. Enter exact SKU code - double check with work order",
        "5. Enter quantity to print (match work order)",
        "6. Click Print Label - system generates ZPL code",
        "7. Verify label prints correctly before continuing batch",
        "8. Complete session log with actual quantities printed"
      ]
    },
    {
      name: "Shift Documentation",
      icon: Calendar, 
      steps: [
        "1. Clock in and select your operator code",
        "2. Record machine assignment for the shift",
        "3. Note start time and any setup requirements",
        "4. Log production activities throughout shift",
        "5. Record quantities produced per activity type",
        "6. Log any downtime or maintenance issues",
        "7. Complete end-of-shift summary",
        "8. Handover notes to next shift operator"
      ]
    }
  ];

  const materialHandling = [
    {
      name: "Receiving Raw Materials",
      icon: Database,
      procedure: [
        "1. Check delivery note against expected deliveries",
        "2. Inspect packaging for damage before accepting",
        "3. Record supplier, invoice number, and pallet number",
        "4. Sample material for incoming QC tests",
        "5. Perform gauge and set measurements on samples",
        "6. Record all measurements in Goods In system",
        "7. Apply PASS/FAIL status based on specifications",
        "8. Store approved material in designated area with batch tags"
      ],
      checkpoints: ["Visual inspection", "Dimensional checks", "Documentation complete", "Storage location"]
    },
    {
      name: "Pallet Assembly",
      icon: Package,
      procedure: [
        "1. Check customer PO for pallet requirements",
        "2. Create new pallet in system with correct PO number",
        "3. Scan or manually assign printed labels to pallet",
        "4. Monitor fill status - system tracks automatically",
        "5. When pallet is full, system marks as complete",
        "6. Generate shipping label with QR code",
        "7. Apply label to pallet and move to shipping area",
        "8. Update pallet status to 'Ready for Dispatch'"
      ],
      checkpoints: ["Correct PO", "Label assignment", "Full capacity", "Shipping label applied"]
    },
    {
      name: "Work Order Management",
      icon: ShoppingCart,
      procedure: [
        "1. Review daily work orders and priorities",
        "2. Check customer PO details and delivery dates",
        "3. Verify material availability for production",
        "4. Coordinate with production schedule",
        "5. Monitor progress throughout production",
        "6. Update quantities as labels are printed",
        "7. Flag any delays or issues immediately",
        "8. Confirm completion when order is finished"
      ],
      checkpoints: ["Material ready", "Schedule confirmed", "Progress updated", "Quality maintained"]
    }
  ];

  const troubleshooting = [
    {
      problem: "QC Test shows FAIL result",
      solutions: [
        "• Double-check measurement technique and tool calibration",
        "• Re-measure the same piece 3 times for consistency", 
        "• Check if using correct product specifications",
        "• If consistently failing, stop production and notify supervisor",
        "• Document the issue and affected batch numbers"
      ]
    },
    {
      problem: "Label won't print or prints incorrectly",
      solutions: [
        "• Check printer power and connection status",
        "• Verify correct SKU code entry (case sensitive)",
        "• Ensure thermal paper is loaded correctly",
        "• Clean printer head if print quality is poor",
        "• Restart printer and try again"
      ]
    },
    {
      problem: "Cannot find SKU in system",
      solutions: [
        "• Verify SKU spelling and format with work order",
        "• Check if product is set up in SKU Management",
        "• Contact supervisor if new product setup needed",
        "• Use similar product temporarily with supervisor approval"
      ]
    },
    {
      problem: "System running slowly or freezing",
      solutions: [
        "• Close unnecessary browser tabs",
        "• Refresh the page (F5) and log in again",
        "• Clear browser cache if problems persist",
        "• Check network connection",
        "• Report to IT if issues continue"
      ]
    }
  ];

  const quickReference = {
    measurements: [
      { parameter: "Gauge", tool: "Micrometer", tolerance: "±0.002\"", frequency: "Every piece" },
      { parameter: "Height", tool: "Caliper", tolerance: "±0.005\"", frequency: "Every piece" },
      { parameter: "Set Left/Right", tool: "Set Gauge", tolerance: "±0.001\"", frequency: "Every piece" },
      { parameter: "Flatness", tool: "Straight Edge", tolerance: "0.003\" max", frequency: "Sample basis" }
    ],
    qualityStandards: [
      { check: "Visual Inspection", criteria: "No cracks, chips, or damage", action: "Reject immediately" },
      { check: "Dimension Check", criteria: "Within specification limits", action: "Pass/Fail in system" },
      { check: "Edge Quality", criteria: "Clean, sharp edges", action: "Document any issues" },
      { check: "Surface Finish", criteria: "Smooth, no burrs", action: "Deburr if needed" }
    ],
    shiftProcedures: [
      { time: "Start of Shift", task: "Check equipment calibration", duration: "15 min" },
      { time: "Every 2 Hours", task: "Update production logs", duration: "5 min" },
      { time: "Mid-Shift", task: "Quality control checks", duration: "20 min" },
      { time: "End of Shift", task: "Complete documentation", duration: "10 min" }
    ]
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Help</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Workflow Guide & Help</p>
          </TooltipContent>
        </Tooltip>

        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              BladeTech Quality Control System - Help & Workflow Guide
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="daily" className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="daily">Daily Tasks</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
            </TabsList>

            <div className="overflow-y-auto max-h-[60vh] mt-4">
              <TabsContent value="daily" className="space-y-4">
                {dailyTasks.map((task) => (
                  <Card key={task.name}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <task.icon className="h-5 w-5" />
                        {task.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-muted p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Step-by-Step Procedure</h4>
                        <div className="space-y-1">
                          {task.steps.map((step, index) => (
                            <p key={index} className="text-sm">{step}</p>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="materials" className="space-y-4">
                {materialHandling.map((material) => (
                  <Card key={material.name}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <material.icon className="h-5 w-5" />
                        {material.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-muted p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Procedure</h4>
                        <div className="space-y-1">
                          {material.procedure.map((step, index) => (
                            <p key={index} className="text-sm">{step}</p>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Quality Checkpoints</h4>
                        <div className="flex flex-wrap gap-2">
                          {material.checkpoints.map((checkpoint) => (
                            <Badge key={checkpoint} variant="outline">{checkpoint}</Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}