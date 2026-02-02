
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, Legend, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useBudgets } from "@/hooks/useBudgets";
import { Target, AlertCircle, CheckCircle2, TrendingUp, TrendingDown, FileDown } from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/exportUtils";

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];

const BudgetVsActual = () => {
    const [loading, setLoading] = useState(true);
    const [selectedBranch, setSelectedBranch] = useState<string>('all');
    const [branches, setBranches] = useState<any[]>([]);
    const [date, setDate] = useState(new Date());

    const { budgets, fetchBudgets, isLoading: budgetsLoading } = useBudgets();
    const [actuals, setActuals] = useState<Record<string, number>>({});

    useEffect(() => {
        const fetchBranches = async () => {
            const { data } = await supabase.from('branches' as any).select('*');
            if (data) setBranches(data);
        };
        fetchBranches();
    }, []);

    useEffect(() => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        fetchBudgets(year, month, selectedBranch === 'all' ? undefined : selectedBranch);
        fetchActuals();
    }, [date, selectedBranch]);

    const fetchActuals = async () => {
        try {
            setLoading(true);
            const start = format(startOfMonth(date), 'yyyy-MM-dd');
            const end = format(endOfMonth(date), 'yyyy-MM-dd');

            // Fetch Sales for Revenue
            let salesQuery = supabase
                .from('sales' as any)
                .select('total')
                .gte('date', start)
                .lte('date', end);

            if (selectedBranch !== 'all') {
                salesQuery = salesQuery.eq('branch_id', selectedBranch);
            }

            const { data: sales } = await salesQuery;
            const totalRevenue = (sales || []).reduce((acc, s) => acc + Number(s.total), 0);

            // Fetch Expenses
            let expensesQuery = supabase
                .from('expenses' as any)
                .select('amount, category')
                .gte('date', start)
                .lte('date', end);

            if (selectedBranch !== 'all') {
                expensesQuery = expensesQuery.eq('branch_id', selectedBranch);
            }

            const { data: expenses } = await expensesQuery;
            const expenseMap: Record<string, number> = {};
            (expenses || []).forEach(e => {
                expenseMap[e.category] = (expenseMap[e.category] || 0) + Number(e.amount);
            });

            setActuals({
                'Revenue': totalRevenue,
                ...expenseMap
            });
        } catch (error) {
            console.error("Error fetching actuals:", error);
        } finally {
            setLoading(false);
        }
    };

    const comparisonData = budgets.map(b => {
        const actual = actuals[b.category] || 0;
        const variance = actual - b.amount;
        const variancePercent = b.amount > 0 ? (variance / b.amount) * 100 : 0;

        return {
            category: b.category,
            budget: b.amount,
            actual: actual,
            variance,
            variancePercent,
            status: b.category === 'Revenue'
                ? (actual >= b.amount ? 'on-track' : 'below-target')
                : (actual <= b.amount ? 'on-track' : 'over-budget')
        };
    });

    const handleExportBudget = () => {
        const exportData = comparisonData.map(item => ({
            Category: item.category,
            'Budgeted Amount': item.budget,
            'Actual Amount': item.actual,
            Variance: item.variance,
            'Variance %': `${item.variancePercent.toFixed(1)}%`,
            Status: item.status.toUpperCase()
        }));

        exportToCSV(exportData, `Budget_Report_${selectedBranch}_${format(date, 'MMM_yyyy')}`);
    };

    if (loading || budgetsLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Spinner size="lg" />
                <p className="text-muted-foreground animate-pulse">Comparing performance to budget...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30 p-4 rounded-lg border">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Budget vs. Actual Analysis
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Monitoring financial discipline for {format(date, 'MMMM yyyy')}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="text-xs bg-background border rounded px-2 py-1 min-w-[150px]"
                    >
                        <option value="all">All Branches (Consolidated)</option>
                        {branches.map(branch => (
                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                        ))}
                    </select>
                    <input
                        type="month"
                        value={format(date, 'yyyy-MM')}
                        onChange={(e) => setDate(new Date(e.target.value))}
                        className="text-xs bg-background border rounded px-2 py-1"
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 gap-2 bg-primary/10 text-primary hover:bg-primary/20"
                        onClick={handleExportBudget}
                    >
                        <FileDown className="h-3.5 w-3.5" />
                        Export
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Budget Alignment</CardTitle>
                        <CardDescription>Visual comparison of targets vs. results</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonData.slice(0, 5)} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" tickFormatter={(val) => `₦${(val / 1000).toFixed(0)}k`} />
                                    <YAxis dataKey="category" type="category" width={100} />
                                    <Tooltip formatter={(val: number) => `₦${val.toLocaleString()}`} />
                                    <Legend />
                                    <Bar dataKey="budget" name="Budget" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="actual" name="Actual" radius={[0, 4, 4, 0]}>
                                        {comparisonData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.status === 'on-track' ? '#10b981' : '#ef4444'}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Performance Insights</CardTitle>
                        <CardDescription>Critical budget variances</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {comparisonData.length > 0 ? comparisonData.map(item => (
                                <div key={item.category} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <span className="text-sm font-medium">{item.category}</span>
                                            <div className="flex items-center gap-2">
                                                {item.status === 'on-track' ? (
                                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                                ) : (
                                                    <AlertCircle className="h-3 w-3 text-red-500" />
                                                )}
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                                    {item.status === 'on-track' ? 'Within Budget' : 'Attention Required'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold">
                                                {item.variancePercent > 0 ? '+' : ''}{item.variancePercent.toFixed(1)}%
                                            </div>
                                            <div className="text-[10px] text-muted-foreground uppercase">Variance</div>
                                        </div>
                                    </div>
                                    <Progress
                                        value={Math.min((item.actual / (item.budget || 1)) * 100, 100)}
                                        className={`h-1.5 ${item.status === 'on-track' ? '[&>div]:bg-green-500' : '[&>div]:bg-red-500'}`}
                                    />
                                </div>
                            )) : (
                                <div className="text-center py-10 text-muted-foreground italic text-sm">
                                    No budgets set for this period.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-md">Budget Performance Table</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Budget (₦)</TableHead>
                                <TableHead className="text-right">Actual (₦)</TableHead>
                                <TableHead className="text-right">Variance (₦)</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {comparisonData.map((item) => (
                                <TableRow key={item.category}>
                                    <TableCell className="font-medium">{item.category}</TableCell>
                                    <TableCell className="text-right">{item.budget.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{item.actual.toLocaleString()}</TableCell>
                                    <TableCell className={`text-right ${item.variance < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {item.variance > 0 ? '+' : ''}{item.variance.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={item.status === 'on-track' ? 'success' : 'destructive'} className="text-[10px]">
                                            {item.status.replace('-', ' ').toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {comparisonData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">
                                        No budget data available for the selected criteria.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default BudgetVsActual;
