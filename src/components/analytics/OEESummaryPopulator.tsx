import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Database, Play, CheckCircle } from 'lucide-react';
import { useOEESettings } from '@/hooks/useOEESettings';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OEESummaryPopulatorProps {
  className?: string;
}

export const OEESummaryPopulator: React.FC<OEESummaryPopulatorProps> = ({ className }) => {
  const [isPopulating, setIsPopulating] = useState(false);
  const [summaryCount, setSummaryCount] = useState<number | null>(null);
  const { targetRates } = useOEESettings();
  const { toast } = useToast();

  const checkSummaryCount = async () => {
    const { data, error } = await supabase
      .from('oee_daily_summary')
      .select('*', { count: 'exact', head: true });
    
    if (!error && data !== null) {
      setSummaryCount(data.length);
    }
  };

  const populateRecentSummaries = async () => {
    setIsPopulating(true);
    try {
      // Get recent dates with shift data
      const { data: shiftDates, error: shiftError } = await supabase
        .from('shift_records')
        .select('shift_date')
        .gte('shift_date', '2025-07-01')
        .order('shift_date', { ascending: false });

      if (shiftError) throw shiftError;

      const uniqueDates = [...new Set(shiftDates?.map(d => d.shift_date) || [])];
      
      // For each date, calculate OEE summary using simplified approach
      for (const date of uniqueDates.slice(0, 30)) { // Process last 30 days
        const { data: shiftData, error: dataError } = await supabase
          .from('shift_records')
          .select('production_data')
          .eq('shift_date', date)
          .not('production_data', 'is', null);

        if (dataError) continue;

        // Process the shift data to calculate daily totals
        const dailyTotals = shiftData?.reduce((acc, record) => {
          const prodData = record.production_data as any;
          if (!prodData?.activities) return acc;

          prodData.activities.forEach((activity: any) => {
            const activityName = activity.name;
            if (!acc[activityName]) {
              acc[activityName] = { units: 0, time: 0, scrap: 0, booked_hours: 0 };
            }

            activity.entries?.forEach((entry: any) => {
              if (entry.units_produced) {
                acc[activityName].units += parseInt(entry.units_produced) || 0;
                acc[activityName].time += parseFloat(entry.time_spent) || 0;
                acc[activityName].scrap += parseInt(entry.scrap) || 0;
              }
            });

            acc[activityName].booked_hours += parseFloat(prodData.hours_booked) || 0;
          });

          return acc;
        }, {} as Record<string, any>);

        // Insert summaries for each activity
        for (const [activityType, totals] of Object.entries(dailyTotals || {})) {
          const targetRate = targetRates[activityType as keyof typeof targetRates] || 200;
          const quality = totals.units > 0 ? ((totals.units - totals.scrap) / totals.units) * 100 : 100;
          const availability247 = Math.min(100, (totals.booked_hours / 24) * 100);
          const performance247 = totals.units > 0 && targetRate > 0 ? Math.min(200, (totals.units / (targetRate * 24)) * 100) : 0;
          const oee247 = (availability247 * performance247 * quality) / 10000;
          
          const performanceBooked = totals.time > 0 && targetRate > 0 ? Math.min(200, (totals.units / (targetRate * totals.time)) * 100) : 0;
          const oeeBooked = (100 * performanceBooked * quality) / 10000;

          await supabase
            .from('oee_daily_summary')
            .upsert({
              summary_date: date,
              machine_name: activityType,
              total_pieces: totals.units,
              good_pieces: totals.units - totals.scrap,
              defect_pieces: totals.scrap,
              availability: Math.max(0, Math.min(100, availability247)),
              performance: Math.max(0, Math.min(200, performance247)),
              quality: Math.max(0, Math.min(100, quality)),
              oee: Math.max(0, Math.min(100, oee247)),
            } as any);
        }
      }

      await checkSummaryCount();
      toast({
        title: "OEE Summaries Populated",
        description: `Successfully populated OEE daily summaries for ${uniqueDates.length} days`,
      });
    } catch (error) {
      console.error('Error populating summaries:', error);
      toast({
        title: "Error",
        description: "Failed to populate OEE summaries",
        variant: "destructive",
      });
    } finally {
      setIsPopulating(false);
    }
  };

  React.useEffect(() => {
    checkSummaryCount();
  }, []);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              OEE Summary Data
            </CardTitle>
            <CardDescription>
              Populate pre-calculated OEE summaries for faster performance
            </CardDescription>
          </div>
          <Badge variant={summaryCount === 0 ? 'destructive' : 'default'}>
            {summaryCount ?? '?'} records
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {summaryCount === 0 && (
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              No OEE daily summaries found. Populating these will significantly improve chart performance.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground">
          OEE daily summaries allow for faster time series calculations. This will process recent shift data and create optimized summary records.
        </div>

        <Button
          onClick={populateRecentSummaries}
          disabled={isPopulating}
          className="w-full"
        >
          {isPopulating ? (
            <>
              <Database className="h-4 w-4 mr-2 animate-spin" />
              Populating Summaries...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Populate Recent Summaries
            </>
          )}
        </Button>

        {summaryCount !== null && summaryCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            OEE summaries are available for time series charts
          </div>
        )}
      </CardContent>
    </Card>
  );
};