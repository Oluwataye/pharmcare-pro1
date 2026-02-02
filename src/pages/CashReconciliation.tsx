
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
    Download,
    Filter,
    Search,
    TrendingDown,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Calendar,
    User,
    Clock
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";

const CashReconciliation = () => {
    const [shifts, setShifts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateRange, setDateRange] = useState("7");
    const { toast } = useToast();

    useEffect(() => {
        fetchReconciliationData();
    }, [dateRange, statusFilter]);

    const fetchReconciliationData = async () => {
        try {
            setLoading(true);
            const startDate = startOfDay(subDays(new Date(), parseInt(dateRange))).toISOString();

            let query = supabase
                .from('staff_shifts' as any)
                .select('*')
                .gte('created_at', startDate)
                .order('created_at', { ascending: false });

            if (statusFilter !== "all") {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setShifts(data || []);
        } catch (error: any) {
            console.error("Error fetching reconciliation data:", error);
            toast({
                title: "Error",
                description: "Failed to load reconciliation records.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredShifts = shifts.filter(s =>
        s.staff_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.notes && s.notes.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const totalVariance = filteredShifts.reduce((acc, s) => {
        const variance = (s.actual_cash_counted || 0) - (s.expected_cash_total || 0);
        return acc + variance;
    }, 0);

    const shiftsWithVariance = filteredShifts.filter(s =>
        Math.abs((s.actual_cash_counted || 0) - (s.expected_cash_total || 0)) > 0
    ).length;

    return (
        <div className="p-4 md:p-6 space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                        Cash Reconciliation
                    </h1>
                    <p className="text-muted-foreground">Audit financial performance and shift variances</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="flex items-center gap-2">
                        <Download className="h-4 w-4" /> Export CSV
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    title="Net Variance"
                    value={`₦${totalVariance.toLocaleString()}`}
                    icon={totalVariance >= 0 ? <TrendingUp className="h-5 w-5 text-emerald-600" /> : <TrendingDown className="h-5 w-5 text-rose-600" />}
                    subValue="Total over/shortage for period"
                    colorScheme={totalVariance >= 0 ? "success" : "destructive"}
                />
                <MetricCard
                    title="Reconciled Shifts"
                    value={filteredShifts.filter(s => s.status === 'closed').length.toString()}
                    icon={<CheckCircle2 className="h-5 w-5 text-blue-600" />}
                    subValue={`${shiftsWithVariance} shifts with variances detected`}
                    colorScheme="primary"
                />
                <MetricCard
                    title="Audit Alerts"
                    value={filteredShifts.filter(s => Math.abs((s.actual_cash_counted || 0) - (s.expected_cash_total || 0)) > 1000).length.toString()}
                    icon={<AlertCircle className="h-5 w-5 text-amber-600" />}
                    subValue="Significant variances (> ₦1,000)"
                    colorScheme="warning"
                />
            </div>

            <Card className="shadow-sm border-primary/10">
                <CardHeader className="pb-3 border-b bg-muted/20">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Audit Log
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search staff or notes..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={dateRange} onValueChange={setDateRange}>
                                <SelectTrigger className="w-[140px]">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Date Range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Last 24 Hours</SelectItem>
                                    <SelectItem value="7">Last 7 Days</SelectItem>
                                    <SelectItem value="30">Last 30 Days</SelectItem>
                                    <SelectItem value="90">Last 3 Months</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center items-center h-64 p-8">
                            <Spinner size="lg" />
                        </div>
                    ) : filteredShifts.length === 0 ? (
                        <div className="text-center py-20 bg-muted/5">
                            <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-4 opacity-20" />
                            <p className="text-muted-foreground font-medium">No shift records found for the selected criteria.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/5">
                                    <TableHead className="w-[180px]">Shift / Date</TableHead>
                                    <TableHead>Staff Member</TableHead>
                                    <TableHead className="text-right">Expected Cash</TableHead>
                                    <TableHead className="text-right">Actual Counted</TableHead>
                                    <TableHead className="text-right">Variance</TableHead>
                                    <TableHead>System Totals (POS/TR)</TableHead>
                                    <TableHead className="w-[80px]">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredShifts.map((shift) => {
                                    const variance = (shift.actual_cash_counted || 0) - (shift.expected_cash_total || 0);
                                    const isSignificant = Math.abs(variance) > 1000;

                                    return (
                                        <TableRow key={shift.id} className="hover:bg-muted/5 transition-colors group">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm">{shift.shift_type}</span>
                                                    <span className="text-[10px] text-muted-foreground">{format(new Date(shift.created_at), 'dd MMM yyyy, HH:mm')}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                        {shift.staff_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">{shift.staff_name}</span>
                                                        <span className="text-[10px] text-muted-foreground">{shift.staff_email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm uppercase">
                                                ₦{(shift.expected_cash_total || 0).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm uppercase font-bold">
                                                ₦{(shift.actual_cash_counted || 0).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge
                                                    variant={variance === 0 ? "outline" : variance > 0 ? "secondary" : "destructive"}
                                                    className={`font-mono text-xs ${variance > 0 ? "bg-blue-50 text-blue-700 border-blue-200" : ""}`}
                                                >
                                                    {variance >= 0 ? "+" : ""}
                                                    ₦{variance.toLocaleString()}
                                                </Badge>
                                                {isSignificant && (
                                                    <div className="flex items-center justify-end text-[9px] text-red-600 mt-1 font-bold animate-pulse">
                                                        <AlertCircle className="h-2 w-2 mr-1" />
                                                        AUDIT ALERT
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center justify-between text-[10px]">
                                                        <span className="text-muted-foreground uppercase">POS:</span>
                                                        <span className="font-bold">₦{(shift.expected_pos_total || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[10px]">
                                                        <span className="text-muted-foreground uppercase">Transfer:</span>
                                                        <span className="font-bold">₦{(shift.expected_transfer_total || 0).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={shift.status === 'closed' ? "default" : "outline"} className="capitalize h-5 px-2 text-[10px]">
                                                    {shift.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {filteredShifts.some(s => s.notes) && (
                <Card className="border-amber-200 bg-amber-50/10 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                            <Clock className="h-4 w-4" />
                            Recent Reconciliation Notes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredShifts.filter(s => s.notes).slice(0, 3).map(s => (
                                <div key={s.id} className="bg-white p-3 rounded border border-amber-100 shadow-xs flex flex-col gap-2">
                                    <div className="flex justify-between items-center border-b pb-1 border-amber-50">
                                        <span className="text-[10px] font-bold uppercase text-amber-700">{s.staff_name}</span>
                                        <span className="text-[9px] text-muted-foreground">{format(new Date(s.created_at), 'dd MMM')}</span>
                                    </div>
                                    <p className="text-xs italic text-amber-900 line-clamp-2">"{s.notes}"</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default CashReconciliation;
