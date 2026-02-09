
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getCurrentShift } from '@/utils/shiftUtils';
import { useOffline } from './OfflineContext';

export interface StaffShift {
    id: string;
    staff_id: string;
    staff_name: string;
    staff_email?: string;
    shift_type: string;
    status: 'active' | 'paused' | 'closed';
    start_time: string;
    end_time?: string;
    opening_cash: number;
    closing_cash?: number;
    expected_sales_total?: number;
    expected_cash_total?: number;
    expected_pos_total: number;
    expected_transfer_total: number;
    actual_cash_counted?: number;
    notes?: string;
    variance_reason?: string;
    closure_status?: 'open' | 'closed';
    created_at: string;
}

interface ShiftContextType {
    activeShift: StaffShift | null;
    isLoading: boolean;
    activeStaffShifts: StaffShift[]; // For Admins to see others
    startShift: (openingCash: number) => Promise<any>;
    pauseShift: () => Promise<void>;
    resumeShift: () => Promise<void>;
    endShift: (actualCash: number, notes?: string) => Promise<void>;
    adminPauseShift: (shiftId: string) => Promise<void>;
    adminResumeShift: (shiftId: string) => Promise<void>;
    adminEndShift: (shiftId: string, actualCash: number, staffId: string, startTime: string, notes?: string) => Promise<void>;
    refreshShifts: () => Promise<void>;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export const ShiftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const { isOnline, addPendingOperation } = useOffline();
    const [activeShift, setActiveShift] = useState<StaffShift | null>(() => {
        // Hydrate from localStorage for offline stability
        const cached = localStorage.getItem('active_staff_shift');
        return cached ? JSON.parse(cached) : null;
    });
    const [activeStaffShifts, setActiveStaffShifts] = useState<StaffShift[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

    const fetchActiveShift = useCallback(async () => {
        if (!user) return;
        if (!window.navigator.onLine) {
            console.log('[ShiftContext] System is offline, using cached active shift.');
            return;
        }
        try {
            const { data, error } = await supabase
                .from('staff_shifts' as any)
                .select('*')
                .eq('staff_id', user.id)
                .in('status', ['active', 'paused'])
                .maybeSingle();

            if (error) {
                console.error('[ShiftContext] Error fetching active shift:', error);
                throw error;
            }

            if (data) {
                console.log('[ShiftContext] Active shift found, caching...');
                setActiveShift(data as any);
                localStorage.setItem('active_staff_shift', JSON.stringify(data));
            } else {
                console.log('[ShiftContext] No active shift found, clearing cache.');
                setActiveShift(null);
                localStorage.removeItem('active_staff_shift');
            }
        } catch (error) {
            console.error('Error fetching active shift:', error);
        }
    }, [user]);

    const fetchAllActiveShifts = useCallback(async () => {
        if (!isAdmin || !window.navigator.onLine) return;
        try {
            const { data, error } = await supabase
                .from('staff_shifts' as any)
                .select('*')
                .in('status', ['active', 'paused']);

            if (error) {
                console.error('[ShiftContext] Error fetching all shifts:', error);
                throw error;
            }
            setActiveStaffShifts(data as any || []);
        } catch (error) {
            console.error('Error fetching all active shifts:', error);
        }
    }, [isAdmin]);

    const refreshShifts = useCallback(async () => {
        setIsLoading(true);
        try {
            await Promise.all([fetchActiveShift(), fetchAllActiveShifts()]);
        } finally {
            setIsLoading(false);
        }
    }, [fetchActiveShift, fetchAllActiveShifts]);

    useEffect(() => {
        if (user) {
            refreshShifts();
        }
    }, [user, refreshShifts]);

    const startShift = async (openingCash: number) => {
        if (!user) return;

        if (!isOnline) {
            const tempId = crypto.randomUUID();
            const offlineShift: StaffShift = {
                id: tempId,
                staff_id: user.id,
                staff_name: user.name || user.username || user.email,
                staff_email: user.email,
                shift_type: getCurrentShift(),
                opening_cash: openingCash,
                status: 'active',
                start_time: new Date().toISOString()
            };

            console.log('[ShiftContext] Starting shift offline...');
            setActiveShift(offlineShift);
            localStorage.setItem('active_staff_shift', JSON.stringify(offlineShift));

            addPendingOperation({
                id: crypto.randomUUID(), // Create needs a unique op ID
                type: 'create',
                resource: 'staff_shifts',
                data: offlineShift,
                timestamp: Date.now()
            });

            toast({ title: "Shift Started (Offline)", description: "Welcome! Your shift has started locally." });
            return offlineShift;
        }

        try {
            const { data, error } = await supabase
                .from('staff_shifts' as any)
                .insert({
                    staff_id: user.id,
                    staff_name: user.name || user.username || user.email,
                    staff_email: user.email,
                    shift_type: getCurrentShift(),
                    opening_cash: openingCash,
                    status: 'active'
                })
                .select()
                .single();

            if (error) throw error;
            setActiveShift(data as any);
            localStorage.setItem('active_staff_shift', JSON.stringify(data));
            toast({ title: "Shift Started", description: `You are now on duty.` });
            return data;
        } catch (error: any) {
            console.error('Error starting shift:', error);
            toast({ title: "Error", description: error.message || "Could not start shift", variant: "destructive" });
        }
    };

    const pauseShift = async () => {
        if (!activeShift) return;

        const updatedShift = { ...activeShift, status: 'paused' as const };

        if (!isOnline) {
            console.log('[ShiftContext] Pausing shift offline...');
            setActiveShift(updatedShift);
            localStorage.setItem('active_staff_shift', JSON.stringify(updatedShift));

            addPendingOperation({
                id: updatedShift.id, // Use shift ID for the operation so .eq('id', op.id) works
                type: 'update',
                resource: 'staff_shifts',
                data: { status: 'paused' },
                timestamp: Date.now(),
                snapshot: activeShift // Snapshot of current active shift
            });

            toast({
                title: "Shift Paused (Offline)",
                description: "Your status has been updated locally and will sync when online."
            });
            return;
        }

        try {
            const { error } = await supabase
                .from('staff_shifts' as any)
                .update({ status: 'paused' })
                .eq('id', activeShift.id);
            if (error) throw error;
            await fetchActiveShift();
            toast({ title: "Shift Paused", description: "Your status is now set to Paused." });
        } catch (error: any) {
            console.error('Error pausing shift:', error);
            toast({ title: "Error", description: error.message || "Could not pause shift", variant: "destructive" });
        }
    };

    const resumeShift = async () => {
        if (!activeShift) return;

        const updatedShift = { ...activeShift, status: 'active' as const };

        if (!isOnline) {
            console.log('[ShiftContext] Resuming shift offline...');
            setActiveShift(updatedShift);
            localStorage.setItem('active_staff_shift', JSON.stringify(updatedShift));

            addPendingOperation({
                id: updatedShift.id,
                type: 'update',
                resource: 'staff_shifts',
                data: { status: 'active' },
                timestamp: Date.now(),
                snapshot: activeShift
            });

            toast({
                title: "Shift Resumed (Offline)",
                description: "Welcome back! Status updated locally."
            });
            return;
        }

        try {
            const { error } = await supabase
                .from('staff_shifts' as any)
                .update({ status: 'active' })
                .eq('id', activeShift.id);
            if (error) throw error;
            await fetchActiveShift();
            toast({ title: "Shift Resumed", description: "Welcome back!" });
        } catch (error: any) {
            console.error('Error resuming shift:', error);
            toast({ title: "Error", description: error.message || "Could not resume shift", variant: "destructive" });
        }
    };

    const adminPauseShift = async (shiftId: string) => {
        if (!isOnline) {
            setActiveStaffShifts(prev => prev.map(s =>
                s.id === shiftId ? { ...s, status: 'paused' as const } : s
            ));

            addPendingOperation({
                id: shiftId,
                type: 'update',
                resource: 'staff_shifts',
                data: { status: 'paused' },
                timestamp: Date.now(),
                snapshot: activeStaffShifts.find(s => s.id === shiftId)
            });

            toast({ title: "Shift Paused (Offline)", description: "Remote change queued." });
            return;
        }
        try {
            const { error } = await supabase
                .from('staff_shifts' as any)
                .update({ status: 'paused' })
                .eq('id', shiftId);
            if (error) throw error;
            await refreshShifts();
            toast({ title: "Shift Paused", description: "Remote staff shift has been paused." });
        } catch (error: any) {
            console.error('Error admin pausing shift:', error);
            toast({ title: "Error", description: error.message || "Could not pause shift", variant: "destructive" });
        }
    };

    const adminResumeShift = async (shiftId: string) => {
        if (!isOnline) {
            setActiveStaffShifts(prev => prev.map(s =>
                s.id === shiftId ? { ...s, status: 'active' as const } : s
            ));

            addPendingOperation({
                id: shiftId,
                type: 'update',
                resource: 'staff_shifts',
                data: { status: 'active' },
                timestamp: Date.now(),
                snapshot: activeStaffShifts.find(s => s.id === shiftId)
            });

            toast({ title: "Shift Resumed (Offline)", description: "Remote change queued." });
            return;
        }
        try {
            const { error } = await supabase
                .from('staff_shifts' as any)
                .update({ status: 'active' })
                .eq('id', shiftId);
            if (error) throw error;
            await refreshShifts();
            toast({ title: "Shift Resumed", description: "Remote staff shift has been resumed." });
        } catch (error: any) {
            console.error('Error admin resuming shift:', error);
            toast({ title: "Error", description: error.message || "Could not resume shift", variant: "destructive" });
        }
    };

    const endShift = async (actualCash: number, notes?: string) => {
        if (!activeShift) return;
        const shiftId = activeShift.id;

        if (!isOnline) {
            console.log('[ShiftContext] Ending shift offline...');

            addPendingOperation({
                id: shiftId,
                type: 'update',
                resource: 'staff_shifts',
                data: {
                    id: shiftId,
                    status: 'closed',
                    end_time: new Date().toISOString(),
                    actual_cash_counted: actualCash,
                    notes: notes,
                    expected_sales_total: 0 // Placeholder for offline closure
                },
                timestamp: Date.now(),
                snapshot: activeShift
            });

            setActiveShift(null);
            localStorage.removeItem('active_staff_shift');
            toast({ title: "Shift Ended (Offline)", description: "Record queued for sync. Reconciliation pending." });
            return;
        }

        await adminEndShift(shiftId, actualCash, activeShift.staff_id, activeShift.start_time, notes, notes); // Using notes as variance reason for now
        setActiveShift(null);
        localStorage.removeItem('active_staff_shift');
    };

    const adminEndShift = async (shiftId: string, actualCash: number, staffId: string, startTime: string, notes?: string, varianceReason?: string) => {
        if (!isOnline) {
            setActiveStaffShifts(prev => prev.filter(s => s.id !== shiftId));

            addPendingOperation({
                id: shiftId,
                type: 'update',
                resource: 'staff_shifts',
                data: {
                    id: shiftId,
                    status: 'closed',
                    end_time: new Date().toISOString(),
                    actual_cash_counted: actualCash,
                    notes: notes
                },
                timestamp: Date.now(),
                snapshot: activeStaffShifts.find(s => s.id === shiftId)
            });
            toast({ title: "Shift Force Ended (Offline)", description: "Record queued." });
            return;
        }

        try {
            // STRICT RECONCILIATION V2: Use shift_id for exact linkage
            // Fallback to time-window only if shift_id yields no results (legacy compatibility)
            console.log('[ShiftContext] Reconciling shift:', shiftId);

            let { data: salesData, error: salesError } = await supabase
                .from('sales')
                .select('total, payment_methods, shift_id')
                .eq('shift_id', shiftId);

            if (salesError) {
                console.warn('[ShiftContext] Error querying by shift_id:', salesError);
            }

            // Fallback: If no sales found by ID, try legacy time-based query 
            // (Only if shift start time is available)
            if ((!salesData || salesData.length === 0) && startTime) {
                console.warn('[ShiftContext] No sales found by shift_id. Attempting legacy time-based reconciliation...');
                const { data: legacyData, error: legacyError } = await supabase
                    .from('sales')
                    .select('total, payment_methods')
                    .eq('cashier_id', staffId)
                    .gte('created_at', startTime)
                    // Add upper bound to prevent bleeding into future shifts
                    .lte('created_at', new Date().toISOString());

                if (!legacyError && legacyData) {
                    salesData = legacyData;
                }
            }

            const salesTotal = (salesData as any || []).reduce((sum: number, s: any) => sum + Number(s.total), 0);

            let expectedCash = 0;
            let expectedPos = 0;
            let expectedTransfer = 0;

            (salesData || []).forEach(sale => {
                const payments = (sale as any).payment_methods;
                if (Array.isArray(payments)) {
                    payments.forEach((p: any) => {
                        if (p.mode === 'cash') expectedCash += Number(p.amount);
                        else if (p.mode === 'pos') expectedPos += Number(p.amount);
                        else if (p.mode === 'transfer') expectedTransfer += Number(p.amount);
                    });
                } else {
                    // Fallback for sales without detailed payment info (assume cash)
                    expectedCash += Number(sale.total);
                }
            });

            const { error } = await supabase
                .from('staff_shifts' as any)
                .update({
                    status: 'closed',
                    end_time: new Date().toISOString(),
                    expected_sales_total: salesTotal,
                    expected_cash_total: expectedCash,
                    expected_pos_total: expectedPos,
                    expected_transfer_total: expectedTransfer,
                    actual_cash_counted: actualCash,
                    notes: notes
                })
                .eq('id', shiftId);

            if (error) throw error;

            // Trigger Financial Alert if variance is significant
            const variance = actualCash - expectedCash;
            if (Math.abs(variance) > 1000 || variance < 0) {
                await supabase.from('system_alerts').insert({
                    type: 'variance',
                    severity: Math.abs(variance) > 5000 ? 'high' : 'medium',
                    message: `Cash variance of ₦${variance.toLocaleString()} detected for shift ${shiftId}`,
                    details: {
                        expected: expectedCash,
                        actual: actualCash,
                        variance: variance,
                        staff_id: staffId,
                        notes,
                        variance_reason: varianceReason
                    },
                    staff_id: staffId,
                    shift_id: shiftId
                });
            }

            await refreshShifts();
            toast({
                title: variance === 0 ? "Shift Closed" : "Shift Reconciled",
                description: variance === 0 ? "Shift record finalized with zero variance." : `Shift finalized with ₦${variance.toLocaleString()} variance.`,
                variant: Math.abs(variance) > 1000 ? "destructive" : "default"
            });
        } catch (error: any) {
            console.error('Error closing shift:', error);
            if (window.navigator.onLine) {
                toast({ title: "Error", description: error.message || "Could not close shift", variant: "destructive" });
            }
        }
    };

    return (
        <ShiftContext.Provider value={{
            activeShift,
            isLoading,
            activeStaffShifts,
            startShift,
            pauseShift,
            resumeShift,
            endShift,
            adminPauseShift,
            adminResumeShift,
            adminEndShift,
            refreshShifts
        }}>
            {children}
        </ShiftContext.Provider>
    );
};

export const useShiftContext = () => {
    const context = useContext(ShiftContext);
    if (context === undefined) {
        throw new Error('useShiftContext must be used within a ShiftProvider');
    }
    return context;
};
