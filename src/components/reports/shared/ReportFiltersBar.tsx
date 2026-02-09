import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar as CalendarIcon, ChevronDown, Filter, RotateCcw, Search } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ReportFilters } from '@/hooks/reports/useReportFilters';

interface ReportFiltersBarProps {
    reportId: string;
    filters: ReportFilters;
    onFiltersChange: (filters: ReportFilters) => void;
    availableFilters?: {
        dateRange?: boolean;
        branch?: boolean;
        staff?: boolean;
        paymentMode?: boolean;
        search?: boolean;
        custom?: React.ReactNode;
    };
    branches?: Array<{ id: string; name: string }>;
    staff?: Array<{ id: string; name: string }>;
    collapsible?: boolean;
    className?: string;
}

const DATE_PRESETS = [
    { label: 'Today', getValue: () => ({ start: new Date(), end: new Date() }) },
    { label: 'Last 7 days', getValue: () => ({ start: subDays(new Date(), 7), end: new Date() }) },
    { label: 'Last 30 days', getValue: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
    { label: 'Last 90 days', getValue: () => ({ start: subDays(new Date(), 90), end: new Date() }) },
    { label: 'This month', getValue: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
];

const PAYMENT_MODES = [
    { value: 'all', label: 'All Payment Modes' },
    { value: 'cash', label: 'Cash' },
    { value: 'pos', label: 'POS' },
    { value: 'transfer', label: 'Bank Transfer' },
];

/**
 * Unified filter bar for all reports.
 * Provides standardized filtering interface with persistence.
 */
export const ReportFiltersBar: React.FC<ReportFiltersBarProps> = ({
    reportId,
    filters,
    onFiltersChange,
    availableFilters = {},
    branches = [],
    staff = [],
    collapsible = false,
    className = ''
}) => {
    const [isExpanded, setIsExpanded] = useState(!collapsible);
    const [startDate, setStartDate] = useState<Date | undefined>(
        filters.startDate ? new Date(filters.startDate) : undefined
    );
    const [endDate, setEndDate] = useState<Date | undefined>(
        filters.endDate ? new Date(filters.endDate) : undefined
    );

    const handleDatePreset = (preset: typeof DATE_PRESETS[0]) => {
        const { start, end } = preset.getValue();
        setStartDate(start);
        setEndDate(end);
        onFiltersChange({
            ...filters,
            startDate: start.toISOString(),
            endDate: end.toISOString()
        });
    };

    const handleStartDateChange = (date: Date | undefined) => {
        setStartDate(date);
        if (date) {
            onFiltersChange({ ...filters, startDate: date.toISOString() });
        }
    };

    const handleEndDateChange = (date: Date | undefined) => {
        setEndDate(date);
        if (date) {
            onFiltersChange({ ...filters, endDate: date.toISOString() });
        }
    };

    const handleBranchChange = (branchId: string) => {
        onFiltersChange({
            ...filters,
            branchIds: branchId === 'all' ? ['all'] : [branchId]
        });
    };

    const handlePaymentModeChange = (mode: string) => {
        onFiltersChange({
            ...filters,
            paymentModes: mode === 'all' ? [] : [mode]
        });
    };

    const handleSearchChange = (query: string) => {
        onFiltersChange({ ...filters, searchQuery: query });
    };

    const handleReset = () => {
        setStartDate(undefined);
        setEndDate(undefined);
        onFiltersChange({
            startDate: undefined,
            endDate: undefined,
            branchIds: ['all'],
            staffIds: [],
            paymentModes: [],
            searchQuery: ''
        });
    };

    const filterContent = (
        <Card className={cn('border-primary/20', className)}>
            <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Date Range Filter */}
                    {availableFilters.dateRange && (
                        <>
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                'w-full justify-start text-left font-normal',
                                                !startDate && 'text-muted-foreground'
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={startDate}
                                            onSelect={handleStartDateChange}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                'w-full justify-start text-left font-normal',
                                                !endDate && 'text-muted-foreground'
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={endDate}
                                            onSelect={handleEndDateChange}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label>Quick Presets</Label>
                                <div className="flex flex-wrap gap-2">
                                    {DATE_PRESETS.map((preset) => (
                                        <Button
                                            key={preset.label}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDatePreset(preset)}
                                        >
                                            {preset.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Branch Filter */}
                    {availableFilters.branch && branches.length > 0 && (
                        <div className="space-y-2">
                            <Label>Branch</Label>
                            <Select
                                value={filters.branchIds?.[0] || 'all'}
                                onValueChange={handleBranchChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Branches</SelectItem>
                                    {branches.map((branch) => (
                                        <SelectItem key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Payment Mode Filter */}
                    {availableFilters.paymentMode && (
                        <div className="space-y-2">
                            <Label>Payment Mode</Label>
                            <Select
                                value={filters.paymentModes?.[0] || 'all'}
                                onValueChange={handlePaymentModeChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_MODES.map((mode) => (
                                        <SelectItem key={mode.value} value={mode.value}>
                                            {mode.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Search Filter */}
                    {availableFilters.search && (
                        <div className="space-y-2">
                            <Label>Search</Label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    value={filters.searchQuery || ''}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                    )}

                    {/* Custom Filters */}
                    {availableFilters.custom && (
                        <div className="md:col-span-2 lg:col-span-4">
                            {availableFilters.custom}
                        </div>
                    )}
                </div>

                {/* Reset Button */}
                <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm" onClick={handleReset}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset Filters
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    if (collapsible) {
        return (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full mb-4">
                        <Filter className="mr-2 h-4 w-4" />
                        {isExpanded ? 'Hide' : 'Show'} Filters
                        <ChevronDown className={cn('ml-2 h-4 w-4 transition-transform', isExpanded && 'rotate-180')} />
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    {filterContent}
                </CollapsibleContent>
            </Collapsible>
        );
    }

    return filterContent;
};
