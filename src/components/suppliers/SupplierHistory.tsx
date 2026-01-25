
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Spinner } from "@/components/ui/spinner";
import { ArrowUpRight, Info, Filter, FileText } from "lucide-react";
import { useSuppliers } from "@/hooks/useSuppliers";

interface SupplierHistoryItem {
    id: string;
    created_at: string;
    product_id: string;
    quantity_change: number;
    new_quantity: number;
    type: string;
    reason: string | null;
    inventory: {
        name: string;
        supplier_id: string | null;
        unit: string;
    };
}

export const SupplierHistory = () => {
    const [history, setHistory] = useState<SupplierHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSupplier, setSelectedSupplier] = useState<string>("all");
    const { suppliers, fetchSuppliers } = useSuppliers();

    useEffect(() => {
        // Load suppliers reference data
        fetchSuppliers();
    }, [fetchSuppliers]);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                // Fetch stock movements that are additions or initial stock
                let query = supabase
                    .from('stock_movements')
                    .select(`
                        id,
                        created_at,
                        product_id,
                        quantity_change,
                        new_quantity,
                        type,
                        reason,
                        inventory (
                            name,
                            supplier_id,
                            unit
                        )
                    `)
                    .in('type', ['ADDITION', 'INITIAL'])
                    .order('created_at', { ascending: false })
                    .limit(100);

                const { data, error } = await query;

                if (error) throw error;

                // Filter by supplier if selected
                // Note: We filter in client because of the join structure or complex RLS
                let filteredData = (data as any[]) || [];

                if (selectedSupplier && selectedSupplier !== "all") {
                    filteredData = filteredData.filter(item =>
                        item.inventory?.supplier_id === selectedSupplier
                    );
                }

                setHistory(filteredData);
            } catch (error) {
                console.error('Error fetching supplier history:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [selectedSupplier]);

    const extractInvoice = (reason: string | null) => {
        if (!reason) return "-";
        const match = reason.match(/Invoice: (.*)/i);
        return match ? match[1] : "-";
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-muted/30 p-4 rounded-lg border">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-medium">Filter by Supplier:</span>
                </div>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                    <SelectTrigger className="w-full sm:w-[250px] bg-background">
                        <SelectValue placeholder="All Suppliers" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Suppliers</SelectItem>
                        {suppliers.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="p-4 md:p-6 pb-2">
                    <CardTitle className="text-lg">Delivery History</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Spinner size="lg" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                            No delivery history found for the selected supplier.
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Invoice Ref</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((item) => {
                                        // Ensure we match IDs correctly (UUID vs String)
                                        const supplierId = item.inventory?.supplier_id;
                                        const supplier = suppliers.find(s => s.id === supplierId || String(s.id) === String(supplierId));

                                        // Debug log if we have an ID but no match (dev only)
                                        if (supplierId && !supplier) {
                                            console.debug(`Supplier mismatch: ID ${supplierId} not found in ${suppliers.length} suppliers`);
                                        }

                                        const isInitial = item.type === 'INITIAL';

                                        return (
                                            <TableRow key={item.id} className="hover:bg-muted/50">
                                                <TableCell className="whitespace-nowrap font-medium text-xs text-muted-foreground">
                                                    {format(new Date(item.created_at), 'MMM dd, yyyy HH:mm')}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {supplier ? (
                                                        <span className="text-primary">{supplier.name}</span>
                                                    ) : supplierId ? (
                                                        <span className="text-muted-foreground text-xs italic" title={`ID: ${supplierId}`}>Supplier Not Found</span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{item.inventory?.name || "Unknown Product"}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={isInitial ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-green-50 text-green-700 border-green-200"}>
                                                        {isInitial ? <Info className="h-3 w-3 mr-1" /> : <ArrowUpRight className="h-3 w-3 mr-1" />}
                                                        {isInitial ? "Initial" : "Restock"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-bold text-green-600">+{item.quantity_change}</span>
                                                    <span className="text-xs text-muted-foreground ml-1">{item.inventory?.unit}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        <FileText className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-sm">{extractInvoice(item.reason)}</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
