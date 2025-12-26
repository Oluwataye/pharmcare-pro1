import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Refund, RefundRequest, RefundApproval } from '@/types/refund';

export const useRefund = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [refunds, setRefunds] = useState<Refund[]>([]);

    // Fetch all refunds (filtered by role)
    const fetchRefunds = async (status?: 'pending' | 'approved' | 'rejected') => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('refunds')
                .select('*')
                .order('created_at', { ascending: false });

            if (status) {
                query = query.eq('status', status);
            }

            const { data, error } = await query;

            if (error) throw error;

            setRefunds((data as Refund[]) || []);
            return data as Refund[];
        } catch (error) {
            console.error('Error fetching refunds:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch refunds',
                variant: 'destructive',
            });
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    // Initiate a refund (Cashier action)
    const initiateRefund = async (request: RefundRequest): Promise<boolean> => {
        if (!user) {
            toast({
                title: 'Error',
                description: 'You must be logged in to initiate a refund',
                variant: 'destructive',
            });
            return false;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('refunds')
                .insert({
                    ...request,
                    initiated_by: user.id,
                    initiated_by_name: user.username || user.name || user.email,
                    status: 'pending',
                })
                .select()
                .single();

            if (error) throw error;

            toast({
                title: 'Refund Requested',
                description: 'Your refund request has been submitted for admin approval',
            });

            // Refresh refunds list
            await fetchRefunds();

            return true;
        } catch (error) {
            console.error('Error initiating refund:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to initiate refund',
                variant: 'destructive',
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // Approve or reject a refund (Admin action)
    const processRefund = async (approval: RefundApproval): Promise<boolean> => {
        if (!user) {
            toast({
                title: 'Error',
                description: 'You must be logged in to process refunds',
                variant: 'destructive',
            });
            return false;
        }

        setIsLoading(true);
        try {
            const updateData: any = {
                status: approval.action === 'approve' ? 'approved' : 'rejected',
                approved_by: user.id,
                approved_by_name: user.username || user.name || user.email,
                approved_at: new Date().toISOString(),
            };

            if (approval.action === 'reject' && approval.rejection_reason) {
                updateData.rejection_reason = approval.rejection_reason;
            }

            const { error } = await supabase
                .from('refunds')
                .update(updateData)
                .eq('id', approval.refund_id);

            if (error) throw error;

            toast({
                title: approval.action === 'approve' ? 'Refund Approved' : 'Refund Rejected',
                description: `The refund has been ${approval.action}d successfully`,
            });

            // Refresh refunds list
            await fetchRefunds();

            return true;
        } catch (error) {
            console.error('Error processing refund:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to process refund',
                variant: 'destructive',
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // Check if a sale already has a refund
    const checkRefundExists = async (saleId: string): Promise<boolean> => {
        try {
            const { data, error } = await supabase
                .from('refunds')
                .select('id')
                .eq('sale_id', saleId)
                .in('status', ['pending', 'approved'])
                .limit(1);

            if (error) throw error;

            return (data && data.length > 0) || false;
        } catch (error) {
            console.error('Error checking refund:', error);
            return false;
        }
    };

    return {
        refunds,
        isLoading,
        fetchRefunds,
        initiateRefund,
        processRefund,
        checkRefundExists,
    };
};
