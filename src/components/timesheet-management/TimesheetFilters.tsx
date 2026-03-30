import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Filter, X, Calendar as CalendarDays } from "lucide-react";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { cn } from "@/lib/utils";

interface TimesheetFiltersProps {
  onFiltersChange: (filters: {
    dateFrom?: Date;
    dateTo?: Date;
    operatorFilter: string;
    statusFilter: string;
    escalationFilter: string;
  }) => void;
}

export function TimesheetFilters({ onFiltersChange }: TimesheetFiltersProps) {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [operatorFilter, setOperatorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [escalationFilter, setEscalationFilter] = useState("all");

  // Notify parent when filters change
  const updateFilters = () => {
    onFiltersChange({
      dateFrom,
      dateTo,
      operatorFilter,
      statusFilter,
      escalationFilter
    });
  };

  // Call updateFilters on initial load
  React.useEffect(() => {
    updateFilters();
  }, []);

  const clearFilters = () => {
    const newValues = {
      dateFrom: undefined,
      dateTo: undefined,
      operatorFilter: "",
      statusFilter: "all",
      escalationFilter: "all"
    };
    
    setDateFrom(newValues.dateFrom);
    setDateTo(newValues.dateTo);
    setOperatorFilter(newValues.operatorFilter);
    setStatusFilter(newValues.statusFilter);
    setEscalationFilter(newValues.escalationFilter);
    
    onFiltersChange(newValues);
  };

  const setThisWeek = () => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
    const end = endOfWeek(now, { weekStartsOn: 1 }); // Sunday end
    setDateFrom(start);
    setDateTo(end);
    onFiltersChange({
      dateFrom: start,
      dateTo: end,
      operatorFilter,
      statusFilter,
      escalationFilter
    });
  };

  const setLastWeek = () => {
    const now = new Date();
    const lastWeek = subWeeks(now, 1);
    const start = startOfWeek(lastWeek, { weekStartsOn: 1 });
    const end = endOfWeek(lastWeek, { weekStartsOn: 1 });
    setDateFrom(start);
    setDateTo(end);
    onFiltersChange({
      dateFrom: start,
      dateTo: end,
      operatorFilter,
      statusFilter,
      escalationFilter
    });
  };

  const hasActiveFilters = dateFrom || dateTo || operatorFilter || (statusFilter !== "all") || (escalationFilter !== "all");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Advanced Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={setThisWeek}
            className="flex items-center gap-2"
          >
            <CalendarDays className="h-4 w-4" />
            This Week
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={setLastWeek}
            className="flex items-center gap-2"
          >
            <CalendarDays className="h-4 w-4" />
            Last Week
          </Button>
          {(dateFrom || dateTo) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>•</span>
              <span>
                {dateFrom && dateTo ? 
                  `${format(dateFrom, "MMM d")} - ${format(dateTo, "MMM d, yyyy")}` :
                  dateFrom ? `From ${format(dateFrom, "MMM d, yyyy")}` :
                  dateTo ? `Until ${format(dateTo, "MMM d, yyyy")}` : ""
                }
              </span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Date Range */}
          <div className="space-y-2">
            <Label>From Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={(date) => {
                    setDateFrom(date);
                    onFiltersChange({
                      dateFrom: date,
                      dateTo,
                      operatorFilter,
                      statusFilter,
                      escalationFilter
                    });
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>To Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={(date) => {
                    setDateTo(date);
                    onFiltersChange({
                      dateFrom,
                      dateTo: date,
                      operatorFilter,
                      statusFilter,
                      escalationFilter
                    });
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Operator Search */}
          <div className="space-y-2">
            <Label>Operator</Label>
            <Input
              placeholder="Search operator..."
              value={operatorFilter}
              onChange={(e) => {
                const value = e.target.value;
                setOperatorFilter(value);
                onFiltersChange({
                  dateFrom,
                  dateTo,
                  operatorFilter: value,
                  statusFilter,
                  escalationFilter
                });
              }}
            />
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              onFiltersChange({
                dateFrom,
                dateTo,
                operatorFilter,
                statusFilter: value,
                escalationFilter
              });
            }}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="missing">Missing</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Escalation Filter */}
          <div className="space-y-2">
            <Label>Escalation</Label>
            <Select value={escalationFilter} onValueChange={(value) => {
              setEscalationFilter(value);
              onFiltersChange({
                dateFrom,
                dateTo,
                operatorFilter,
                statusFilter,
                escalationFilter: value
              });
            }}>
              <SelectTrigger>
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}