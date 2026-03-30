import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OEETimeSeriesData {
  date: string;
  activity_type: string;
  oee_247: number;
  oee_booked: number;
  availability_247: number;
  performance_247: number;
  availability_booked: number;
  performance_booked: number;
  quality: number;
  total_units: number;
  total_time: number;
  booked_hours: number;
}

interface OEESpeedometerChartProps {
  data: OEETimeSeriesData[];
  className?: string;
}

const ACTIVITY_COLORS = {
  'Laser1': 'hsl(220, 91%, 60%)', // #3b82f6
  'Laser2': 'hsl(160, 84%, 39%)', // #10b981
  'Laser3': 'hsl(38, 92%, 50%)',  // #f59e0b
  'Welder': 'hsl(0, 84%, 60%)',   // #ef4444
  'Other': 'hsl(248, 53%, 58%)',  // #8b5cf6
};

const getOEEColor = (value: number) => {
  if (value >= 85) return 'hsl(142, 76%, 36%)'; // Green
  if (value >= 70) return 'hsl(48, 96%, 53%)';  // Yellow
  return 'hsl(0, 84%, 60%)'; // Red
};

export const OEESpeedometerChart = ({ data, className }: OEESpeedometerChartProps) => {
  // Calculate average OEE by activity type
  const activityAverages = data.reduce((acc, item) => {
    if (!acc[item.activity_type]) {
      acc[item.activity_type] = {
        activity: item.activity_type,
        oee_247_sum: 0,
        oee_booked_sum: 0,
        count: 0,
      };
    }
    
    acc[item.activity_type].oee_247_sum += item.oee_247;
    acc[item.activity_type].oee_booked_sum += item.oee_booked;
    acc[item.activity_type].count += 1;
    
    return acc;
  }, {} as Record<string, any>);

  const activityData = Object.values(activityAverages).map((item: any) => {
    const oee247 = Number((item.oee_247_sum / item.count).toFixed(1));
    const oeeBooked = Number((item.oee_booked_sum / item.count).toFixed(1));
    
    return {
      activity: item.activity,
      oee_247: oee247,
      oee_booked: oeeBooked,
      activityColor: ACTIVITY_COLORS[item.activity as keyof typeof ACTIVITY_COLORS] || ACTIVITY_COLORS.Other,
    };
  });

  const ActivitySpeedometer = ({ activity, oee_247, oee_booked, activityColor }: any) => {
    const size = 200;
    const strokeWidth = 12;
    const center = size / 2;
    const radius = center - strokeWidth / 2 - 10;
    
    // Semi-circle path (180 degrees)
    const startAngle = 180; // Start from left (180°)
    const endAngle = 0;     // End at right (0°)
    
    const createArcPath = (startAngle: number, endAngle: number, r: number) => {
      const start = polarToCartesian(center, center, r, endAngle);
      const end = polarToCartesian(center, center, r, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
    };

    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
      return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
      };
    };

    // Calculate needle angles (0-100% maps to 180°-0°)
    const needle247Angle = 180 - (Math.min(Math.max(oee_247 || 0, 0), 100) / 100) * 180;
    const needleBookedAngle = 180 - (Math.min(Math.max(oee_booked || 0, 0), 100) / 100) * 180;

    const createNeedle = (angle: number, color: string, length: number) => {
      const needleEnd = polarToCartesian(center, center, length, angle);
      return (
        <g>
          <line
            x1={center}
            y1={center}
            x2={needleEnd.x}
            y2={needleEnd.y}
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle
            cx={center}
            cy={center}
            r="4"
            fill={color}
          />
        </g>
      );
    };

    // Scale marks
    const scaleMarks = [0, 25, 50, 75, 100];

    return (
      <Card className="text-center">
        <CardContent className="p-4">
          <div className="relative">
            <svg width={size} height={size * 0.7} className="mx-auto">
              {/* Background arc */}
              <path
                d={createArcPath(startAngle, endAngle, radius)}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
              
              {/* 24/7 OEE arc (outer) */}
              <path
                d={createArcPath(startAngle, startAngle - (oee_247 / 100) * 180, radius)}
                fill="none"
                stroke={activityColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity="0.7"
              />
              
              {/* Booked OEE arc (inner) */}
              <path
                d={createArcPath(startAngle, startAngle - (oee_booked / 100) * 180, radius - 20)}
                fill="none"
                stroke={getOEEColor(oee_booked)}
                strokeWidth={strokeWidth - 2}
                strokeLinecap="round"
              />

              {/* Scale marks */}
              {scaleMarks.map((mark) => {
                const angle = 180 - (mark / 100) * 180;
                const tickStart = polarToCartesian(center, center, radius + 5, angle);
                const tickEnd = polarToCartesian(center, center, radius + 15, angle);
                const textPos = polarToCartesian(center, center, radius + 25, angle);
                
                return (
                  <g key={mark}>
                    <line
                      x1={tickStart.x}
                      y1={tickStart.y}
                      x2={tickEnd.x}
                      y2={tickEnd.y}
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth="2"
                    />
                    <text
                      x={textPos.x}
                      y={textPos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-muted-foreground text-xs font-medium"
                    >
                      {mark}%
                    </text>
                  </g>
                );
              })}

              {/* Needles */}
              {createNeedle(needle247Angle, activityColor, radius - 15)}
              {createNeedle(needleBookedAngle, getOEEColor(oee_booked), radius - 35)}
            </svg>
            
            {/* Center display values */}
            <div className="absolute inset-x-0 bottom-8 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-foreground">{Math.max(oee_247, oee_booked)}%</div>
                <div className="text-xs text-muted-foreground">Peak OEE</div>
              </div>
            </div>
          </div>
          
          {/* Activity info */}
          <div className="mt-4 text-center">
            <h3 className="font-semibold text-lg text-foreground mb-3">{activity}</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center justify-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: activityColor }}
                />
                <div>
                  <div className="text-muted-foreground">24/7</div>
                  <div className="font-medium">{oee_247}%</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getOEEColor(oee_booked) }}
                />
                <div>
                  <div className="text-muted-foreground">Booked</div>
                  <div className="font-medium">{oee_booked}%</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">OEE Performance by Activity</CardTitle>
        <p className="text-sm text-muted-foreground">
          Semi-circular gauges showing 24/7 OEE (outer arc) vs Booked Time OEE (inner arc)
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activityData.map((item) => (
            <ActivitySpeedometer
              key={item.activity}
              activity={item.activity}
              oee_247={item.oee_247}
              oee_booked={item.oee_booked}
              activityColor={item.activityColor}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};