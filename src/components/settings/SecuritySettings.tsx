import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ShieldCheck, ShieldAlert, Lock, Smartphone } from 'lucide-react';
import { useMFA } from '@/hooks/useMFA';
import { MFAEnrollment } from '@/components/auth/MFAEnrollment';
import { useAuth } from '@/contexts/AuthContext';

export const SecuritySettings = () => {
    const { checkMFAStatus, disableMFA } = useMFA();
    const { user } = useAuth();
    const [isMFAEnabled, setIsMFAEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showEnrollment, setShowEnrollment] = useState(false);
    const [factorId, setFactorId] = useState<string | null>(null);

    const loadStatus = async () => {
        setIsLoading(true);
        const status = await checkMFAStatus();
        setIsMFAEnabled(status.enabled);
        if (status.factors && status.factors.length > 0) {
            setFactorId(status.factors[0].id);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadStatus();
    }, []);

    const handleEnrollmentComplete = () => {
        setShowEnrollment(false);
        loadStatus();
    };

    const handleDisable = async () => {
        if (factorId && confirm('Are you sure you want to disable 2FA? Your account will be less secure.')) {
            const success = await disableMFA(factorId);
            if (success) {
                loadStatus();
            }
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    Account Security
                </CardTitle>
                <CardDescription>
                    Manage your account security and two-factor authentication settings.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-start justify-between border rounded-lg p-4">
                    <div className="flex gap-4">
                        <div className={`p-2 rounded-full ${isMFAEnabled ? 'bg-green-100' : 'bg-red-100'}`}>
                            {isMFAEnabled ? (
                                <ShieldCheck className="h-6 w-6 text-green-600" />
                            ) : (
                                <ShieldAlert className="h-6 w-6 text-red-600" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-medium text-lg flex items-center gap-2">
                                Two-Factor Authentication (2FA)
                                <Badge variant={isMFAEnabled ? 'default' : 'destructive'}>
                                    {isMFAEnabled ? 'Enabled' : 'Disabled'}
                                </Badge>
                            </h3>
                            <p className="text-muted-foreground text-sm mt-1">
                                {isMFAEnabled
                                    ? 'Your account is protected with an extra layer of security.'
                                    : 'Protect your account by requiring a code from your phone in addition to your password.'}
                            </p>
                        </div>
                    </div>
                    <div>
                        {isMFAEnabled ? (
                            <Button variant="outline" onClick={handleDisable} disabled={isLoading}>
                                Disable 2FA
                            </Button>
                        ) : (
                            <Button onClick={() => setShowEnrollment(true)} disabled={isLoading}>
                                Setup 2FA
                            </Button>
                        )}
                    </div>
                </div>

                {isMFAEnabled && (
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="border rounded-lg p-4 flex items-center gap-3">
                            <Smartphone className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Authenticator App</p>
                                <p className="text-sm text-muted-foreground">Google Authenticator, Authy, etc.</p>
                            </div>
                            <Badge variant="outline" className="ml-auto">Active</Badge>
                        </div>
                    </div>
                )}

                {/* Enrollment Dialog */}
                <Dialog open={showEnrollment} onOpenChange={setShowEnrollment}>
                    <DialogContent className="sm:max-w-md p-0">
                        <MFAEnrollment
                            onComplete={handleEnrollmentComplete}
                            onCancel={() => setShowEnrollment(false)}
                        />
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
};
