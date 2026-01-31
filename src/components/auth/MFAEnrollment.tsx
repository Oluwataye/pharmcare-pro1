import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMFA } from '@/hooks/useMFA';
import { Loader2, Copy, CheckCircle, ShieldDefault } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MFAEnrollmentProps {
    onComplete: () => void;
    onCancel: () => void;
}

export const MFAEnrollment = ({ onComplete, onCancel }: MFAEnrollmentProps) => {
    const { startEnrollment, verifyEnrollment, isLoading } = useMFA();
    const { toast } = useToast();

    const [step, setStep] = useState<'init' | 'verify'>('init');
    const [factorId, setFactorId] = useState('');
    const [qrCode, setQrCode] = useState(''); // This would be the SVG if available
    const [secret, setSecret] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        handleStart();
    }, []);

    const handleStart = async () => {
        try {
            const data = await startEnrollment();
            setFactorId(data.id);
            setSecret(data.totp.secret);
            setQrCode(data.totp.qr_code); // Supabase returns a data URI or SVG? actually it returns the otpauth URL usually
            setStep('verify');
        } catch (err) {
            setError('Failed to start enrollment');
        }
    };

    const handleVerify = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }

        const success = await verifyEnrollment(factorId, verificationCode);
        if (success) {
            onComplete();
        } else {
            setError('Invalid code. Please try again.');
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(secret);
        toast({
            title: "Copied",
            description: "Secret key copied to clipboard",
        });
    };

    if (step === 'init') {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p>Initializing secure enrollment...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldDefault className="h-5 w-5 text-primary" />
                    Setup Two-Factor Authentication
                </CardTitle>
                <CardDescription>
                    Protect your account by adding an extra layer of security.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg text-center space-y-2">
                        <p className="text-sm font-medium">Scan QR Code</p>
                        {/* Since we don't have a QR library, we instructing user to use manual entry or if Supabase provides SVG use that */}
                        <div className="flex justify-center py-2">
                            {/* Placeholder for QR Code */}
                            <div className="h-40 w-40 bg-white border flex items-center justify-center text-xs text-muted-foreground p-2 text-center">
                                QR Code generation requires a library. Please enter the secret key manually.
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Manual Entry Secret Key</Label>
                        <div className="flex gap-2">
                            <code className="flex-1 p-2 bg-muted rounded border font-mono text-center text-lg tracking-widest break-all">
                                {secret}
                            </code>
                            <Button variant="outline" size="icon" onClick={copyToClipboard}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Enter this key into your authenticator app (Google Authenticator, Authy, etc.)
                        </p>
                    </div>

                    <div className="space-y-2 pt-2">
                        <Label htmlFor="verification-code">Verify Code</Label>
                        <Input
                            id="verification-code"
                            placeholder="000000"
                            value={verificationCode}
                            onChange={(e) => {
                                setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6));
                                setError('');
                            }}
                            className="text-center text-lg tracking-widest"
                            maxLength={6}
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter the 6-digit code from your authenticator app to enable 2FA.
                        </p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button onClick={handleVerify} disabled={isLoading || verificationCode.length !== 6}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify & Enable
                </Button>
            </CardFooter>
        </Card>
    );
};
