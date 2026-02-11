import { ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const SecuritySettings = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    Account Security
                </CardTitle>
                <CardDescription>
                    Manage your account security and password settings.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 bg-muted/50 rounded-lg flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <p className="text-sm">Two-Factor Authentication has been disabled by the administrator to streamline the login process.</p>
                </div>
            </CardContent>
        </Card>
    );
};
