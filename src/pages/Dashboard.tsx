import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { 
  ClipboardCheck, 
  Package, 
  Users, 
  Calendar,
  FileText,
  BarChart3,
  Wrench,
  ShoppingCart,
  Database,
  Clock,
  Tags,
  AlertTriangle,
  Hand,
  Settings,
  Warehouse
} from 'lucide-react';
import { useTimesheetTracking } from '@/hooks/useTimesheetTracking';

export default function Dashboard() {
  // Force cache refresh - Manual Label Printing moved to dedicated page
  const currentTime = new Date().toLocaleString();
  const { operatorStats, loading: timesheetLoading } = useTimesheetTracking();

  const navigationCards = [
    // Top Row - Primary Operations
    {
      title: "QC Test",
      description: "Quality control test forms and checks",
      icon: ClipboardCheck,
      path: "/qc-test",
      color: "text-blue-600"
    },
    {
      title: "Label Printing",
      description: "Basic label printing functionality",
      icon: Tags,
      path: "/label-printing",
      color: "text-teal-600"
    },
    {
      title: "Time Sheets",
      description: "Shift management and schedules",
      icon: Calendar,
      path: "/shifts",
      color: "text-cyan-600"
    },
    // Middle Row - Material & Order Management
    {
      title: "Pallet Management",
      description: "Manage pallets and track shipments",
      icon: Package,
      path: "/pallet-management",
      color: "text-emerald-600"
    },
    {
      title: "Goods In",
      description: "Record incoming goods and materials",
      icon: Database,
      path: "/goods-in",
      color: "text-orange-600"
    },
    {
      title: "Customer Purchase Orders",
      description: "Purchase order management",
      icon: ShoppingCart,
      path: "/customer-po",
      color: "text-indigo-600"
    },
    // Bottom Row - Supporting Functions
    {
      title: "Test Results",
      description: "View and analyze test reports",
      icon: FileText,
      path: "/reports",
      color: "text-green-600"
    },
    {
      title: "Stock Reports", 
      description: "View and manage inventory records",
      icon: Package,
      path: "/inventory",
      color: "text-purple-600"
    },
    {
      title: "SKU Management",
      description: "Manage products and raw materials",
      icon: Wrench,
      path: "/sku-management",
      color: "text-amber-600"
    },
    {
      title: "Manual Label Printing",
      description: "Quick manual label printing for non-laser products",
      icon: Hand,
      path: "/manual-label-printing",
      color: "text-rose-600"
    },
    {
      title: "Timesheet Management",
      description: "Comprehensive timesheet oversight and data quality control",
      icon: Settings,
      path: "/timesheet-management",
      color: "text-slate-600"
    },
    {
      title: "Weekly Breakdown",
      description: "Detailed weekly production analysis and metrics",
      icon: BarChart3,
      path: "/weekly-breakdown", 
      color: "text-violet-600"
    },
    {
      title: "Warehouse",
      description: "Interactive warehouse management and inventory tracking",
      icon: Warehouse,
      path: "/warehouse",
      color: "text-blue-500"
    }
  ];

  const totalOverdueTimesheets = operatorStats?.reduce((sum, stat) => sum + stat.total_overdue, 0) || 0;
  const criticalOperators = operatorStats?.filter(stat => stat.highest_escalation === 'critical').length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">BLADETECH</h1>
          <p className="text-muted-foreground mt-2">Quality Control Management System</p>
        </div>
        <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg border">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-mono">{currentTime}</p>
        </div>
      </div>

      {/* Overdue Timesheets Alert */}
      {!timesheetLoading && totalOverdueTimesheets > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-orange-900">Overdue Timesheets Alert</h3>
                  <p className="text-sm text-orange-700">
                    {totalOverdueTimesheets} overdue timesheets across {operatorStats?.length || 0} operators
                    {criticalOperators > 0 && ` • ${criticalOperators} critical (6+ days)`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link to="/overdue-timesheets">
                  <button className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors">
                    View Details
                  </button>
                </Link>
                <Link to="/timesheet-management">
                  <button className="bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition-colors">
                    Manage All
                  </button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {navigationCards.map((card) => (
          <Link key={card.path} to={card.path}>
            <Card className="hover:shadow-[0_35px_80px_rgba(0,0,0,0.4)] shadow-[0_15px_50px_rgba(0,0,0,0.2)] transition-all duration-700 hover:scale-110 cursor-pointer group min-h-[260px] flex flex-col border-4 hover:border-primary/40 bg-gradient-to-br from-card via-card/90 to-card/70 hover:-translate-y-4">
              <CardHeader className="pb-6 flex-shrink-0 p-8">
                <div className="flex items-center gap-6">
                  <div className={`p-6 rounded-3xl bg-gradient-to-br from-muted via-muted/80 to-muted/40 group-hover:from-primary/40 group-hover:via-primary/25 group-hover:to-primary/10 transition-all duration-700 shadow-2xl group-hover:shadow-primary/20`}>
                    <card.icon className={`h-12 w-12 ${card.color} group-hover:text-primary transition-all duration-700 group-hover:scale-150 group-hover:rotate-6 drop-shadow-2xl`} />
                  </div>
                  <CardTitle className="text-2xl group-hover:text-primary transition-all duration-700 font-bold group-hover:scale-110 drop-shadow-lg">
                    {card.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-grow flex items-center p-8">
                <p className="text-lg text-muted-foreground group-hover:text-foreground transition-all duration-700 leading-relaxed font-medium">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}