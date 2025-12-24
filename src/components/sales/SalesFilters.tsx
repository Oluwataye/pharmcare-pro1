import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

interface SalesFiltersProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  dateFrom?: Date;
  dateTo?: Date;
  onDateFromChange: (date?: Date) => void;
  onDateToChange: (date?: Date) => void;
  filterStatus: string;
  onFilterStatusChange: (status: string) => void;
  onClear: () => void;
}

type QuickFilter = "today" | "week" | "month" | "custom";

const SalesFilters = ({
  searchTerm,
  onSearchTermChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  filterStatus,
  onFilterStatusChange,
  onClear,
}: SalesFiltersProps) => {
  const getActiveQuickFilter = (): QuickFilter => {
    if (!dateFrom || !dateTo) return "custom";
    
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    if (dateFrom.getTime() === todayStart.getTime() && dateTo.getTime() === todayEnd.getTime()) {
      return "today";
    }
    if (dateFrom.getTime() === weekStart.getTime() && dateTo.getTime() === weekEnd.getTime()) {
      return "week";
    }
    if (dateFrom.getTime() === monthStart.getTime() && dateTo.getTime() === monthEnd.getTime()) {
      return "month";
    }
    return "custom";
  };

  const handleQuickFilter = (filter: QuickFilter) => {
    const today = new Date();
    
    switch (filter) {
      case "today":
        onDateFromChange(startOfDay(today));
        onDateToChange(endOfDay(today));
        break;
      case "week":
        onDateFromChange(startOfWeek(today, { weekStartsOn: 1 }));
        onDateToChange(endOfWeek(today, { weekStartsOn: 1 }));
        break;
      case "month":
        onDateFromChange(startOfMonth(today));
        onDateToChange(endOfMonth(today));
        break;
      case "custom":
        onDateFromChange(undefined);
        onDateToChange(undefined);
        break;
    }
  };

  const activeFilter = getActiveQuickFilter();

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search sales..." 
            className="pl-8" 
            value={searchTerm}
            onChange={e => onSearchTermChange(e.target.value)}
          />
        </div>
      </div>

      {/* Quick date filters */}
      <div className="flex flex-wrap gap-2 mt-4">
        <Button
          variant={activeFilter === "today" ? "default" : "outline"}
          size="sm"
          onClick={() => handleQuickFilter("today")}
        >
          Today
        </Button>
        <Button
          variant={activeFilter === "week" ? "default" : "outline"}
          size="sm"
          onClick={() => handleQuickFilter("week")}
        >
          This Week
        </Button>
        <Button
          variant={activeFilter === "month" ? "default" : "outline"}
          size="sm"
          onClick={() => handleQuickFilter("month")}
        >
          This Month
        </Button>
        <Button
          variant={activeFilter === "custom" && (dateFrom || dateTo) ? "secondary" : "ghost"}
          size="sm"
          onClick={() => handleQuickFilter("custom")}
        >
          Custom Range
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end mt-4">
        <div className="space-y-2">
          <p className="text-sm">Date From</p>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[200px] justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={dateFrom}
                onSelect={onDateFromChange}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <p className="text-sm">Date To</p>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[200px] justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={dateTo}
                onSelect={onDateToChange}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <p className="text-sm">Status</p>
          <Select value={filterStatus} onValueChange={onFilterStatusChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" onClick={onClear}>
          Clear Filters
        </Button>
      </div>
    </div>
  );
};

export default SalesFilters;
