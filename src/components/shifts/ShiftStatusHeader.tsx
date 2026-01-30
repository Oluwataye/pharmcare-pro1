
import { Button } from "@/components/ui/button";
import { useShift } from "@/hooks/useShift";
import { Badge } from "@/components/ui/badge";
import { Clock, Lock, LogIn } from "lucide-react";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const ShiftStatusHeader = () => {
    const { activeShift, startShift, endShift, isLoading } = useShift();
    const [isOpening, setIsOpening] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [cash, setCash] = useState("");

    const handleStart = async () => {
        await startShift(parseFloat(cash) || 0);
        setIsOpening(false);
        setCash("");
    };

    const handleEnd = async () => {
        await endShift(parseFloat(cash) || 0);
        setIsClosing(false);
        setCash("");
    };

    if (isLoading) return null;

    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg border">
            {activeShift ? (
                <>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-medium uppercase truncate">Active Duty</span>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {activeShift.shift_type}
                            </Badge>
                            <span className="text-xs font-mono">
                                {new Date(activeShift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsClosing(true)} className="h-8 text-destructive hover:text-destructive">
                        <Lock className="h-4 w-4 mr-1" />
                        End Shift
                    </Button>
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
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Actual Cash Counted (₦)</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={cash}
                                onChange={(e) => setCash(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Enter the physical cash remaining in the drawer.</p>
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
