import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WeeklyBreakdownLanding } from '@/components/analytics/WeeklyBreakdownLanding';
import { WeeklyBreakdown } from '@/components/analytics/WeeklyBreakdownNew';

export default function WeeklyBreakdownPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <WeeklyBreakdownLanding onViewDetailed={() => setActiveTab('detailed')} />
        </TabsContent>

        <TabsContent value="detailed">
          <WeeklyBreakdown />
        </TabsContent>
      </Tabs>
    </div>
  );
}