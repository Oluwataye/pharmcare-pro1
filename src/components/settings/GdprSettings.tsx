import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Download, Trash2, FileText, Shield, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function GdprSettings() {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('gdpr-request', {
        body: { action: 'export' },
      });

      if (error) throw error;

      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Data Exported',
        description: 'Your personal data has been downloaded.',
      });
    } catch (error: any) {
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export data',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteData = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('gdpr-request', {
        body: { action: 'delete' },
      });

      if (error) throw error;

      toast({
        title: 'Data Anonymized',
        description: 'Your personal data has been anonymized. You will be logged out.',
      });

      // Log out the user after data deletion
      setTimeout(async () => {
        await supabase.auth.signOut();
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Deletion Failed',
        description: error.message || 'Failed to delete data',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy & Data Rights (GDPR)
        </CardTitle>
        <CardDescription>
          Manage your personal data in compliance with data protection regulations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Right to Access / Data Portability */}
        <div className="flex items-start justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium">Access Your Data</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Download a copy of all your personal data stored in the system
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleExportData}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export Data
          </Button>
        </div>

        {/* Right to be Forgotten */}
        <div className="flex items-start justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" />
              <h4 className="font-medium text-destructive">Right to be Forgotten</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Permanently anonymize your personal data. This action cannot be undone.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete My Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>This action will permanently anonymize all your personal data including:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Your profile information</li>
                    <li>Your name and email in sales records</li>
                    <li>Your activity in audit logs</li>
                  </ul>
                  <p className="font-medium text-destructive">
                    This action cannot be undone. You will be logged out after completion.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteData}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, Delete My Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Data Retention Info */}
        <div className="p-4 border rounded-lg bg-muted/50">
          <h4 className="font-medium mb-2">Data Retention Policies</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Sales records: Retained for 2 years for legal compliance</li>
            <li>• Print analytics: Automatically deleted after 90 days</li>
            <li>• Audit logs: Retained for 1 year for security purposes</li>
            <li>• Rate limit data: Automatically deleted after 24 hours</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
