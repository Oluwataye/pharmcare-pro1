
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Search, Wallet, Calendar, Filter, FileText } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { useDebounce } from "@/hooks/useDebounce";
import { AddExpenseDialog } from "../components/expenses/AddExpenseDialog";
import { DeleteExpenseDialog } from "../components/expenses/DeleteExpenseDialog";
import { EnhancedCard } from "@/components/ui/EnhancedCard";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
    "Staff Salaries",
    "Rent",
    "Logistics & Transportation",
    "Utility Bills",
    "Taxes & Levies",
    "Losses",
    "Damages",
    "Supplies",
    "Maintenance",
    "Other"
];

const Expenses = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [dateRange, setDateRange] = useState({
        start: "",
        end: ""
    });

    // Debounce search to prevent excessive queries
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Use React Query hook with filters - automatic caching and refetching
    const { expenses, isLoading, refetch } = useExpenses({
        category: selectedCategory === "all" ? undefined : selectedCategory,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
        searchTerm: debouncedSearchTerm || undefined
    });

    // Memoize total calculation to prevent recalculation on every render
    const totalInView = useMemo(() =>
        expenses.reduce((sum, e) => sum + Number(e.amount), 0),
        [expenses]
    );

    return (
        <div className="p-4 md:p-6 space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-2">
                        <Wallet className="h-8 w-8 text-primary" />
                        Expense Management
                    </h1>
                    <p className="text-muted-foreground">Track and manage operational costs and losses.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <AddExpenseDialog onExpenseAdded={() => refetch()} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses (Selected)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">₦{totalInView.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Based on current filters</p>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50/50 border-blue-200/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700">{expenses.length}</div>
                        <p className="text-xs text-muted-foreground">Expense entries found</p>
                    </CardContent>
                </Card>
                <Card className="bg-orange-50/50 border-orange-200/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Period</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-semibold truncate">
                            {dateRange.start || "All Time"} {dateRange.end ? ` - ${dateRange.end}` : ""}
                        </div>
                        <p className="text-xs text-muted-foreground">Filtered date range</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-lg border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search description or reference..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {CATEGORIES.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div className="flex items-center gap-1">
                            <Input
                                type="date"
                                className="h-8 w-36 text-xs"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            />
                            <span className="text-muted-foreground text-xs">to</span>
                            <Input
                                type="date"
                                className="h-8 w-36 text-xs"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            />
                        </div>
                    </div>
                    {(searchTerm || selectedCategory !== 'all' || dateRange.start || dateRange.end) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSearchTerm("");
                                setSelectedCategory("all");
                                setDateRange({ start: "", end: "" });
                            }}
                            className="text-xs h-8"
                        >
                            Reset
                        </Button>
                    )}
                </div>
            </div>

            <EnhancedCard colorScheme="primary">
                <CardHeader className="p-4 md:p-6 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Expenses Log
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <Spinner size="lg" />
                            <p className="text-muted-foreground animate-pulse">Loading expense records...</p>
                        </div>
                    ) : (
                        <div className="responsive-table">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="font-bold">Date</TableHead>
                                        <TableHead className="font-bold">Category</TableHead>
                                        <TableHead className="font-bold">Description</TableHead>
                                        <TableHead className="font-bold">Reference</TableHead>
                                        <TableHead className="font-bold text-right">Amount (₦)</TableHead>
                                        <TableHead className="text-right font-bold w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenses.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-16">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <div className="p-4 bg-muted rounded-full">
                                                        <Wallet className="h-8 w-8 text-muted-foreground/50" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-lg font-semibold text-foreground">No expenses found</p>
                                                        <p className="text-muted-foreground max-w-[300px] mx-auto">
                                                            {searchTerm || selectedCategory !== 'all'
                                                                ? "No records match your filters. Try adjusting your search."
                                                                : "Start by recording your first operational expense using the button above."}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        expenses.map((expense) => (
                                            <TableRow key={expense.id} className="hover:bg-muted/30 transition-colors group">
                                                <TableCell className="font-medium">
                                                    {new Date(expense.date).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                                        {expense.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate" title={expense.description || ""}>
                                                    {expense.description || "-"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm font-mono">
                                                    {expense.reference || "-"}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-foreground">
                                                    ₦{Number(expense.amount).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="flex justify-end gap-1">
                                                        <DeleteExpenseDialog expense={expense} onExpenseDeleted={() => refetch()} />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}

                                    {/* Summary Row */}
                                    {expenses.length > 0 && (
                                        <TableRow className="bg-muted font-bold border-t-2 border-primary/20 sticky bottom-0 z-10 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
                                            <TableCell colSpan={4} className="text-right uppercase tracking-wider text-xs">
                                                Total for Period
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-lg text-primary">
                                                ₦{totalInView.toLocaleString()}
                                            </TableCell>
                                            <TableCell />
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </EnhancedCard>
        </div>
    );
};

export default Expenses;
