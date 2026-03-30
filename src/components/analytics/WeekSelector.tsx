import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface WeekSelectorProps {
  selectedWeek: Date;
  onWeekChange: (date: Date, singleDay?: boolean) => void;
}

export function WeekSelector({ selectedWeek, onWeekChange }: WeekSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });

  const handlePreviousWeek = () => {
    onWeekChange(subWeeks(selectedWeek, 1));
  };

  const handleNextWeek = () => {
    onWeekChange(addWeeks(selectedWeek, 1));
  };

  const handleThisWeek = () => {
    onWeekChange(new Date());
  };

  const handleLastWeek = () => {
    onWeekChange(subWeeks(new Date(), 1));
  };

  const handleYesterday = () => {
    onWeekChange(subDays(new Date(), 1), true);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !selectedWeek && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedWeek}
            onSelect={(date) => {
              if (date) {
                onWeekChange(date);
                setIsOpen(false);
              }
            }}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePreviousWeek}
          title="Previous Week"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNextWeek}
          title="Next Week"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleYesterday}
        >
          Yesterday
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleThisWeek}
        >
          This Week
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleLastWeek}
        >
          Last Week
        </Button>
      </div>
    </div>
  );
}
