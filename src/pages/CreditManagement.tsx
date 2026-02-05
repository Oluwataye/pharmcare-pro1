
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wallet, History, ArrowDownLeft, Search, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

export default function CreditManagement() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [repayAmount, setRepayAmount] = useState("");
    const [repayNote, setRepayNote] = useState("");

    // Fetch Customers with outstanding balance
    const { data: debtors, isLoading } = useQuery({
        queryKey: ['debtors'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .gt('credit_balance', 0)
                .order('credit_balance', { ascending: false });

            if (error) throw error;
            return data;
        }
    });

    // Fetch Ledger for selected customer
    const { data: ledger, isLoading: isLoadingLedger } = useQuery({
        queryKey: ['customer_ledger', selectedCustomer?.id],
        queryFn: async () => {
            if (!selectedCustomer?.id) return [];
            const { data, error } = await supabase
                .from('customer_transactions')
                .select('*')
                .eq('customer_id', selectedCustomer.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!selectedCustomer?.id && isHistoryModalOpen
    });

    // Repayment Mutation
    const repayMutation = useMutation({
        mutationFn: async (values: { customerId: string, amount: number, note: string }) => {
            // 1. Get current balance
            const { data: cust } = await supabase.from('customers').select('credit_balance').eq('id', values.customerId).single();
            const currentBalance = cust?.credit_balance || 0;
            const newBalance = currentBalance - values.amount;

            // 2. Insert Credited Transaction
            const { error: ledgerError } = await supabase
                .from('customer_transactions')
                .insert({
                    customer_id: values.customerId,
                    type: 'CREDIT',
                    amount: values.amount,
                    description: values.note || 'Debt Repayment',
                    balance_before: currentBalance,
                    balance_after: newBalance,
                    created_by: user?.id
                });

            if (ledgerError) throw ledgerError;

            // 3. Update Customer Balance (Handled by Trigger, but trigger relies on balance_after from insert? 
            // Actually, my migration trigger SETS balance = balance_after. So insert is enough.)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['debtors'] });
            queryClient.invalidateQueries({ queryKey: ['customer_ledger'] });
            setIsRepayModalOpen(false);
            setRepayAmount("");
            setRepayNote("");
            toast({ title: "Success", description: "Payment recorded successfully" });
        },
        onError: (error) => {
            console.error(error);
            toast({ title: "Error", description: "Failed to record payment", variant: "destructive" });
        }
    });

    const handleRepaySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer || !repayAmount) return;
        repayMutation.mutate({
            customerId: selectedCustomer.id,
            amount: parseFloat(repayAmount),
            note: repayNote
        });
    };

    const filteredDebtors = debtors?.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.phone?.includes(searchTerm)
    );

    const totalOutstanding = debtors?.reduce((sum, d) => sum + d.credit_balance, 0) || 0;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Credit Management</h1>
                    <p className="text-muted-foreground">Manage customer debts and outstanding balances</p>
                </div>
                <Card className="w-[300px]">
                    <CardContent className="pt-6">
                        <div className="text-sm font-medium text-muted-foreground">Total Outstanding Receivables</div>
                        <div className="text-2xl font-bold text-red-600">₦{totalOutstanding.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    className="max-w-sm"
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Debtors List</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Outstanding Balance</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
                            ) : filteredDebtors?.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center">No outstanding debts found.</TableCell></TableRow>
                            ) : (
                                filteredDebtors?.map((customer) => (
                                    <TableRow key={customer.id}>
                                        <TableCell className="font-medium">{customer.name}</TableCell>
                                        <TableCell>{customer.phone}</TableCell>
                                        <TableCell className="font-bold text-red-600">₦{customer.credit_balance.toLocaleString()}</TableCell>
                                        <TableCell>{customer.updated_at ? format(new Date(customer.updated_at), 'MMM dd, yyyy') : '-'}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedCustomer(customer);
                                                    setIsHistoryModalOpen(true);
                                                }}
                                            >
                                                <History className="h-4 w-4 mr-1" />
                                                History
                                            </Button>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => {
                                                    setSelectedCustomer(customer);
                                                    setIsRepayModalOpen(true);
                                                }}
                                            >
                                                <ArrowDownLeft className="h-4 w-4 mr-1" />
                                                Repay
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Repayment Modal */}
            <Dialog open={isRepayModalOpen} onOpenChange={setIsRepayModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record Payment for {selectedCustomer?.name}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleRepaySubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Current Balance</Label>
                            <div className="text-2xl font-bold text-red-600">
                                ₦{selectedCustomer?.credit_balance.toLocaleString()}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount to Repay (₦)</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={selectedCustomer?.credit_balance}
                                required
                                value={repayAmount}
                                onChange={(e) => setRepayAmount(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="note">Note / Reference</Label>
                            <Input
                                id="note"
                                placeholder="e.g. Cash payment, Bank Transfer Ref"
                                value={repayNote}
                                onChange={(e) => setRepayNote(e.target.value)}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsRepayModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={repayMutation.isPending}>
                                {repayMutation.isPending ? 'Processing...' : 'Confirm Payment'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* History Modal */}
            <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Transaction History - {selectedCustomer?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Balance After</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingLedger ? (
                                    <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
                                ) : ledger?.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell>{format(new Date(tx.created_at), 'MMM dd, HH:mm')}</TableCell>
                                        <TableCell>
                                            {tx.type === 'DEBIT' ? (
                                                <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Sale (Credit)</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Payment</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>{tx.description}</TableCell>
                                        <TableCell className={tx.type === 'DEBIT' ? 'text-red-600' : 'text-green-600'}>
                                            {tx.type === 'DEBIT' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="font-mono">₦{tx.balance_after.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
