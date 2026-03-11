import React, { useState } from 'react';
import { useLicense } from '@/contexts/LicenseContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, KeyRound, MonitorSmartphone, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { secureStorage } from '@/lib/secureStorage';

const LicenseActivation = () => {
  const { isValid, isLoading, activateLicense } = useLicense();
  const [key, setKey] = useState('');
  const [clientName, setClientName] = useState('');
  const [activating, setActivating] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (isValid) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !clientName.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setActivating(true);
    const result = await activateLicense(key.trim(), clientName.trim());
    setActivating(false);

    if (result.success) {
      toast.success('System activated successfully. Welcome to Pharmcare Pro!', {
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
      });
    } else {
      toast.error(result.error || 'Activation failed. Please check your license key.');
    }
  };

  const domain = window.location.hostname;
  const installationId = secureStorage.getItem('system_install_id') || 'Pending generation...';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-600/20 to-transparent pointer-events-none" />
      <div className="absolute -top-[200px] -right-[200px] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-[200px] -left-[200px] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      
      <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800 relative z-10 backdrop-blur-sm bg-white/90 dark:bg-slate-950/90">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-8 h-8 text-blue-600 dark:text-blue-400 shrink-0" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight">System Activation Required</CardTitle>
            <CardDescription className="text-base">
              This installation of Pharmcare Pro must be licensed before use.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleActivation} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="clientName">Registered Client / Pharmacy Name</Label>
              <Input 
                id="clientName" 
                placeholder="e.g. CarePlus Pharmacy" 
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                disabled={activating}
                className="bg-white dark:bg-slate-900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseKey">License Key</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  id="licenseKey" 
                  placeholder="PHARMCARE-XXXX-XXXX-XXXX" 
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  disabled={activating}
                  className="pl-9 font-mono tracking-wider bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="rounded-lg bg-slate-100 dark:bg-slate-800/50 p-4 mt-6">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <MonitorSmartphone className="w-4 h-4" /> 
                Installation Footprint
              </h4>
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-mono break-all">
                <p><span className="font-semibold text-slate-700 dark:text-slate-300">Domain:</span> {domain}</p>
                <p><span className="font-semibold text-slate-700 dark:text-slate-300">Hardware ID:</span> {installationId.substring(0, 18)}...</p>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base font-medium" disabled={activating}>
              {activating ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" /> Validating License...
                </>
              ) : (
                'Activate System'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LicenseActivation;
