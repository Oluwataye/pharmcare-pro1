
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useStoreSettings, invalidateStoreSettingsCache } from "@/hooks/useStoreSettings";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { DiscountManagement } from "@/components/settings/DiscountManagement";
import { UserProfileSettings } from "@/components/settings/UserProfileSettings";
import { UserProfileSettings } from "@/components/settings/UserProfileSettings";
import { GdprSettings } from "@/components/settings/GdprSettings";
import { RetentionSettings } from "@/components/settings/RetentionSettings";
import { EnhancedCard } from "@/components/ui/EnhancedCard";
import { supabase } from "@/integrations/supabase/client";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { DataManagement } from "@/components/settings/DataManagement";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, ShieldCheck, Database, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const { config: systemConfig, updateConfig: updateSystemConfig } = useSystemConfig();
  const { settings: currentSettings, isLoading: isFetchingSettings } = useStoreSettings();

  const [formSettings, setFormSettings] = useState({
    id: '',
    name: "PharmaCare Pro",
    address: "123 Main Street, Lagos",
    phone: "080-1234-5678",
    email: "contact@pharmacarepro.com",
    logoUrl: '',
    showLogo: true,
    showAddress: true,
    showEmail: true,
    showPhone: true,
    showFooter: true,
    defaultProfitMargin: 30,
  });

  // Load settings from database on component mount
  useEffect(() => {
    if (currentSettings) {
      setFormSettings({
        id: currentSettings.id,
        name: currentSettings.name,
        address: currentSettings.address || '',
        phone: currentSettings.phone || '',
        email: currentSettings.email || '',
        logoUrl: currentSettings.logo_url || '',
        showLogo: currentSettings.print_show_logo ?? true,
        showAddress: currentSettings.print_show_address ?? true,
        showEmail: currentSettings.print_show_email ?? true,
        showPhone: currentSettings.print_show_phone ?? true,
        showFooter: currentSettings.print_show_footer ?? true,
        defaultProfitMargin: currentSettings.default_profit_margin ?? 30,
      });
    }
  }, [currentSettings]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a JPEG, PNG, or WebP image.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Image must be smaller than 2MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingLogo(true);
    try {
      // Delete old logo if exists
      if (formSettings.logoUrl) {
        const oldPath = formSettings.logoUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('store-logos').remove([oldPath]);
        }
      }

      // Upload new logo
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('store-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('store-logos')
        .getPublicUrl(fileName);

      // Update database using upsert for reliability
      const { error: updateError } = await supabase
        .from('store_settings')
        .upsert({
          id: formSettings.id || undefined, // undefined will trigger auto-gen or match default
          logo_url: publicUrl,
          updated_by: user.id,
        });

      if (updateError) throw updateError;

      setFormSettings(prev => ({ ...prev, logoUrl: publicUrl }));
      localStorage.setItem('store_settings_updated', Date.now().toString());

      toast({
        title: 'Logo Uploaded',
        description: 'Your store logo has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Logo upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload logo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingLogo(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    if (isFetchingSettings) {
      toast({
        title: "Please wait",
        description: "Settings are still loading.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    console.log('Attempting to save settings:', formSettings);

    try {
      // Use explicit update if we have a valid ID, fallback to upsert
      const payload = {
        name: formSettings.name,
        address: formSettings.address,
        phone: formSettings.phone,
        email: formSettings.email,
        print_show_logo: formSettings.showLogo,
        print_show_address: formSettings.showAddress,
        print_show_email: formSettings.showEmail,
        print_show_phone: formSettings.showPhone,
        print_show_footer: formSettings.showFooter,
        default_profit_margin: formSettings.defaultProfitMargin,
        updated_by: user.id,
      };

      let saveResult;
      if (formSettings.id && formSettings.id !== 'default') {
        console.log('Using update for ID:', formSettings.id);
        saveResult = await supabase
          .from('store_settings')
          .update(payload)
          .eq('id', formSettings.id);
      } else {
        console.log('Using upsert (no valid ID found)');
        saveResult = await supabase
          .from('store_settings')
          .upsert({
            ...payload,
            id: (formSettings.id && formSettings.id !== 'default') ? formSettings.id : undefined
          });
      }

      const { error } = saveResult;

      if (error) {
        console.error('Supabase save error:', error);
        throw error;
      }

      // Notify other tabs and components
      localStorage.setItem('store_settings_updated', Date.now().toString());
      invalidateStoreSettingsCache();

      toast({
        title: "Settings Saved",
        description: "All settings have been updated successfully.",
      });
    } catch (error: any) {
      console.error('Save error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });

      const isForbidden = error.status === 403 || error.code === '42501';

      toast({
        title: isForbidden ? 'Permission Denied' : 'Error',
        description: isForbidden
          ? 'You do not have permission to update store settings. Please contact your administrator.'
          : (error.message || 'Failed to save settings'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show user profile settings for dispenser and pharmacist
  if (user?.role === "DISPENSER" || user?.role === "PHARMACIST") {
    return <UserProfileSettings />;
  }

  // Show full settings for super admin
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">
          Manage your pharmacy settings and preferences
        </p>
      </div>

      <Tabs defaultValue="store" className="w-full">
        <TabsList className="grid w-full md:w-full grid-cols-3 md:grid-cols-6 mb-4">
          <TabsTrigger value="store">Store</TabsTrigger>
          <TabsTrigger value="printing">Printing</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          {user?.role === "SUPER_ADMIN" && (
            <>
              <TabsTrigger value="discount">Discount</TabsTrigger>
              <TabsTrigger value="retention">Data Retention</TabsTrigger>
              <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
            </>
          )}
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="security">Account Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          {user?.role === "SUPER_ADMIN" && (
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>
                Update your pharmacy store details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="store-logo">Store Logo</Label>
                <div className="flex items-center gap-4">
                  {formSettings.logoUrl && (
                    <div className="relative w-20 h-20 rounded-md overflow-hidden border-2 border-border">
                      <img
                        src={formSettings.logoUrl}
                        alt="Store Logo"
                        className="w-full h-full object-contain bg-muted"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      id="store-logo"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleLogoUpload}
                      disabled={isUploadingLogo || isFetchingSettings}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload JPEG, PNG, or WebP (max 2MB)
                    </p>
                    {isUploadingLogo && (
                      <p className="text-xs text-primary mt-1">Uploading logo...</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-name">Store Name</Label>
                <Input
                  id="store-name"
                  value={formSettings.name}
                  disabled={isFetchingSettings}
                  onChange={(e) =>
                    setFormSettings(prev => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-address">Address</Label>
                <Input
                  id="store-address"
                  value={formSettings.address}
                  disabled={isFetchingSettings}
                  onChange={(e) =>
                    setFormSettings(prev => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="store-phone">Phone Number</Label>
                  <Input
                    id="store-phone"
                    value={formSettings.phone}
                    disabled={isFetchingSettings}
                    onChange={(e) =>
                      setFormSettings(prev => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-email">Email Address</Label>
                  <Input
                    id="store-email"
                    type="email"
                    value={formSettings.email}
                    disabled={isFetchingSettings}
                    onChange={(e) =>
                      setFormSettings(prev => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} disabled={isLoading || isFetchingSettings}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="printing">
          <Card>
            <CardHeader>
              <CardTitle>Receipt Printing Settings</CardTitle>
              <CardDescription>
                Customize your receipt printing options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="print-logo"
                  checked={formSettings.showLogo}
                  disabled={isFetchingSettings}
                  onCheckedChange={(checked) => setFormSettings(prev => ({ ...prev, showLogo: checked }))}
                />
                <Label htmlFor="print-logo">Show Logo on Receipt</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="print-address"
                  checked={formSettings.showAddress}
                  disabled={isFetchingSettings}
                  onCheckedChange={(checked) => setFormSettings(prev => ({ ...prev, showAddress: checked }))}
                />
                <Label htmlFor="print-address">Show Store Address</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="print-email"
                  checked={formSettings.showEmail}
                  disabled={isFetchingSettings}
                  onCheckedChange={(checked) => setFormSettings(prev => ({ ...prev, showEmail: checked }))}
                />
                <Label htmlFor="print-email">Show Store Email</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="print-phone"
                  checked={formSettings.showPhone}
                  disabled={isFetchingSettings}
                  onCheckedChange={(checked) => setFormSettings(prev => ({ ...prev, showPhone: checked }))}
                />
                <Label htmlFor="print-phone">Show Store Phone Number</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="print-footer"
                  checked={formSettings.showFooter}
                  disabled={isFetchingSettings}
                  onCheckedChange={(checked) => setFormSettings(prev => ({ ...prev, showFooter: checked }))}
                />
                <Label htmlFor="print-footer">Show Receipt Footer</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} disabled={isLoading || isFetchingSettings}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Configure global system preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <div className="flex gap-4">
                  <Select
                    value={systemConfig.currency}
                    onValueChange={(val) => {
                      const symbol = val === 'NGN' ? '₦' : val === 'USD' ? '$' : val === 'EUR' ? '€' : val === 'GBP' ? '£' : '₦';
                      updateSystemConfig({ currency: val, currencySymbol: symbol });
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="GBP">British Pound (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Low Stock Threshold</Label>
                <div className="flex gap-4 items-center">
                  <Input
                    type="number"
                    value={systemConfig.lowStockThreshold}
                    onChange={(e) => updateSystemConfig({ lowStockThreshold: parseInt(e.target.value) || 0 })}
                    className="w-[180px]"
                  />
                  <span className="text-sm text-muted-foreground">units</span>
                </div>
                <p className="text-xs text-muted-foreground">Products with quantity below this value will be flagged as low stock.</p>
              </div>
              <div className="space-y-2">
                <Label>Tax Rate (%)</Label>
                <div className="flex gap-4 items-center">
                  <Input
                    type="number"
                    value={systemConfig.taxRate}
                    onChange={(e) => updateSystemConfig({ taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-[180px]"
                    step="0.1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Default Profit Margin (%)</Label>
                <div className="flex gap-4 items-center">
                  <Input
                    type="number"
                    value={formSettings.defaultProfitMargin}
                    onChange={(e) => setFormSettings(prev => ({ ...prev, defaultProfitMargin: parseFloat(e.target.value) || 0 }))}
                    className="w-[180px]"
                  />
                  <span className="text-sm text-muted-foreground mr-4">%</span>
                  <Button onClick={handleSaveSettings} disabled={isLoading} size="sm">Update Global Margin</Button>
                </div>
                <p className="text-xs text-muted-foreground">This margin will be applied by default to all new stock entries.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {user?.role === "SUPER_ADMIN" && (
          <>
            <TabsContent value="discount">
              <DiscountManagement />
            </TabsContent>
            <TabsContent value="retention">
              <RetentionSettings />
            </TabsContent>
            <TabsContent value="backup">
              <DataManagement />
            </TabsContent>
          </>
        )}

        <TabsContent value="privacy">
          <GdprSettings />
        </TabsContent>
        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        {user?.role === "SUPER_ADMIN" && (
          <TabsContent value="maintenance">
            <Card className="border-destructive/20 shadow-sm">
              <CardHeader className="bg-destructive/5">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-destructive" />
                  <CardTitle>System Maintenance & Repair</CardTitle>
                </div>
                <CardDescription>
                  Critical tools for database infrastructure repair and recovery.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4 p-4 border rounded-lg bg-card hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate('/technical-guide')}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <h4 className="font-bold">Technical Repair Guide</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Access the one-click SQL recovery script and step-by-step instructions to fix "Infrastructure Repair Required" errors.
                    </p>
                    <Button variant="link" className="p-0 h-auto text-primary font-bold">Open Technical Guide →</Button>
                  </div>

                  <div className="flex-1 space-y-4 p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded-full">
                        <ShieldCheck className="h-5 w-5 text-green-600" />
                      </div>
                      <h4 className="font-bold">Infrastructure Audit</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Run a diagnostic check on your local database sync and online cloud connection.
                    </p>
                    <Button variant="outline" size="sm" className="w-full" disabled>Coming Soon</Button>
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-tight">System Identity</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-muted-foreground">
                    <div>PROJECT_ID: ucbmifox...</div>
                    <div>VERSION: {process.env.NODE_ENV === 'production' ? '2.0.4-ux-hardened' : 'DEV-LOCAL'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <footer className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
        2025 © T-Tech Solutions
      </footer>
    </div >
  );
};

export default Settings;
