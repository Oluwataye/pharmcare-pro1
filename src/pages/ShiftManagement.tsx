
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, ArrowUpRight, ArrowDownRight, History, Shield, Power, AlertCircle, Play, Pause, WifiOff } from "lucide-react";
import { ShiftStatusHeader } from "@/components/shifts/ShiftStatusHeader";
import { usePermissions } from "@/hooks/usePermissions";
import { useShift } from "@/hooks/useShift";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const ShiftManagement = () => {
    const [shifts, setShifts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { canAccessReports } = usePermissions();
    const { activeStaffShifts, adminEndShift, adminPauseShift, adminResumeShift, refreshShifts } = useShift();
    const { user } = useAuth();
    const { toast } = useToast();

    const [closingShift, setClosingShift] = useState<any>(null);
    const [cash, setCash] = useState("");
    const isOffline = !window.navigator.onLine;

    const fetchShiftHistory = async () => {
        console.log('[ShiftManagement] Attempting to fetch shift history...');
        if (!canAccessReports()) {
            console.log('[ShiftManagement] Access denied by permissions hook.');
            setIsLoading(false);
            return;
        }

        if (isOffline) {
            console.log('[ShiftManagement] System is offline, skipping history fetch.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            console.log('[ShiftManagement] Querying staff_shifts table...');
            const { data, error } = await supabase
                .from('staff_shifts' as any)
                .select('*')
                .order('start_time', { ascending: false })
                .limit(100);

            if (error) {
                console.error('[ShiftManagement] Supabase error:', error);
                throw error;
            }
            console.log('[ShiftManagement] Fetched shifts:', data?.length || 0);
            setShifts(data || []);
        } catch (error: any) {
            console.error('[ShiftManagement] Fetch failed:', error);
            // Only show toast if NOT a network error while offline
            if (window.navigator.onLine) {
                toast({ title: "Error", description: error.message || "Failed to load audit history", variant: "destructive" });
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            console.log('[ShiftManagement] useEffect triggered by user change.');
            fetchShiftHistory();
        }
    }, [user?.id, canAccessReports]);

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

    const handleForceEnd = async () => {
        if (!closingShift) return;
        try {
            await adminEndShift(
                closingShift.id,
                Number(cash),
                closingShift.staff_id,
                closingShift.start_time,
                "Administrative force closure"
            );
            setClosingShift(null);
            setCash("");
            fetchShiftHistory();
        } catch (error) {
            // Error handled by ShiftContext toast
        }
    };

    const activeCount = activeStaffShifts.length;
    const pausedCount = activeStaffShifts.filter(s => s.status === 'paused').length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <ShiftStatusHeader />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Active</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">Staff currently on duty</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Paused Sessions</CardTitle>
                        <Pause className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pausedCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">Staff on break</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">System Status</CardTitle>
                        <Power className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">Active</div>
                        <p className="text-xs text-muted-foreground mt-1">Shift monitoring enabled</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-md overflow-hidden bg-card">
                <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5 text-primary" />
                            Live Shift Monitoring
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Manage current on-duty staff</p>
                    </div>
                    {isOffline && (
                        <Badge variant="outline" className="gap-1 text-amber-600 bg-amber-50 border-amber-200">
                            <WifiOff className="h-3 w-3" /> Offline Mode
                        </Badge>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/20 hover:bg-muted/20">
                                <TableHead className="font-semibold">Staff Member</TableHead>
                                <TableHead className="font-semibold">Shift Info</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold">Started At</TableHead>
                                <TableHead className="text-right font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activeStaffShifts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <Users className="h-8 w-8 opacity-20" />
                                            {isOffline ? "Shift data unavailable while offline" : "No active staff shifts found"}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                activeStaffShifts.map((s) => (
                                    <TableRow key={s.id} className="hover:bg-muted/10 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="text-xs font-bold text-primary">
                                                        {s.staff_name?.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="font-medium">{s.staff_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="capitalize">{s.shift_type}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={s.status === 'active' ? 'default' : 'secondary'}
                                                className={cn(
                                                    "capitalize font-medium",
                                                    s.status === 'active' ? 'bg-green-500/10 text-green-700 hover:bg-green-500/20' : ''
                                                )}
                                            >
                                                {s.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {s.status === 'active' ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                        onClick={() => adminPauseShift(s.id)}
                                                    >
                                                        <Pause className="h-4 w-4 mr-1" /> Pause
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        onClick={() => adminResumeShift(s.id)}
                                                    >
                                                        <Play className="h-4 w-4 mr-1" /> Resume
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="h-8 shadow-sm"
                                                    onClick={() => setClosingShift(s)}
                                                >
                                                    <Power className="h-4 w-4 mr-1" /> End
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-card">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <History className="h-5 w-5 text-muted-foreground" />
                        Audit History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Staff</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Period</TableHead>
                                <TableHead>Expected Totals</TableHead>
                                <TableHead>Actual Cash</TableHead>
                                <TableHead className="text-right">Cash Diff</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        Loading audit data...
                                    </TableCell>
                                </TableRow>
                            ) : shifts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        {isOffline ? "History unavailable offline" : "No shift history found"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                shifts.map((shift) => (
                                    <TableRow key={shift.id}>
                                        <TableCell className="font-medium">{shift.staff_name}</TableCell>
                                        <TableCell className="capitalize">{shift.shift_type}</TableCell>
                                        <TableCell>
                                            <div className="text-xs space-y-0.5">
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-muted-foreground">Cash:</span>
                                                    <span className="font-medium">₦{shift.expected_cash_total?.toLocaleString() || 0}</span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-muted-foreground">POS:</span>
                                                    <span className="font-medium">₦{shift.expected_pos_total?.toLocaleString() || 0}</span>
                                                </div>
                                                <div className="flex justify-between gap-4 border-t pt-0.5 font-bold">
                                                    <span>Total:</span>
                                                    <span>₦{shift.expected_sales_total?.toLocaleString() || 0}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-green-700">
                                                ₦{shift.actual_cash_counted?.toLocaleString() || 0}
                                            </div>
                                            {shift.expected_transfer_total > 0 && (
                                                <div className="text-[10px] text-muted-foreground">
                                                    + ₦{shift.expected_transfer_total.toLocaleString()} Transfer
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {shift.actual_cash_counted !== undefined && shift.expected_sales_total !== undefined && (
                                                <Badge variant={shift.actual_cash_counted >= shift.expected_sales_total ? "default" : "destructive"}>
                                                    ₦{(shift.actual_cash_counted - shift.expected_sales_total).toLocaleString()}
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!closingShift} onOpenChange={() => setClosingShift(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Force End Shift: {closingShift?.staff_name}</DialogTitle>
                        <DialogDescription>
                            Administrative action to finalize a staff member's duty session.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cash" className="text-right">
                                Actual Cash
                            </Label>
                            <Input
                                id="cash"
                                type="number"
                                value={cash}
                                onChange={(e) => setCash(e.target.value)}
                                className="col-span-3"
                                placeholder="Enter cash counted (₦)"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setClosingShift(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleForceEnd}>Finalize & End Shift</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ShiftManagement;
