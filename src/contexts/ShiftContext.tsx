
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getCurrentShift } from '@/utils/shiftUtils';

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
    actual_cash_counted?: number;
    notes?: string;
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
    const [activeShift, setActiveShift] = useState<StaffShift | null>(null);
    const [activeStaffShifts, setActiveStaffShifts] = useState<StaffShift[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'PHARMACIST';

    const fetchActiveShift = useCallback(async () => {
        if (!user) return;
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
            setActiveShift(data as any);
        } catch (error) {
            console.error('Error fetching active shift:', error);
        }
    }, [user]);

    const fetchAllActiveShifts = useCallback(async () => {
        if (!isAdmin) return;
        try {
            const { data, error } = await supabase
                .from('staff_shifts' as any)
                .select('*')
                .in('status', ['active', 'paused']);

            if (error) {
                console.error('[ShiftContext] Error fetching all shifts:', error);
                throw error;
            }
            setActiveStaffShifts(data || []);
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
            toast({ title: "Shift Started", description: `You are now on duty.` });
            return data;
        } catch (error: any) {
            console.error('Error starting shift:', error);
            toast({ title: "Error", description: error.message || "Could not start shift", variant: "destructive" });
        }
    };

    const pauseShift = async () => {
        if (!activeShift) return;
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
        await adminEndShift(activeShift.id, actualCash, activeShift.staff_id, activeShift.start_time, notes);
        setActiveShift(null);
    };

    const adminEndShift = async (shiftId: string, actualCash: number, staffId: string, startTime: string, notes?: string) => {
        try {
            const { data: salesData, error: salesError } = await supabase
                .from('sales')
                .select('total')
                .eq('cashier_id', staffId)
                .gte('created_at', startTime);

            if (salesError) {
                console.warn('[ShiftContext] Error calculating sales total:', salesError);
            }

            const salesTotal = (salesData || []).reduce((sum, s) => sum + Number(s.total), 0);

            const { error } = await supabase
                .from('staff_shifts' as any)
                .update({
                    status: 'closed',
                    end_time: new Date().toISOString(),
                    expected_sales_total: salesTotal,
                    actual_cash_counted: actualCash,
                    notes: notes
                })
                .eq('id', shiftId);

            if (error) throw error;
            await refreshShifts();
            toast({ title: "Shift Closed", description: "Shift record has been finalized." });
        } catch (error: any) {
            console.error('Error closing shift:', error);
            toast({ title: "Error", description: error.message || "Could not close shift", variant: "destructive" });
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
