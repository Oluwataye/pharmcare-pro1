import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { NotificationService } from '@/services/NotificationService';
import { useToast } from '@/hooks/use-toast';
import { Bell, ShieldAlert, AlertTriangle, Save } from 'lucide-react';

export const NotificationSettings = () => {
    const { settings, loading, refetch } = useStoreSettings();
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);

    // Local state for form
    const [lowStockThreshold, setLowStockThreshold] = useState(10);
    const [enableLowStock, setEnableLowStock] = useState(true);
    const [enableBackup, setEnableBackup] = useState(true);

    useEffect(() => {
        if (settings) {
            setLowStockThreshold(settings.low_stock_threshold_global ?? 10);
            setEnableLowStock(settings.enable_low_stock_alerts ?? true);
            setEnableBackup(settings.enable_backup_alerts ?? true);
        }
    }, [settings]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await NotificationService.updateSettings({
                low_stock_threshold_global: lowStockThreshold,
                enable_low_stock_alerts: enableLowStock,
                enable_backup_alerts: enableBackup
            });

            await refetch();

            toast({
                title: "Settings Saved",
                description: "Notification preferences have been updated.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save notification settings.",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-4">Loading settings...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Real-Time Alerts
                </CardTitle>
                <CardDescription>
                    Configure push notifications for critical system events.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Low Stock Alerts */}
                <div className="flex items-start justify-between space-x-4 border-p p-4 rounded-lg bg-muted/20">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <Label className="text-base font-medium">Low Stock Alerts</Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Receive notifications when product inventory drops below the threshold.
                        </p>
                    </div>
                    <Switch
                        checked={enableLowStock}
                        onCheckedChange={setEnableLowStock}
                    />
                </div>

                {/* Threshold Input - Only show if enabled */}
                {enableLowStock && (
                    <div className="ml-6 space-y-2">
                        <Label htmlFor="threshold">Global Low Stock Threshold</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="threshold"
                                type="number"
                                min="1"
                                value={lowStockThreshold}
                                onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
                                className="w-24"
                            />
                            <span className="text-sm text-muted-foreground">units</span>
                        </div>
                    </div>
                )}

                {/* Backup Alerts */}
                <div className="flex items-start justify-between space-x-4 border-p p-4 rounded-lg bg-muted/20">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-red-500" />
                            <Label className="text-base font-medium">Backup Failure Alerts</Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Get notified immediately if an automated database backup fails.
                        </p>
                    </div>
                    <Switch
                        checked={enableBackup}
                        onCheckedChange={setEnableBackup}
                    />
                </div>

                <div className="pt-4 flex justify-end">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Preferences
                            </>
                        )}
                    </Button>
                </div>

            </CardContent>
        </Card>
    );
};
