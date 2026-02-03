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
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LineChart, Line, Tooltip, ScatterChart, Scatter, ZAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Users, TrendingUp, AlertTriangle, ShoppingBag, BarChart2, Star, Target } from "lucide-react";
import { format, subDays, parseISO } from "date-fns";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const StaffPerformanceReport = () => {
    const [loading, setLoading] = useState(true);
    const [staffStats, setStaffStats] = useState<any[]>([]);
    const [timeframe, setTimeframe] = useState("30"); // days

    useEffect(() => {
        fetchStaffPerformance();
    }, [timeframe]);

    const fetchStaffPerformance = async () => {
        try {
            setLoading(true);
            const startDate = subDays(new Date(), parseInt(timeframe)).toISOString();

            // 1. Fetch shifts to get variance data
            const { data: shifts, error: shiftsError } = await supabase
                .from('staff_shifts' as any)
                .select('*')
                .gte('created_at', startDate)
                .eq('status', 'closed');

            if (shiftsError) throw shiftsError;

            // 2. Fetch sales for volume and ATV
            const { data: sales, error: salesError } = await supabase
                .from('sales' as any)
                .select('cashier_id, cashier_name, total, date')
                .gte('created_at', startDate);

            if (salesError) throw salesError;

            processPerformance(shifts || [], sales || []);
        } catch (error) {
            console.error("Error fetching staff performance:", error);
        } finally {
            setLoading(false);
        }
    };

    const processPerformance = (shifts: any[], sales: any[]) => {
        const stats: Record<string, any> = {};

        // Aggregate Sales Data
        sales.forEach(sale => {
            const id = sale.cashier_id || 'unknown';
            if (!stats[id]) {
                stats[id] = {
                    id,
                    name: sale.cashier_name || 'Store Staff',
                    totalSales: 0,
                    transactionCount: 0,
                    variances: [],
                    shifts: 0
                };
            }
            stats[id].totalSales += Number(sale.total);
            stats[id].transactionCount += 1;
        });

        // Aggregate Shift/Variance Data
        shifts.forEach(shift => {
            const id = shift.staff_id;
            if (!stats[id]) {
                stats[id] = {
                    id,
                    name: shift.staff_name,
                    totalSales: 0,
                    transactionCount: 0,
                    variances: [],
                    shifts: 0
                };
            }

            const expected = Number(shift.expected_cash_total) || 0;
            const actual = Number(shift.actual_cash_counted) || 0;
            const variance = actual - expected;

            stats[id].variances.push(variance);
            stats[id].shifts += 1;
        });

        const performanceArray = Object.values(stats).map((s: any) => {
            const avgTransactionValue = s.transactionCount > 0 ? s.totalSales / s.transactionCount : 0;
            const netVariance = s.variances.reduce((a: number, b: number) => a + b, 0);
            const varianceFrequency = s.shifts > 0 ? (s.variances.filter((v: number) => Math.abs(v) > 50).length / s.shifts) * 100 : 0;
            const accuracyScore = Math.max(0, 100 - (varianceFrequency * 0.5) - (Math.abs(netVariance) / 1000));

            return {
                ...s,
                avgTransactionValue,
                netVariance,
                varianceFrequency,
                accuracyScore
            };
        }).sort((a, b) => b.totalSales - a.totalSales);

        setStaffStats(performanceArray);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Spinner size="lg" />
                <p className="text-muted-foreground animate-pulse">Analyzing staff performance metrics...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30 p-4 rounded-lg border">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Star className="h-5 w-5 text-amber-500" />
                        Staff Efficiency & Accuracy Analytics
                    </h3>
                    <p className="text-sm text-muted-foreground">Identifying performance trends and training opportunities.</p>
                </div>
                <div className="flex bg-background border rounded-md p-1">
                    <button
                        onClick={() => setTimeframe("7")}
                        className={`px-3 py-1 text-xs rounded ${timeframe === "7" ? "bg-primary text-white" : "hover:bg-muted"}`}
                    >7 Days</button>
                    <button
                        onClick={() => setTimeframe("30")}
                        className={`px-3 py-1 text-xs rounded ${timeframe === "30" ? "bg-primary text-white" : "hover:bg-muted"}`}
                    >30 Days</button>
                    <button
                        onClick={() => setTimeframe("90")}
                        className={`px-3 py-1 text-xs rounded ${timeframe === "90" ? "bg-primary text-white" : "hover:bg-muted"}`}
                    >90 Days</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    title="Top Performer"
                    value={staffStats[0]?.name || "N/A"}
                    description={staffStats[0] ? `₦${staffStats[0].totalSales.toLocaleString()} Vol` : ""}
                    icon={Target}
                    colorScheme="success"
                />
                <MetricCard
                    title="Avg Team ATV"
                    value={`₦${(staffStats.reduce((a, b) => a + b.avgTransactionValue, 0) / (staffStats.length || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    description="Average ticket size"
                    icon={ShoppingBag}
                    colorScheme="primary"
                />
                <MetricCard
                    title="Accuracy Alert"
                    value={staffStats.filter(s => s.varianceFrequency > 20).length.toString()}
                    description="Staff with >20% variance frequency"
                    icon={AlertTriangle}
                    colorScheme="warning"
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Staff Performance Ranking</CardTitle>
                    <CardDescription>Based on sales volume and operational accuracy</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Staff Member</TableHead>
                                <TableHead className="text-right">Total Sales</TableHead>
                                <TableHead className="text-right">ATV</TableHead>
                                <TableHead className="text-right">Net Variance</TableHead>
                                <TableHead className="text-right">Accuracy Score</TableHead>
                                <TableHead className="w-[150px]">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staffStats.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        No staff activity found for this period.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                staffStats.map((staff) => (
                                    <TableRow key={staff.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold">{staff.name}</span>
                                                <span className="text-[10px] text-muted-foreground">{staff.shifts} shifts completed</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">₦{staff.totalSales.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">₦{staff.avgTransactionValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                                        <TableCell className={`text-right font-mono text-sm ${staff.netVariance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            ₦{staff.netVariance.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-xs font-bold">{staff.accuracyScore.toFixed(1)}%</span>
                                                <Progress value={staff.accuracyScore} className="h-1 w-20" />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {staff.accuracyScore > 95 ? (
                                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Elite</Badge>
                                            ) : staff.accuracyScore > 85 ? (
                                                <Badge variant="outline" className="text-blue-600 border-blue-200">Reliable</Badge>
                                            ) : (
                                                <Badge variant="destructive" className="bg-rose-50 text-rose-700 border-rose-200">Review Required</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Variance vs Performance Matrix</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid />
                                    <XAxis type="number" dataKey="totalSales" name="Sales Vol" unit="₦" tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                                    <YAxis type="number" dataKey="netVariance" name="Variance" unit="₦" />
                                    <ZAxis type="number" range={[50, 400]} />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                    <Scatter name="Staff" data={staffStats} fill="#2563eb" />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2 text-center">
                            X-Axis: Sales Volume | Y-Axis: Net Cash Variance
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Staff Efficiency Ranking</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={staffStats} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                                    <YAxis dataKey="name" type="category" width={80} style={{ fontSize: '10px' }} />
                                    <Tooltip formatter={(val: number) => `₦${val.toLocaleString()}`} />
                                    <Bar dataKey="totalSales" fill="#818cf8" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default StaffPerformanceReport;
