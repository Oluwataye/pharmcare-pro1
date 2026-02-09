import React, { useState, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/types';

export interface ColumnDef<T = any> {
    key: string;
    header: string;
    cell?: (row: T) => React.ReactNode;
    sortable?: boolean;
    roleRestriction?: UserRole[]; // Roles that can see this column
}

interface ReportDataTableProps<T = any> {
    columns: ColumnDef<T>[];
    data: T[];
    totalRows?: number;
    pageSize?: number;
    currentPage?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    isLoading?: boolean;
    emptyMessage?: string;
    className?: string;
    title?: string;
}

const PAGE_SIZE_OPTIONS = [25, 50, 100];

/**
 * Standardized data table with pagination and sorting.
 * Supports both client-side and server-side pagination.
 * Now supports Role-Based Column Masking.
 */
export const ReportDataTable = <T extends Record<string, any>>({
    columns,
    data,
    totalRows,
    pageSize = 50,
    currentPage = 1,
    onPageChange,
    onPageSizeChange,
    isLoading = false,
    emptyMessage = 'No data available',
    className = '',
    title
}: ReportDataTableProps<T>) => {
    const { user } = useAuth();
    const [localPage, setLocalPage] = useState(currentPage);
    const [localPageSize, setLocalPageSize] = useState(pageSize);

    const effectivePage = onPageChange ? currentPage : localPage;
    const effectivePageSize = onPageSizeChange ? pageSize : localPageSize;

    // Filter columns based on role
    const visibleColumns = useMemo(() => {
        if (!user) return [];
        return columns.filter(col =>
            !col.roleRestriction || col.roleRestriction.includes(user.role)
        );
    }, [columns, user]);

    // Calculate pagination
    const total = totalRows || data.length;
    const totalPages = Math.ceil(total / effectivePageSize);
    const startRow = (effectivePage - 1) * effectivePageSize + 1;
    const endRow = Math.min(effectivePage * effectivePageSize, total);

    // Client-side pagination if no onPageChange provided
    const displayData = onPageChange
        ? data
        : (data || []).slice((effectivePage - 1) * effectivePageSize, effectivePage * effectivePageSize);

    const handlePageChange = (newPage: number) => {
        if (onPageChange) {
            onPageChange(newPage);
        } else {
            setLocalPage(newPage);
        }
    };

    const handlePageSizeChange = (newSize: string) => {
        const size = parseInt(newSize);
        if (onPageSizeChange) {
            onPageSizeChange(size);
        } else {
            setLocalPageSize(size);
            setLocalPage(1); // Reset to first page
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        );
    }

    if (data.length === 0 && !isLoading) {
        return (
            <div className="text-center py-10 text-muted-foreground border rounded-md bg-muted/20">
                {title && <h3 className="text-lg font-medium mb-2">{title}</h3>}
                <p>{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {title && <h3 className="text-lg font-semibold">{title}</h3>}
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {visibleColumns.map((column) => (
                                <TableHead key={column.key}>{column.header}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {displayData.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                                {visibleColumns.map((column) => (
                                    <TableCell key={column.key}>
                                        {column.cell ? column.cell(row) : row[column.key]}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {total > 0 && (
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm text-muted-foreground">
                            Showing {startRow} to {endRow} of {total} results
                        </p>
                    </div>

                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">Rows per page</p>
                            <Select
                                value={effectivePageSize.toString()}
                                onValueChange={handlePageSizeChange}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue placeholder={effectivePageSize} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {PAGE_SIZE_OPTIONS.map((size) => (
                                        <SelectItem key={size} value={size.toString()}>
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                            Page {effectivePage} of {totalPages}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex"
                                onClick={() => handlePageChange(1)}
                                disabled={effectivePage === 1}
                            >
                                <span className="sr-only">Go to first page</span>
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => handlePageChange(effectivePage - 1)}
                                disabled={effectivePage === 1}
                            >
                                <span className="sr-only">Go to previous page</span>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => handlePageChange(effectivePage + 1)}
                                disabled={effectivePage === totalPages}
                            >
                                <span className="sr-only">Go to next page</span>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex"
                                onClick={() => handlePageChange(totalPages)}
                                disabled={effectivePage === totalPages}
                            >
                                <span className="sr-only">Go to last page</span>
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
