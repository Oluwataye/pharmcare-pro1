
import { useState, useEffect, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useInventory } from "@/hooks/useInventory";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Spinner } from "@/components/ui/spinner";
import { ArrowUpRight, ArrowDownRight, RefreshCcw, ShoppingBag, Info, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface StockMovement {
    id: string;
    product_id: string;
    quantity_change: number;
    previous_quantity: number;
    new_quantity: number;
    type: 'SALE' | 'ADJUSTMENT' | 'ADDITION' | 'RETURN' | 'INITIAL';
    reason: string | null;
    created_at: string;
    cost_price_at_time?: number;
    unit_price_at_time?: number;
    inventory?: {
        name: string;
    };
}

interface StockMovementHistoryProps {
    productId?: string;
    limit?: number;
}

export const StockMovementHistory = ({ productId, limit = 100 }: StockMovementHistoryProps) => {
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("ALL");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");

    const fetchMovements = async () => {
        setLoading(true);
        try {
            let query = supabase
                // @ts-ignore - Table types not generated yet
                .from('stock_movements')
                .select(`
                    *,
                    inventory!inner(name)
                `)
                .order('created_at', { ascending: false });

            if (productId) {
                query = query.eq('product_id', productId);
            }

            if (searchTerm && !productId) {
                query = query.ilike('inventory.name', `%${searchTerm}%`);
            }

            if (typeFilter !== "ALL") {
                query = query.eq('type', typeFilter);
            }

            if (startDate) {
                query = query.gte('created_at', new Date(startDate).toISOString());
            }

            if (endDate) {
                // Set to end of day
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query = query.lte('created_at', end.toISOString());
            }

            // Apply limit only if not searching everything (though keep it for performance)
            query = query.limit(limit);

            // @ts-ignore - Supabase type complexity
            const { data, error } = await query;

            if (error) throw error;
            setMovements(data as any[]);
        } catch (error) {
            console.error('Error fetching stock movements:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovements();
    }, [productId, limit, typeFilter, startDate, endDate]);

    // Handle search with debounce or just on enter/blur for simplicity
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchMovements();
    };

    const clearFilters = () => {
        setSearchTerm("");
        setTypeFilter("ALL");
        setStartDate("");
        setEndDate("");
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'SALE':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1"><ShoppingBag className="h-3 w-3" /> Sale</Badge>;
            case 'ADDITION':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"><ArrowUpRight className="h-3 w-3" /> Addition</Badge>;
            case 'ADJUSTMENT':
                return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1"><RefreshCcw className="h-3 w-3" /> Adjustment</Badge>;
            case 'INITIAL':
                return <Badge variant="secondary" className="flex items-center gap-1"><Info className="h-3 w-3" /> Initial</Badge>;
            case 'RETURN':
                return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1"><ArrowDownRight className="h-3 w-3" /> Return</Badge>;
            default:
                return <Badge variant="outline">{type}</Badge>;
        }
    };

    const totals = useMemo(() => {
        return movements.reduce((acc, m) => ({
            difference: acc.difference + m.quantity_change,
            balance: acc.balance + m.new_quantity,
            costImpact: acc.costImpact + ((m.cost_price_at_time || 0) * m.quantity_change)
        }), { difference: 0, balance: 0, costImpact: 0 });
    }, [movements]);

    const isAnyFilterActive = searchTerm !== "" || typeFilter !== "ALL" || startDate !== "" || endDate !== "";

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-end p-4 bg-muted/30 rounded-lg border border-primary/10">
                {!productId && (
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-xs font-semibold mb-1 block text-muted-foreground uppercase tracking-wider">Product Name</label>
                        <form onSubmit={handleSearch} className="relative">
                            <Input
                                placeholder="Search product..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-9 pr-8"
                            />
                            <Button type="submit" variant="ghost" size="icon" className="absolute right-0 top-0 h-9 w-9">
                                <Search className="h-3 w-3" />
                            </Button>
                        </form>
                    </div>
                )}

                <div className="w-[150px]">
                    <label className="text-xs font-semibold mb-1 block text-muted-foreground uppercase tracking-wider">Type</label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Types</SelectItem>
                            <SelectItem value="SALE">Sale</SelectItem>
                            <SelectItem value="ADDITION">Addition</SelectItem>
                            <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                            <SelectItem value="RETURN">Return</SelectItem>
                            <SelectItem value="INITIAL">Initial</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex gap-2 items-end">
                    <div className="w-[140px]">
                        <label className="text-xs font-semibold mb-1 block text-muted-foreground uppercase tracking-wider">From</label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="h-9 text-xs"
                        />
                    </div>
                    <div className="w-[140px]">
                        <label className="text-xs font-semibold mb-1 block text-muted-foreground uppercase tracking-wider">To</label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="h-9 text-xs"
                        />
                    </div>
                </div>

                {isAnyFilterActive && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-9 px-2 text-destructive hover:bg-destructive/10"
                    >
                        Clear
                    </Button>
                )}
            </div>

            <div className="rounded-md border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            {!productId && <TableHead>Product</TableHead>}
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Difference</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Cost Impact</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Sell Impact</TableHead>
                            <TableHead>Reason</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {movements.map((m) => (
                            <TableRow key={m.id}>
                                <TableCell className="text-xs whitespace-nowrap">
                                    {format(new Date(m.created_at), 'MMM dd, HH:mm')}
                                </TableCell>
                                {!productId && (
                                    <TableCell className="font-medium">
                                        {m.inventory?.name || 'Deleted Product'}
                                    </TableCell>
                                )}
                                <TableCell>
                                    {getTypeBadge(m.type)}
                                </TableCell>
                                <TableCell className={`text-right font-bold ${m.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {m.quantity_change > 0 ? '+' : ''}{m.quantity_change}
                                </TableCell>
                                <TableCell className="text-right">
                                    {m.new_quantity}
                                </TableCell>
                                <TableCell className={`text-right text-xs whitespace-nowrap ${(m.cost_price_at_time || 0) * m.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {m.cost_price_at_time ? `${(m.cost_price_at_time * m.quantity_change).toFixed(2)}` : '-'}
                                </TableCell>
                                <TableCell className={`text-right text-xs whitespace-nowrap ${(m.unit_price_at_time || 0) * m.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {m.unit_price_at_time ? `${(m.unit_price_at_time * m.quantity_change).toFixed(2)}` : '-'}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                    {m.type === 'ADJUSTMENT' ? (m.reason || '-') : '-'}
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="bg-muted/50 font-bold sticky bottom-0 border-t-2 border-primary/20">
                            <TableCell colSpan={!productId ? 3 : 2} className="text-primary font-bold">TOTALS</TableCell>
                            <TableCell className={`text-right ${totals.difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {totals.difference > 0 ? '+' : ''}{totals.difference}
                            </TableCell>
                            <TableCell className="text-right">{totals.balance}</TableCell>
                            <TableCell className={`text-right ${totals.costImpact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₦{totals.costImpact.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell colSpan={2}></TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
