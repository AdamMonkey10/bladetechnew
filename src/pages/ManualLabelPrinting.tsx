import { ManualLabelPrint } from '@/components/ManualLabelPrint';
export default function ManualLabelPrinting() {
  return <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Manual Label Printing</h1>
        <p className="text-muted-foreground">Quick manual label printing</p>
      </div>
      
      <ManualLabelPrint />
    </div>;
}