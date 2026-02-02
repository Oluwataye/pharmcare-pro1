
import { Button } from "@/components/ui/button";
import { useShift } from "@/hooks/useShift";
import { Badge } from "@/components/ui/badge";
import { Clock, Lock, LogIn, Pause, Play } from "lucide-react";
import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, Wallet, CreditCard, Landmark, ShoppingCart } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const ShiftStatusHeader = () => {
    const { activeShift, startShift, pauseShift, resumeShift, endShift, isLoading } = useShift();
    const [isOpening, setIsOpening] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [cash, setCash] = useState("");

    const handleStart = async () => {
        await startShift(parseFloat(cash) || 0);
        setIsOpening(false);
        setCash("");
    };

    const [notes, setNotes] = useState("");
    const [expectedSummary, setExpectedSummary] = useState<{ cash: number, pos: number, transfer: number, total: number } | null>(null);

    useEffect(() => {
        if (isClosing && activeShift) {
            // In a real scenario, we might want to refresh these from the DB
            // for the most accurate current state if the shift has been long.
            // For now we use what's in the activeShift object which is updated by sales.
            setExpectedSummary({
                cash: activeShift.expected_cash_total || 0,
                pos: activeShift.expected_pos_total || 0,
                transfer: activeShift.expected_transfer_total || 0,
                total: activeShift.expected_sales_total || 0
            });
        }
    }, [isClosing, activeShift]);

    // Calculate variance
    const variance = (parseFloat(cash) || 0) - ((activeShift?.opening_cash || 0) + (expectedSummary?.cash || 0));

    const handleEnd = async () => {
        await endShift(parseFloat(cash) || 0, notes);
        setIsClosing(false);
        setCash("");
        setNotes("");
        setExpectedSummary(null);
    };

    if (isLoading) return null;

    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg border">
            {activeShift ? (
                <>
                    <div className="flex flex-col min-w-[100px]">
                        <span className="text-[10px] text-muted-foreground font-medium uppercase truncate">
                            {activeShift.status === 'paused' ? 'Shift Paused' : 'Active Duty'}
                        </span>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className={activeShift.status === 'paused' ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-green-50 text-green-700 border-green-200"}>
                                {activeShift.shift_type}
                            </Badge>
                            <span className="text-xs font-mono">
                                {new Date(activeShift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 border-l pl-3">
                        {activeShift.status === 'paused' ? (
                            <Button variant="ghost" size="sm" onClick={resumeShift} className="h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                                <Play className="h-4 w-4 mr-1" />
                                Resume
                            </Button>
                        ) : (
                            <Button variant="ghost" size="sm" onClick={pauseShift} className="h-8 text-muted-foreground hover:text-foreground">
                                <Pause className="h-4 w-4 mr-1" />
                                Pause
                            </Button>
                        )}

                        <Button variant="ghost" size="sm" onClick={() => setIsClosing(true)} className="h-8 text-destructive hover:text-destructive hover:bg-red-50">
                            <Lock className="h-4 w-4 mr-1" />
                            End Shift
                        </Button>
                    </div>
                </>
            ) : (
                <>
                    <span className="text-xs text-muted-foreground italic">No active shift detected</span>
                    <Button variant="default" size="sm" onClick={() => setIsOpening(true)} className="h-8">
                        <LogIn className="h-4 w-4 mr-1" />
                        Start Shift
                    </Button>
                </>
            )}

            {/* Start Shift Modal */}
            <Dialog open={isOpening} onOpenChange={setIsOpening}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Start Duty Shift</DialogTitle>
                        <DialogDescription>
                            Enter your opening cash balance to begin your work session.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Opening Cash in Drawer (₦)</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={cash}
                                onChange={(e) => setCash(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Record the starting balance in your cash drawer.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpening(false)}>Cancel</Button>
                        <Button onClick={handleStart}>Begin Shift</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* End Shift Modal */}
            <Dialog open={isClosing} onOpenChange={setIsClosing}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Close Duty Shift</DialogTitle>
                        <DialogDescription>
                            Reconcile your cash drawer and end your duty session.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2 space-y-4">
                        <div className="bg-muted/30 p-3 rounded-lg border space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <Wallet className="h-3 w-3" /> Opening Cash:
                                </span>
                                <span>₦{(activeShift?.opening_cash || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <ShoppingCart className="h-3 w-3" /> Cash Sales:
                                </span>
                                <span className="text-primary font-medium">₦{(activeShift?.expected_cash_total || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <CreditCard className="h-3 w-3" /> Expected POS:
                                </span>
                                <span>₦{(activeShift?.expected_pos_total || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <Landmark className="h-3 w-3" /> Expected Transfer:
                                </span>
                                <span>₦{(activeShift?.expected_transfer_total || 0).toLocaleString()}</span>
                            </div>
                            <Separator className="my-1" />
                            <div className="flex justify-between text-sm font-bold bg-primary/5 p-1 rounded">
                                <span>Total Expected in Drawer:</span>
                                <span>₦{((activeShift?.opening_cash || 0) + (activeShift?.expected_cash_total || 0)).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="actual-cash">Actual Cash Counted (₦)</Label>
                            <Input
                                id="actual-cash"
                                type="number"
                                placeholder="0.00"
                                value={cash}
                                onChange={(e) => setCash(e.target.value)}
                                className={Math.abs(variance) > 1000 ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                        </div>

                        {cash !== "" && (
                            <div className={`p-3 rounded-lg border flex items-center gap-3 ${variance === 0 ? "bg-green-50 border-green-200 text-green-800" :
                                variance > 0 ? "bg-blue-50 border-blue-200 text-blue-800" :
                                    "bg-red-50 border-red-200 text-red-800"
                                }`}>
                                {variance === 0 ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                <div className="flex-1">
                                    <p className="text-xs font-bold uppercase">Variance: ₦{variance.toLocaleString()}</p>
                                    <p className="text-[10px] opacity-90">
                                        {variance === 0 ? "Drawer matches system records exactly." :
                                            variance > 0 ? "Cash surplus detected in the drawer." :
                                                "Cash shortage detected. Please explain below."}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="closure-notes">Closure Notes / Variance Reason</Label>
                            <Textarea
                                id="closure-notes"
                                placeholder="Ex: Change kept in drawer, or reason for shortage..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="h-20"
                                required={Math.abs(variance) > 0}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsClosing(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleEnd}>End Shift & Reconcile</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
