import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface MFAStatus {
    enabled: boolean;
    factors: any[];
}

export const useMFA = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    /**
     * Check if MFA is enabled for the current user
     */
    const checkMFAStatus = useCallback(async (): Promise<MFAStatus> => {
        try {
            const { data, error } = await supabase.auth.mfa.listFactors();
            if (error) throw error;

            const totpFactor = data.totp.find(f => f.status === 'verified');

            return {
                enabled: !!totpFactor,
                factors: data.totp
            };
        } catch (error) {
            console.error('Error checking MFA status:', error);
            return { enabled: false, factors: [] };
        }
    }, []);

    /**
     * Start MFA enrollment
     * Returns the QR code and secret
     */
    const startEnrollment = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp'
            });

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error starting enrollment:', error);
            toast({
                title: 'Error',
                description: 'Failed to start MFA enrollment',
                variant: 'destructive',
            });
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Verify and activate the enrollment
     */
    const verifyEnrollment = async (factorId: string, code: string) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.mfa.challengeAndVerify({
                factorId,
                code
            });

            if (error) throw error;

            toast({
                title: 'MFA Enabled',
                description: 'Two-factor authentication has been successfully enabled.',
            });

            return true;
        } catch (error) {
            console.error('Error verifying enrollment:', error);
            toast({
                title: 'Verification Failed',
                description: 'Invalid code. Please try again.',
                variant: 'destructive',
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Disable MFA
     */
    const disableMFA = async (factorId: string) => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.mfa.unenroll({
                factorId
            });

            if (error) throw error;

            toast({
                title: 'MFA Disabled',
                description: 'Two-factor authentication has been disabled.',
            });

            return true;
        } catch (error) {
            console.error('Error disabling MFA:', error);
            toast({
                title: 'Error',
                description: 'Failed to disable MFA',
                variant: 'destructive',
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        checkMFAStatus,
        startEnrollment,
        verifyEnrollment,
        disableMFA
    };
};
