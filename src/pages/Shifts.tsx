import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShiftDataImport } from '@/components/import/ShiftDataImport';
import { OperatorSelection } from '@/components/OperatorSelection';

export default function Shifts() {
  const handleDataChange = () => {
    // Callback for when data is updated - components handle their own refresh
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Timesheet</h1>
        <p className="text-muted-foreground">Select your operator profile to access your individual timesheet</p>
      </div>

      <Tabs defaultValue="operators" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="operators">Operator Selection</TabsTrigger>
          <TabsTrigger value="import">Import Data</TabsTrigger>
        </TabsList>

        <TabsContent value="operators" className="space-y-6">
          <OperatorSelection />
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <ShiftDataImport onSuccess={handleDataChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}