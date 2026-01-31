import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock } from 'lucide-react';

interface MFAVerificationProps {
    onVerify: (code: string) => Promise<boolean>;
    onCancel?: () => void;
    title?: string;
    description?: string;
}

export const MFAVerification = ({
    onVerify,
    onCancel,
    title = "Two-Factor Authentication",
    description = "Enter the 6-digit code from your authenticator app."
}: MFAVerificationProps) => {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!code || code.length !== 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const success = await onVerify(code);
            if (!success) {
                setError('Invalid code. Please try again.');
            }
        } catch (err) {
            setError('Verification failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto shadow-lg">
            <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    {title}
                </CardTitle>
                <CardDescription>
                    {description}
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="mfa-code">Authentication Code</Label>
                        <Input
                            id="mfa-code"
                            placeholder="000000"
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6));
                                setError('');
                            }}
                            className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                            maxLength={6}
                            autoFocus
                            autoComplete="one-time-code"
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    {onCancel && (
                        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" className="w-full ml-2" disabled={isLoading || code.length !== 6}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verify
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
};
