
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, ArrowUpRight, ArrowDownRight, History } from "lucide-react";
import { ShiftStatusHeader } from "@/components/shifts/ShiftStatusHeader";

const ShiftManagement = () => {
    const [shifts, setShifts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchShiftHistory = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('staff_shifts' as any)
                .select('*')
                .order('start_time', { ascending: false })
                .limit(50);

            if (error) throw error;
            setShifts(data || []);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchShiftHistory();
    }, []);

    const getStatusBadge = (status: string) => {
        return status === 'active' ? (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Live</Badge>
        ) : (
            <Badge variant="secondary">Closed</Badge>
        );
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Shift Management</h1>
                    <p className="text-sm text-muted-foreground">Monitor active staff duty and reconcile cash records.</p>
                </div>
                <ShiftStatusHeader />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Shifts Today</CardTitle>
                        <Clock className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{shifts.filter(s => new Date(s.start_time).toDateString() === new Date().toDateString()).length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Activity for current 24h</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Staff Members</CardTitle>
                        <Users className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{new Set(shifts.map(s => s.staff_id)).size}</div>
                        <p className="text-xs text-muted-foreground mt-1">Unique personnel tracked</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Latest Reconciled Cash</CardTitle>
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₦{shifts.find(s => s.status === 'closed')?.actual_cash_counted?.toLocaleString() || '0'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">From most recent closed shift</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        <CardTitle>Shift Audit Log</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="py-20 text-center">Loading audit data...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Staff Name</TableHead>
                                    <TableHead>Shift Type</TableHead>
                                    <TableHead>Start Time</TableHead>
                                    <TableHead>End Time</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Opening Cash</TableHead>
                                    <TableHead className="text-right">Closed (Counted)</TableHead>
                                    <TableHead>Discrepancy</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {shifts.map((shift) => {
                                    const expected = (shift.opening_cash || 0) + (shift.expected_sales_total || 0);
                                    const diff = shift.status === 'closed' ? (shift.actual_cash_counted - expected) : 0;

                                    return (
                                        <TableRow key={shift.id}>
                                            <TableCell className="font-medium">{shift.staff_name}</TableCell>
                                            <TableCell>{shift.shift_type}</TableCell>
                                            <TableCell>{new Date(shift.start_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</TableCell>
                                            <TableCell>
                                                {shift.end_time ? new Date(shift.end_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(shift.status)}</TableCell>
                                            <TableCell className="text-right text-muted-foreground">₦{shift.opening_cash?.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                {shift.status === 'closed' ? `₦${shift.actual_cash_counted?.toLocaleString()}` : <span className="italic text-xs text-muted-foreground">In progress</span>}
                                            </TableCell>
                                            <TableCell>
                                                {shift.status === 'closed' && (
                                                    <div className={`flex items-center gap-1 text-xs font-bold ${diff < 0 ? 'text-red-500' : diff > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                                                        {diff > 0 && <ArrowUpRight className="h-3 w-3" />}
                                                        {diff < 0 && <ArrowDownRight className="h-3 w-3" />}
                                                        ₦{Math.abs(diff).toLocaleString()}
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ShiftManagement;
