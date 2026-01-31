import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Database, AlertTriangle, FileJson, Trash2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const DataManagement = () => {
    const { toast } = useToast();
    const { settings, refetch } = useStoreSettings();
    const [isExporting, setIsExporting] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);

    const handleExportData = async () => {
        setIsExporting(true);
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const tables = ['inventory', 'inventory_batches', 'sales', 'sales_items', 'stock_movements', 'profiles', 'store_settings', 'suppliers'];
            const backupData: Record<string, any> = {};

            // Fetch data from all tables
            for (const table of tables) {
                const { data, error } = await supabase.from(table as any).select('*');
                if (error) throw error;
                backupData[table] = data;
            }

            backupData['meta'] = {
                version: '1.0',
                created_at: new Date().toISOString(),
                export_type: 'full_backup'
            };

            // Create blob and download
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pharmcare_backup_${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({
                title: "Backup Complete",
                description: `Successfully exported ${tables.length} tables.`,
            });
        } catch (error: any) {
            console.error('Backup failed:', error);
            toast({
                title: "Backup Failed",
                description: error.message || "Could not export data",
                variant: "destructive"
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Data Management & Backup
                </CardTitle>
                <CardDescription>
                    Manage your pharmacy data, create backups, and prevent data loss.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Important</AlertTitle>
                    <AlertDescription>
                        Regular backups are essential for offline deployments.
                        We recommend downloading a backup at the end of every business day.
                    </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <Download className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Export Data</h3>
                                <p className="text-sm text-muted-foreground">Download a full JSON backup of your database.</p>
                            </div>
                        </div>
                        <Button
                            onClick={handleExportData}
                            disabled={isExporting}
                            className="w-full"
                        >
                            {isExporting ? "Creating Backup..." : "Download Backup Now"}
                        </Button>
                    </div>

                    <div className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-secondary/10 rounded-full">
                                <Upload className="h-5 w-5 text-secondary-foreground" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Cloud Backup</h3>
                                <p className="text-sm text-muted-foreground">Trigger an immediate server-side backup to the cloud.</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={async () => {
                                setIsExporting(true);
                                try {
                                    const { data, error } = await supabase.functions.invoke('backup-db');
                                    if (error) throw error;
                                    toast({
                                        title: "Backup Started",
                                        description: "Server-side backup initiated successfully.",
                                    });
                                } catch (error: any) {
                                    toast({
                                        title: "Backup Failed",
                                        description: error.message,
                                        variant: "destructive"
                                    });
                                } finally {
                                    setIsExporting(false);
                                }
                            }}
                            disabled={isExporting}
                        >
                            Trigger Cloud Backup
                        </Button>
                    </div>
                </div>

                <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-full">
                            <Calendar className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold">Backup Retention Policy</h3>
                            <p className="text-sm text-muted-foreground">Automatically delete old cloud backups to save storage.</p>
                        </div>
                        <div className="w-[180px]">
                            <Select
                                value={String(settings?.backup_retention_days ?? 30)}
                                onValueChange={async (val) => {
                                    try {
                                        const { error } = await supabase
                                            .from('store_settings')
                                            .update({ backup_retention_days: parseInt(val) } as any)
                                            .eq('id', 1);
                                        if (error) throw error;
                                        await refetch();
                                        toast({ title: "Policy Updated", description: `Backups will now be kept for ${val} days.` });
                                    } catch (err) {
                                        toast({ title: "Update Failed", variant: "destructive", description: "Could not save retention policy." });
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">7 Days</SelectItem>
                                    <SelectItem value="14">14 Days</SelectItem>
                                    <SelectItem value="30">30 Days</SelectItem>
                                    <SelectItem value="60">60 Days</SelectItem>
                                    <SelectItem value="90">90 Days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                        <span>Current retention: <strong>{settings?.backup_retention_days ?? 30} days</strong></span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={async () => {
                                setIsCleaning(true);
                                try {
                                    const { data, error } = await supabase.functions.invoke('cleanup-backups');
                                    if (error) throw error;
                                    toast({
                                        title: "Cleanup Complete",
                                        description: `Successfully removed ${data.deletedCount} old backup files.`
                                    });
                                } catch (err: any) {
                                    toast({ title: "Cleanup Failed", variant: "destructive", description: err.message });
                                } finally {
                                    setIsCleaning(false);
                                }
                            }}
                            disabled={isCleaning}
                        >
                            <Trash2 className="h-3 w-3 mr-2" />
                            {isCleaning ? "Cleaning..." : "Run Cleanup Now"}
                        </Button>
                    </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <FileJson className="h-4 w-4" />
                        Automated Backup Strategy
                    </h3>
                    <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                        <li>This web application stores data in the Supabase Database.</li>
                        <li><strong>Cloud Mode:</strong> Backups are managed automatically by the platform.</li>
                        <li><strong>Offline Mode:</strong> Use the "Download Backup" button daily.</li>
                        <li>For automated local backups, ask your IT admin to schedule the <code>backup-script</code> execution.</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
};
