
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getCurrentShift } from "@/utils/shiftUtils";

export interface StaffShift {
    id: string;
    staff_id: string;
    staff_name: string;
    shift_type: string;
    status: 'active' | 'closed';
    start_time: string;
    end_time?: string;
    opening_cash: number;
    closing_cash?: number;
    expected_sales_total?: number;
    actual_cash_counted?: number;
}

export const useShift = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [activeShift, setActiveShift] = useState<StaffShift | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchActiveShift = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('staff_shifts' as any)
                .select('*')
                .eq('staff_id', user.id)
                .eq('status', 'active')
                .maybeSingle();

            if (error) throw error;
            setActiveShift(data as any);
        } catch (error) {
            console.error('Error fetching active shift:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchActiveShift();
    }, [fetchActiveShift]);

    const startShift = async (openingCash: number) => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('staff_shifts' as any)
                .insert({
                    staff_id: user.id,
                    staff_name: user.username || user.name || user.email,
                    staff_email: user.email,
                    shift_type: getCurrentShift(),
                    opening_cash: openingCash,
                    status: 'active'
                })
                .select()
                .single();

            if (error) throw error;
            setActiveShift(data as any);
            toast({ title: "Shift Started", description: `You are now on duty (${getCurrentShift()})` });
            return data;
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const endShift = async (actualCash: number, notes?: string) => {
        if (!activeShift) return;

        try {
            // Calculate expected sales for this shift
            const { data: salesData } = await supabase
                .from('sales')
                .select('total')
                .eq('cashier_id', user?.id)
                .gte('created_at', activeShift.start_time);

            const salesTotal = (salesData || []).reduce((sum, s) => sum + Number(s.total), 0);

            const { error } = await supabase
                .from('staff_shifts' as any)
                .update({
                    status: 'closed',
                    end_time: new Date().toISOString(),
                    expected_sales_total: salesTotal,
                    actual_cash_counted: actualCash,
                    notes
                })
                .eq('id', activeShift.id);

            if (error) throw error;
            setActiveShift(null);
            toast({ title: "Shift Closed", description: "Your duty session has ended." });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    return { activeShift, isLoading, startShift, endShift, refreshActiveShift: fetchActiveShift };
};
