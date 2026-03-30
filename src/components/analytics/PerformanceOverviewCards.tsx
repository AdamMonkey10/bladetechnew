import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users2, Target, AlertTriangle, Clock, Zap, Wrench, UserCheck, Timer } from 'lucide-react';

interface OverallStats {
  totalShifts: number;
  totalUnits: number;
  totalScrap: number;
  avgEfficiency: number;
  avgScrapRate: number;
  laserStats?: {
    avgEfficiency: number;
    totalUnits: number;
    operators: number;
  };
  nonLaserStats?: {
    avgEfficiency: number;
    totalUnits: number;
    operators: number;
  };
  attendanceStats?: {
    totalClockEvents: number;
    attendanceRate: number;
    avgHoursWorked: number;
    punctualityScore: number;
  };
}

interface PerformanceOverviewCardsProps {
  stats: OverallStats;
  isLoading?: boolean;
}

export function PerformanceOverviewCards({ stats, isLoading }: PerformanceOverviewCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Shifts",
      value: stats.totalShifts.toLocaleString(),
      icon: Users2,
      description: "Production shifts completed",
      color: "text-primary",
    },
    {
      title: "Units Produced",
      value: stats.totalUnits.toLocaleString(),
      icon: Target,
      description: "Total units manufactured",
      color: "text-green-600",
    },
    {
      title: "Average Efficiency",
      value: `${stats.avgEfficiency.toFixed(1)} u/h`,
      icon: Clock,
      description: "Units per hour average",
      color: "text-blue-600",
    },
    {
      title: "Scrap Rate",
      value: `${stats.avgScrapRate.toFixed(1)}%`,
      icon: AlertTriangle,
      description: "Quality defect percentage",
      color: stats.avgScrapRate > 5 ? "text-red-600" : "text-orange-600",
    },
  ];

  // Add laser-specific cards if data is available
  if (stats.laserStats) {
    cards.push({
      title: "Laser Efficiency",
      value: `${stats.laserStats.avgEfficiency.toFixed(1)} u/h`,
      icon: Zap,
      description: `${stats.laserStats.totalUnits.toLocaleString()} units by ${stats.laserStats.operators} operators`,
      color: "text-purple-600",
    });
  }

  if (stats.nonLaserStats) {
    cards.push({
      title: "Non-Laser Efficiency",
      value: `${stats.nonLaserStats.avgEfficiency.toFixed(1)} u/h`,
      icon: Wrench,
      description: `${stats.nonLaserStats.totalUnits.toLocaleString()} units by ${stats.nonLaserStats.operators} operators`,
      color: "text-indigo-600",
    });
  }

  // Add attendance cards if data is available
  if (stats.attendanceStats) {
    cards.push({
      title: "Clock Events",
      value: stats.attendanceStats.totalClockEvents.toLocaleString(),
      icon: UserCheck,
      description: "Total clock-ins and clock-outs",
      color: "text-emerald-600",
    });

    cards.push({
      title: "Avg Hours Worked",
      value: `${stats.attendanceStats.avgHoursWorked.toFixed(1)}h`,
      icon: Timer,
      description: `${stats.attendanceStats.attendanceRate.toFixed(1)}% attendance rate`,
      color: "text-cyan-600",
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}