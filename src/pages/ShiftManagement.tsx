
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, ArrowUpRight, ArrowDownRight, History, Shield, Power, AlertCircle, Play, Pause } from "lucide-react";
import { ShiftStatusHeader } from "@/components/shifts/ShiftStatusHeader";
import { usePermissions } from "@/hooks/usePermissions";
import { useShift } from "@/hooks/useShift";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ShiftManagement = () => {
    const [shifts, setShifts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { canAccessReports } = usePermissions();
    const { activeStaffShifts, adminEndShift, adminPauseShift, adminResumeShift, refreshShifts } = useShift();
    const { toast } = useToast();

    const [closingShift, setClosingShift] = useState<any>(null);
    const [cash, setCash] = useState("");

    const fetchShiftHistory = async () => {
        if (!canAccessReports()) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('staff_shifts' as any)
                .select('*')
                .order('start_time', { ascending: false })
                .limit(100);

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
    }, [canAccessReports]);

    if (!canAccessReports()) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <Shield className="h-12 w-12 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Access Restricted</h2>
                <p className="text-muted-foreground">Only administrators can view shift audit logs and history.</p>
                <div className="mt-8">
                    <ShiftStatusHeader />
                </div>
            </div>
        );
    }

    const handleAdminEnd = async () => {
        if (!closingShift) return;
        await adminEndShift(closingShift.id, parseFloat(cash) || 0, closingShift.staff_id, closingShift.start_time);
        setClosingShift(null);
        setCash("");
        fetchShiftHistory();
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Live</Badge>;
            case 'paused':
                return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">Paused</Badge>;
            default:
                return <Badge variant="secondary">Closed</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Shift & Audit Management</h1>
                    <p className="text-sm text-muted-foreground">Monitor performance, reconcile cash, and audit duty logs.</p>
                </div>
                <ShiftStatusHeader />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Currently on Duty</CardTitle>
                        <Users className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{activeStaffShifts.filter(s => s.status === 'active').length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Staff members actively working</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Staff Paused</CardTitle>
                        <Clock className="w-4 h-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeStaffShifts.filter(s => s.status === 'paused').length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Staff currently on break</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Last Closing</CardTitle>
                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₦{shifts.find(s => s.status === 'closed')?.actual_cash_counted?.toLocaleString() || '0'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">From most recent closed shift</p>
                    </CardContent>
                </Card>
            </div>

            {activeStaffShifts.length > 0 && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Power className="h-4 w-4 text-primary" />
                            Live Sessions Control
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeStaffShifts.map(staffShift => (
                                <div key={staffShift.id} className="bg-white p-4 rounded-lg border shadow-sm flex flex-col justify-between space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{staffShift.staff_name}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">{staffShift.shift_type} Shift</p>
                                        </div>
                                        {getStatusBadge(staffShift.status)}
                                    </div>
                                    <div className="flex items-center justify-between gap-2 border-t pt-3">
                                        <div className="text-xs text-muted-foreground">
                                            Since {new Date(staffShift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="flex gap-1">
                                            {staffShift.status === 'active' ? (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-amber-600 hover:bg-amber-50"
                                                    onClick={() => adminPauseShift(staffShift.id)}
                                                    title="Pause Shift"
                                                >
                                                    <Pause className="h-3 w-3" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-green-600 hover:bg-green-50"
                                                    onClick={() => adminResumeShift(staffShift.id)}
                                                    title="Resume Shift"
                                                >
                                                    <Play className="h-3 w-3" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-[10px] border-red-200 text-red-600 hover:bg-red-50 px-2"
                                                onClick={() => setClosingShift(staffShift)}
                                            >
                                                Force End
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        <CardTitle>Shift Audit Log</CardTitle>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => fetchShiftHistory()}>
                        Refresh Audit
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="py-20 text-center">Loading audit data...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Staff Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Opening</TableHead>
                                    <TableHead className="text-right">Counted</TableHead>
                                    <TableHead>Diff</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {shifts.map((shift) => {
                                    const expected = (shift.opening_cash || 0) + (shift.expected_sales_total || 0);
                                    const diff = shift.status === 'closed' ? (shift.actual_cash_counted - expected) : 0;

                                    return (
                                        <TableRow key={shift.id}>
                                            <TableCell className="font-medium whitespace-nowrap">{shift.staff_name}</TableCell>
                                            <TableCell>{shift.shift_type}</TableCell>
                                            <TableCell className="text-xs whitespace-nowrap">
                                                {new Date(shift.start_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                <br />
                                                {shift.end_time ? new Date(shift.end_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(shift.status)}</TableCell>
                                            <TableCell className="text-right text-muted-foreground">₦{shift.opening_cash?.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                {shift.status === 'closed' ? `₦${shift.actual_cash_counted?.toLocaleString()}` : <span className="italic text-[10px] text-muted-foreground uppercase">Live</span>}
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
                                            <TableCell className="max-w-[150px] truncate text-xs" title={shift.notes}>
                                                {shift.notes || '—'}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Admin Force Close Modal */}
            <Dialog open={!!closingShift} onOpenChange={() => setClosingShift(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Force End Shift: {closingShift?.staff_name}</DialogTitle>
                        <DialogDescription>
                            Administrative action to finalize a staff member's duty session.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-amber-800 text-xs flex gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            Force closing will finalize the session. Please enter the physical cash amount at their station.
                        </div>
                        <div className="space-y-2">
                            <Label>Actual Cash at Station (₦)</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={cash}
                                onChange={(e) => setCash(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setClosingShift(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleAdminEnd}>Confirm Force Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ShiftManagement;
