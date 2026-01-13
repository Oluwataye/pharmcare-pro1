
import { useState } from "react";
import { useDataRetention, DataRetentionConfig } from "@/hooks/useDataRetention";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Play, RotateCcw, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const RetentionSettings = () => {
    const { configs, isLoading, updateConfig, runCleanup } = useDataRetention();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<{ days: number, active: boolean } | null>(null);

    const formatTableName = (name: string) => {
        return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const handleEdit = (config: DataRetentionConfig) => {
        setEditingId(config.id);
        setEditValues({ days: config.retention_days, active: config.is_active });
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditValues(null);
    };

    const handleSave = async (id: string) => {
        if (editValues) {
            await updateConfig(id, {
                retention_days: editValues.days,
                is_active: editValues.active
            });
            setEditingId(null);
            setEditValues(null);
        }
    };

    const handleRunCleanup = (tableName: string) => {
        runCleanup(tableName);
    };

    if (isLoading) {
        return <div className="text-center py-8">Loading retention policies...</div>;
    }

    if (configs.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Data Retention</CardTitle>
                    <CardDescription>No retention configurations found.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Data Retention Policies
                    </CardTitle>
                    <CardDescription>
                        Configure how long system data is kept before automatic deletion.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data Type</TableHead>
                                <TableHead>Retention Period (Days)</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Cleanup</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {configs.map((config) => (
                                <TableRow key={config.id}>
                                    <TableCell className="font-medium">
                                        {formatTableName(config.table_name)}
                                    </TableCell>
                                    <TableCell>
                                        {editingId === config.id && editValues ? (
                                            <Input
                                                type="number"
                                                className="w-24"
                                                value={editValues.days}
                                                onChange={(e) => setEditValues({ ...editValues, days: parseInt(e.target.value) || 0 })}
                                            />
                                        ) : (
                                            <span>{config.retention_days} days</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingId === config.id && editValues ? (
                                            <Switch
                                                checked={editValues.active}
                                                onCheckedChange={(checked) => setEditValues({ ...editValues, active: checked })}
                                            />
                                        ) : (
                                            <Badge variant={config.is_active ? "default" : "secondary"}>
                                                {config.is_active ? "Active" : "Paused"}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {config.last_cleanup_at ? new Date(config.last_cleanup_at).toLocaleDateString() : 'Never'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {editingId === config.id ? (
                                                <>
                                                    <Button size="sm" variant="ghost" onClick={handleCancel}>
                                                        Cancel
                                                    </Button>
                                                    <Button size="sm" onClick={() => handleSave(config.id)}>
                                                        <Save className="w-4 h-4 mr-1" /> Save
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button size="sm" variant="outline" onClick={() => handleRunCleanup(config.table_name)} title="Run cleanup now">
                                                        <Play className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => handleEdit(config)}>
                                                        Edit
                                                    </Button>
                                                </>
                                            )}

                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
