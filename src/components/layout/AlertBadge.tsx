
import { useState, useEffect } from "react";
import { Bell, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { format } from "date-fns";

const AlertBadge = () => {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [count, setCount] = useState(0);
    const { canAccessReports } = usePermissions();
    const navigate = useNavigate();

    useEffect(() => {
        if (!canAccessReports()) return;

        fetchAlerts();

        // Subscribe to real-time alerts
        const channel = supabase
            .channel('system_alerts_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'system_alerts'
            }, () => {
                fetchAlerts();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchAlerts = async () => {
        const { data, error } = await supabase
            .from('system_alerts' as any)
            .select('*')
            .eq('is_resolved', false)
            .order('created_at', { ascending: false })
            .limit(5);

        if (!error && data) {
            setAlerts(data);
            setCount(data.length); // Ideally we'd do a count query for the total, but 5 is fine for the dropdown
        }
    };

    if (!canAccessReports()) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-red-50 group">
                    <Bell className={`h-5 w-5 ${count > 0 ? "text-red-500 animate-pulse" : "text-muted-foreground"}`} />
                    {count > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white group-hover:bg-red-700">
                            {count}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 shadow-xl border-red-100">
                <DropdownMenuLabel className="p-4 bg-muted/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span>Recent System Alerts</span>
                    </div>
                    {count > 0 && <Badge variant="destructive" className="h-5 text-[10px]">{count} Pending</Badge>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="m-0" />
                <div className="max-h-[300px] overflow-y-auto">
                    {alerts.length === 0 ? (
                        <div className="p-8 text-center bg-muted/5">
                            <CheckCircle2 className="h-8 w-8 text-green-500/50 mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground italic">No unresolved alerts. Systems normal.</p>
                        </div>
                    ) : (
                        alerts.map((alert) => (
                            <DropdownMenuItem
                                key={alert.id}
                                className="p-4 flex flex-col items-start gap-1 cursor-pointer focus:bg-red-50/50 hover:bg-red-50/30 transition-colors border-b last:border-0"
                                onClick={() => navigate('/reconciliation')}
                            >
                                <div className="flex w-full justify-between items-start gap-2">
                                    <span className={`text-[10px] font-bold uppercase py-0.5 px-1.5 rounded ${alert.severity === 'high' ? "bg-red-100 text-red-700" :
                                        alert.severity === 'critical' ? "bg-black text-white" :
                                            "bg-amber-100 text-amber-700"
                                        }`}>
                                        {alert.severity}
                                    </span>
                                    <span className="text-[9px] text-muted-foreground">{format(new Date(alert.created_at), 'HH:mm • dd MMM')}</span>
                                </div>
                                <p className="text-xs font-semibold leading-tight mt-1">{alert.message}</p>
                                <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5 italic">
                                    {alert.details?.variance_reason ? `Reason: ${alert.details.variance_reason}` : "Click to view reconciliation details"}
                                </p>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
                <DropdownMenuSeparator className="m-0" />
                <Button
                    variant="ghost"
                    className="w-full h-10 rounded-t-none text-xs font-bold text-primary hover:bg-primary/5"
                    onClick={() => navigate('/cash-reconciliation')}
                >
                    View All Reconciliation Logs
                </Button>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

// Internal icon for the empty state
const CheckCircle2 = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

export default AlertBadge;
