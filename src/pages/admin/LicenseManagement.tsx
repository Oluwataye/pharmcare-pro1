import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, ShieldX, Key, Activity, MonitorSmartphone, CalendarDays, Plus, Copy, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface LicenseRecord {
  id: string;
  license_key: string;
  client_name: string;
  domain: string;
  installation_id: string;
  status: string;
  activated_at: string;
  last_verified_at: string;
}

const generateRandomKeySegment = (length: number = 4) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateLicenseKey = () => {
  return `PHARMCARE-${generateRandomKeySegment(4)}-${generateRandomKeySegment(4)}-${generateRandomKeySegment(4)}`;
};

const LicenseManagement = () => {
  const { user } = useAuth();
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Key Generation State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [generatedKey, setGeneratedKey] = useState(generateLicenseKey());
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const fetchLicenses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_license' as any)
        .select('*')
        .order('activated_at', { ascending: false });

      if (error) throw error;
      setLicenses((data as any[]) || []);
    } catch (err: any) {
      toast.error('Failed to load licenses: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) {
      toast.error('Please enter the client / pharmacy name');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase
        .from('system_license' as any)
        .insert({
          license_key: generatedKey,
          client_name: newClientName.trim(),
          domain: 'pending_activation',
          installation_id: 'pending_activation',
          status: 'pending',
          activated_at: new Date().toISOString(),
          last_verified_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`License generated successfully for ${newClientName.trim()}!`);
      fetchLicenses();
      setIsModalOpen(false);
      setNewClientName('');
      setGeneratedKey(generateLicenseKey());
    } catch (err: any) {
      console.error('Error generating license key:', err);
      toast.error('Failed to generate license: ' + (err.message || 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setHasCopied(true);
    toast.success('License Key copied to clipboard!');
    setTimeout(() => setHasCopied(false), 2000);
  };

  const deactivateLicense = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this license? This will lock out the client.')) return;
    
    try {
      const { error } = await supabase.functions.invoke('activate-license', {
        body: { action: 'deactivate', id }
      });
      if (error) throw error;
      
      toast.success('License deactivated successfully');
      fetchLicenses();
    } catch (err: any) {
      toast.error('Failed to deactivate: ' + err.message);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  // Strict Developer/Admin check
  if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN' as any && user?.role !== 'SUPERADMIN' as any) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            License Management Details
          </h1>
          <p className="text-muted-foreground">Generate, monitor, and manage application licenses for multiple clients.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Generate New License Key
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b">
          <CardTitle className="text-lg">System Licensing Records</CardTitle>
          <CardDescription>All issued and activated licenses and their status.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100/50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Client Name</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead className="font-mono text-xs">Installation Hash</TableHead>
                <TableHead>Activated At</TableHead>
                <TableHead>Last Verified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">Loading licenses...</TableCell>
                </TableRow>
              ) : licenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No license records found for this system.
                  </TableCell>
                </TableRow>
              ) : (
                licenses.map((license) => (
                  <TableRow key={license.id} className="group">
                    <TableCell>
                      {license.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <Activity className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          <ShieldX className="w-3 h-3" /> Revoked
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{license.client_name}</TableCell>
                    <TableCell className="text-slate-500">
                        <div className="flex items-center gap-2">
                            <MonitorSmartphone className="w-3.5 h-3.5" />
                            {license.domain}
                        </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[150px] truncate" title={license.installation_id}>
                        {license.installation_id.substring(0, 16)}...
                    </TableCell>
                    <TableCell className="text-sm">
                        <div className="flex items-center gap-2 text-slate-500">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {format(new Date(license.activated_at), 'MMM dd, yyyy')}
                        </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                        {format(new Date(license.last_verified_at), 'MMM dd, HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      {license.status === 'active' && (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => deactivateLicense(license.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/20 p-4">
        <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-400 flex items-center gap-2 mb-1">
          <Key className="w-4 h-4" /> Developer & Admin Note
        </h4>
        <p className="text-sm text-yellow-700 dark:text-yellow-500/90">
          Generating a key issues a new license bound to the client name. Hand this key to your client to input on their System Activation page upon installation.
        </p>
      </div>

      {/* Generate License Key Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Key className="w-5 h-5 text-blue-600" />
              Generate Client License Key
            </DialogTitle>
            <DialogDescription>
              Create a personalized license key for a new pharmacy client.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateLicense} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-client-name">Client / Pharmacy Name*</Label>
              <Input
                id="new-client-name"
                placeholder="e.g. CarePlus Pharmacy Ltd"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="generated-key">Generated License Key</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setGeneratedKey(generateLicenseKey())}
                  className="h-6 text-xs text-blue-600 hover:text-blue-700"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Regenerate
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  id="generated-key"
                  value={generatedKey}
                  readOnly
                  className="font-mono text-sm tracking-wide bg-muted/50 font-bold"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(generatedKey)}
                  className="shrink-0"
                >
                  {hasCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isGenerating || !newClientName.trim()} className="bg-blue-600 hover:bg-blue-700">
                {isGenerating ? 'Generating...' : 'Issue License Key'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LicenseManagement;
