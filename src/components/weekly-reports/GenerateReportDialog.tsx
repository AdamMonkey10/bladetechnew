import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useReportGroups } from '@/hooks/useWeeklyReports';
import { Loader2, Calendar } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';
import { format } from 'date-fns';

interface GenerateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (params: { weekStartDate?: string; recipientGroupIds?: string[] }) => void;
  isGenerating: boolean;
}

export function GenerateReportDialog({ 
  open, 
  onOpenChange, 
  onGenerate, 
  isGenerating 
}: GenerateReportDialogProps) {
  const [weekStartDate, setWeekStartDate] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  
  const { data: groups } = useReportGroups();

  useEffect(() => {
    if (open) {
      // Set default to last Monday
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() - daysToSubtract - 7);
      
      setWeekStartDate(format(lastMonday, 'yyyy-MM-dd'));
      setSelectedGroups(groups?.map(g => g.id) || []);
    }
  }, [open, groups]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      weekStartDate: weekStartDate || undefined,
      recipientGroupIds: selectedGroups.length > 0 ? selectedGroups : undefined,
    });
  };

  const handleGroupChange = (groupId: string, checked: boolean) => {
    setSelectedGroups(prev => 
      checked 
        ? [...prev, groupId]
        : prev.filter(id => id !== groupId)
    );
  };

  const getWeekEndDate = (startDate: string) => {
    if (!startDate) return '';
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return formatDate(end, 'dd/MM/yyyy');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Generate Weekly Report
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weekStart">Week Start Date (Monday)</Label>
            <Input
              id="weekStart"
              type="date"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
              required
            />
            {weekStartDate && (
              <p className="text-sm text-muted-foreground">
                Week: {formatDate(new Date(weekStartDate), 'dd/MM')} - {getWeekEndDate(weekStartDate)}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Send to Groups</Label>
            <div className="space-y-2">
              {groups?.map((group) => (
                <div key={group.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={group.id}
                    checked={selectedGroups.includes(group.id)}
                    onCheckedChange={(checked) => handleGroupChange(group.id, !!checked)}
                  />
                  <Label htmlFor={group.id} className="text-sm font-normal">
                    {group.name}
                    {group.description && (
                      <span className="text-muted-foreground ml-1">
                        - {group.description}
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
            {selectedGroups.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Select at least one group to send the report to recipients.
              </p>
            )}
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-foreground mb-2">What will be included:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Production metrics and week-over-week comparison</li>
              <li>• Quality control summary and defect rates</li>
              <li>• Purchase order progress and completion rates</li>
              <li>• Critical alerts for overdue items</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isGenerating}>
              {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate & Send Report
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}