
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EnhancedCard } from "@/components/ui/EnhancedCard";
import { Spinner } from "@/components/ui/spinner";
import {
    ArrowUpRight,
    ArrowDownRight,
    RefreshCcw,
    Search,
    Calendar as CalendarIcon,
    TrendingDown,
    TrendingUp,
    User,
    Info
} from "lucide-react";
import { NairaSign } from "@/components/icons/NairaSign";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";

interface AdjustmentRecord {
    id: string;
    product_id: string;
    quantity_change: number;
    previous_quantity: number;
    new_quantity: number;
    type: string;
    reason: string | null;
    created_at: string;
    cost_price_at_time: number | null;
    unit_price_at_time: number | null;
    batch_number: string | null;
    created_by: string;
    inventory: {
        name: string;
        sku: string;
    };
    profiles?: {
        name: string;
    };
}

const StockAdjustmentReport = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AdjustmentRecord[]>([]);
    const [fromDate, setFromDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [searchTerm, setSearchTerm] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: movements, error } = await supabase
                // @ts-ignore - Table types not generated yet
                .from('stock_movements')
                .select(`
          *,
          inventory (name, sku),
          profiles:created_by (name)
        `)
                .in('type', ['ADJUSTMENT', 'ADDITION', 'RETURN', 'INITIAL'])
                .gte('created_at', startOfDay(new Date(fromDate)).toISOString())
                .lte('created_at', endOfDay(new Date(toDate)).toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;
            setData(movements as any[]);
        } catch (err: any) {
            console.error("Error fetching adjustments:", err);
            toast.error("Failed to fetch adjustment history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [fromDate, toDate]);

    const filteredData = data.filter(item =>
        item.inventory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.inventory.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.reason && item.reason.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const stats = filteredData.reduce((acc, curr) => {
        const qtyChange = curr.quantity_change;
        const costPrice = curr.cost_price_at_time || 0;
        const sellPrice = curr.unit_price_at_time || 0;

        const costImpact = qtyChange * costPrice;
        const sellImpact = qtyChange * sellPrice;

        acc.totalCostImpact += costImpact;
        acc.totalSellImpact += sellImpact;
        if (qtyChange > 0) acc.increases += 1;
        else acc.decreases += 1;

        return acc;
    }, { totalCostImpact: 0, totalSellImpact: 0, increases: 0, decreases: 0 });

    const getTypeBadge = (type: string, qtyChange: number) => {
        const isPositive = qtyChange > 0;

        switch (type) {
            case 'ADDITION':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"><ArrowUpRight className="h-3 w-3" /> Addition</Badge>;
            case 'ADJUSTMENT':
                return isPositive
                    ? <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1"><RefreshCcw className="h-3 w-3" /> Adjustment (+)</Badge>
                    : <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1"><RefreshCcw className="h-3 w-3" /> Adjustment (-)</Badge>;
            case 'INITIAL':
                return <Badge variant="secondary" className="flex items-center gap-1"><Info className="h-3 w-3" /> Initial</Badge>;
            case 'RETURN':
                return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1"><ArrowDownRight className="h-3 w-3" /> Return</Badge>;
            default:
                return <Badge variant="outline">{type}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-end justify-between bg-muted/30 p-4 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full md:w-auto">
                    <div className="space-y-2">
                        <Label htmlFor="from">From Date</Label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="from"
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="to">To Date</Label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="to"
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="search">Search Product/Reason</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="search"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <EnhancedCard colorScheme="blue" className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Adjustments</p>
                            <h3 className="text-2xl font-bold">{filteredData.length}</h3>
                        </div>
                        <div className="bg-blue-100 p-2 rounded-full">
                            <RefreshCcw className="h-5 w-5 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        {stats.increases} Inc / {stats.decreases} Dec
                    </p>
                </EnhancedCard>

                <EnhancedCard colorScheme="amber" className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Cost Impact</p>
                            <h3 className={`text-2xl font-bold ${stats.totalCostImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(stats.totalCostImpact)}
                            </h3>
                        </div>
                        <div className="bg-amber-100 p-2 rounded-full">
                            <TrendingDown className="h-5 w-5 text-amber-600" />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Historical cost value diff</p>
                </EnhancedCard>

                <EnhancedCard colorScheme="green" className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Selling Impact</p>
                            <h3 className={`text-2xl font-bold ${stats.totalSellImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(stats.totalSellImpact)}
                            </h3>
                        </div>
                        <div className="bg-green-100 p-2 rounded-full">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Potential revenue diff</p>
                </EnhancedCard>

                <EnhancedCard colorScheme="indigo" className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Net Value Diff</p>
                            <h3 className="text-2xl font-bold text-indigo-600">
                                {formatCurrency(stats.totalSellImpact - stats.totalCostImpact)}
                            </h3>
                        </div>
                        <div className="bg-indigo-100 p-2 rounded-full">
                            <NairaSign className="h-5 w-5 text-indigo-600" />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Profit/Loss potential</p>
                </EnhancedCard>
            </div>

            <div className="rounded-md border overflow-hidden bg-background">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Spinner size="lg" />
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No stock adjustments found for the selected period.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[150px]">Date & Time</TableHead>
                                    <TableHead>Product (SKU)</TableHead>
                                    <TableHead>Adjustment Type</TableHead>
                                    <TableHead className="text-right">Qty Diff</TableHead>
                                    <TableHead className="text-right">Before/After</TableHead>
                                    <TableHead className="text-right">Cost Impact</TableHead>
                                    <TableHead className="text-right">Sell Impact</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead className="max-w-[200px]">Reason</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((record) => {
                                    const qtyDiff = record.quantity_change;
                                    const costImpact = qtyDiff * (record.cost_price_at_time || 0);
                                    const sellImpact = qtyDiff * (record.unit_price_at_time || 0);

                                    return (
                                        <TableRow key={record.id}>
                                            <TableCell className="text-xs whitespace-nowrap font-medium">
                                                {format(new Date(record.created_at), 'MMM dd, yyyy HH:mm')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">{record.inventory.name}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{record.inventory.sku}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getTypeBadge(record.type, qtyDiff)}
                                            </TableCell>
                                            <TableCell className={`text-right font-bold ${qtyDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {qtyDiff > 0 ? '+' : ''}{qtyDiff}
                                            </TableCell>
                                            <TableCell className="text-right text-xs">
                                                {record.previous_quantity} → {record.new_quantity}
                                            </TableCell>
                                            <TableCell className={`text-right text-xs ${costImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(costImpact)}
                                                <div className="text-[8px] opacity-70">
                                                    @{formatCurrency(record.cost_price_at_time || 0)}/unit
                                                </div>
                                            </TableCell>
                                            <TableCell className={`text-right text-xs ${sellImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(sellImpact)}
                                                <div className="text-[8px] opacity-70">
                                                    @{formatCurrency(record.unit_price_at_time || 0)}/unit
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-xs">
                                                    <User className="h-3 w-3 text-muted-foreground" />
                                                    {record.profiles?.name || 'System'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate italic" title={record.reason || ''}>
                                                {record.reason || '-'}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockAdjustmentReport;
