import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeftRight, Check, Server, User } from 'lucide-react';
import { useOffline, SyncConflict } from '@/contexts/OfflineContext';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export const ConflictResolutionDialog = () => {
    const { user } = useAuth();
    const { conflicts, resolveConflict } = useOffline();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [resolving, setResolving] = useState(false);

    const activeConflict = conflicts[currentIndex];

    // Only allow Admins and Pharmacists to resolve conflicts
    const canResolve = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'PHARMACIST';

    if (conflicts.length === 0) return null;

    const handleResolve = async (resolution: 'local' | 'server' | 'merge') => {
        if (!activeConflict) return;
        setResolving(true);
        try {
            await resolveConflict(activeConflict.id, resolution);
            // Index management handled by conflicts array shrinking
            if (currentIndex >= conflicts.length - 1) {
                setCurrentIndex(0);
            }
        } finally {
            setResolving(false);
        }
    };

    const renderDataDiff = (local: any, server: any) => {
        const allKeys = Array.from(new Set([...Object.keys(local || {}), ...Object.keys(server || {})]));

        return (
            <div className="max-h-[300px] overflow-y-auto border rounded-md">
                <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                        <tr>
                            <th className="p-2 text-left">Field</th>
                            <th className="p-2 text-left">Local (Yours)</th>
                            <th className="p-2 text-left">Server (Latest)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allKeys.map(key => {
                            if (key === 'updated_at' || key === 'id') return null;
                            const isDifferent = JSON.stringify(local?.[key]) !== JSON.stringify(server?.[key]);
                            return (
                                <tr key={key} className={isDifferent ? "bg-amber-50 dark:bg-amber-950/20" : ""}>
                                    <td className="p-2 font-medium border-b">{key}</td>
                                    <td className={`p-2 border-b ${isDifferent ? "text-amber-600 font-bold" : ""}`}>
                                        {String(local?.[key] ?? '-')}
                                    </td>
                                    <td className={`p-2 border-b ${isDifferent ? "text-blue-600 font-bold" : ""}`}>
                                        {String(server?.[key] ?? '-')}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <Dialog open={conflicts.length > 0}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <AlertCircle className="h-5 w-5" />
                        Sync Conflict Detected ({currentIndex + 1} of {conflicts.length})
                    </DialogTitle>
                    <DialogDescription>
                        Someone else modified this {activeConflict?.operation.resource} record while you were offline.
                        Please choose which version to keep.
                    </DialogDescription>
                </DialogHeader>

                {activeConflict && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs text-muted-foreground bg-muted p-2 rounded">
                            <span>Resource: <strong className="uppercase">{activeConflict.operation.resource}</strong></span>
                            <span>ID: {activeConflict.id}</span>
                            <span>Modified: {format(activeConflict.operation.timestamp, 'Pp')}</span>
                        </div>

                        {renderDataDiff(activeConflict.operation.data, activeConflict.serverVersion)}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <h4 className="flex items-center gap-2 text-sm font-bold">
                                    <User className="h-4 w-4" />
                                    Local Version
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Include the changes you made while offline.
                                </p>
                                <Button
                                    variant="outline"
                                    className="w-full border-amber-200 hover:bg-amber-50"
                                    onClick={() => handleResolve('local')}
                                    disabled={resolving}
                                >
                                    Keep My Version
                                </Button>
                            </div>
                            <div className="space-y-2">
                                <h4 className="flex items-center gap-2 text-sm font-bold">
                                    <Server className="h-4 w-4" />
                                    Server Version
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Discard your changes and take the latest data from the cloud.
                                </p>
                                <Button
                                    variant="outline"
                                    className="w-full border-blue-200 hover:bg-blue-50"
                                    onClick={() => handleResolve('server')}
                                    disabled={resolving || !canResolve}
                                >
                                    Keep Cloud Version
                                </Button>
                            </div>
                        </div>

                        {!canResolve && (
                            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                You do not have permission to resolve data conflicts. Please contact an Administrator.
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="sm:justify-start">
                    <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                        <ArrowLeftRight className="h-3 w-3" />
                        Differences are highlighted in amber.
                    </p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
