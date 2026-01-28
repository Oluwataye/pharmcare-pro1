
import { useState, useEffect } from "react";
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
import { ArrowUpRight, ArrowDownRight, RefreshCcw, ShoppingCart, Info } from "lucide-react";

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

export const StockMovementHistory = ({ productId, limit = 50 }: StockMovementHistoryProps) => {
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMovements = async () => {
            setLoading(true);
            try {
                let query = supabase
                    // @ts-ignore - Table types not generated yet
                    .from('stock_movements')
                    .select(`
            *,
            inventory (name)
          `)
                    .order('created_at', { ascending: false })
                    .limit(limit);

                if (productId) {
                    query = query.eq('product_id', productId);
                }

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

        fetchMovements();
    }, [productId, limit]);

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'SALE':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1"><ShoppingCart className="h-3 w-3" /> Sale</Badge>;
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

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Spinner size="default" />
            </div>
        );
    }

    if (movements.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No stock movements found.
            </div>
        );
    }

    return (
        <div className="rounded-md border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        {!productId && <TableHead>Product</TableHead>}
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Change</TableHead>
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
                                {m.reason || '-'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};
