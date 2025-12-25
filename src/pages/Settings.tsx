
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
import { GdprSettings } from "@/components/settings/GdprSettings";
import { EnhancedCard } from "@/components/ui/EnhancedCard";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [storeSettings, setStoreSettings] = useState({
    id: '',
    name: "PharmaCare Pro",
    address: "123 Main Street, Lagos",
    phone: "080-1234-5678",
    email: "contact@pharmacarepro.com",
    logoUrl: '',
  });

  const [printSettings, setPrintSettings] = useState({
    showLogo: true,
    showAddress: true,
    showEmail: true,
    showPhone: true,
    showFooter: true,
  });

  const { settings: currentSettings, isLoading: isFetchingSettings } = useStoreSettings();

  // Load settings from database on component mount
  useEffect(() => {
    if (currentSettings) {
      setStoreSettings({
        id: currentSettings.id,
        name: currentSettings.name,
        address: currentSettings.address || '',
        phone: currentSettings.phone || '',
        email: currentSettings.email || '',
        logoUrl: currentSettings.logo_url || '',
      });

      setPrintSettings({
        showLogo: currentSettings.print_show_logo ?? true,
        showAddress: currentSettings.print_show_address ?? true,
        showEmail: currentSettings.print_show_email ?? true,
        showPhone: currentSettings.print_show_phone ?? true,
        showFooter: currentSettings.print_show_footer ?? true,
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
      if (storeSettings.logoUrl) {
        const oldPath = storeSettings.logoUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('store-logos').remove([oldPath]);
        }
      }

      // Upload new logo
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
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

      // Update database
      const { error: updateError } = await supabase
        .from('store_settings')
        .update({
          logo_url: publicUrl,
          updated_by: user.id,
        })
        .eq('id', storeSettings.id);

      if (updateError) throw updateError;

      setStoreSettings({ ...storeSettings, logoUrl: publicUrl });

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

  const handleStoreSettingsSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('store_settings')
        .update({
          name: storeSettings.name,
          address: storeSettings.address,
          phone: storeSettings.phone,
          email: storeSettings.email,
          updated_by: user.id,
        })
        .eq('id', storeSettings.id);

      if (error) throw error;

      // Invalidate cache to force refresh in all components
      invalidateStoreSettingsCache();

      toast({
        title: "Settings Saved",
        description: "Store settings have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintSettingsSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('store_settings')
        .update({
          print_show_logo: printSettings.showLogo,
          print_show_address: printSettings.showAddress,
          print_show_email: printSettings.showEmail,
          print_show_phone: printSettings.showPhone,
          print_show_footer: printSettings.showFooter,
          updated_by: user.id,
        })
        .eq('id', storeSettings.id);

      if (error) throw error;

      // Invalidate cache to force refresh in all components
      invalidateStoreSettingsCache();

      toast({
        title: "Settings Saved",
        description: "Print settings have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show user profile settings for cashier and pharmacist
  if (user?.role === "CASHIER" || user?.role === "PHARMACIST") {
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
        <TabsList className="grid w-full md:w-2/3 grid-cols-4">
          <TabsTrigger value="store">Store</TabsTrigger>
          <TabsTrigger value="printing">Printing</TabsTrigger>
          {user?.role === "SUPER_ADMIN" && (
            <TabsTrigger value="discount">Discount</TabsTrigger>
          )}
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
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
                  {storeSettings.logoUrl && (
                    <div className="relative w-20 h-20 rounded-md overflow-hidden border-2 border-border">
                      <img
                        src={storeSettings.logoUrl}
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
                      disabled={isUploadingLogo}
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
                  value={storeSettings.name}
                  onChange={(e) =>
                    setStoreSettings({ ...storeSettings, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-address">Address</Label>
                <Input
                  id="store-address"
                  value={storeSettings.address}
                  onChange={(e) =>
                    setStoreSettings({
                      ...storeSettings,
                      address: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="store-phone">Phone Number</Label>
                  <Input
                    id="store-phone"
                    value={storeSettings.phone}
                    onChange={(e) =>
                      setStoreSettings({
                        ...storeSettings,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-email">Email Address</Label>
                  <Input
                    id="store-email"
                    type="email"
                    value={storeSettings.email}
                    onChange={(e) =>
                      setStoreSettings({
                        ...storeSettings,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleStoreSettingsSave} disabled={isLoading}>
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
                  checked={printSettings.showLogo}
                  onCheckedChange={(checked) =>
                    setPrintSettings({ ...printSettings, showLogo: checked })
                  }
                />
                <Label htmlFor="print-logo">Show Logo on Receipt</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="print-address"
                  checked={printSettings.showAddress}
                  onCheckedChange={(checked) =>
                    setPrintSettings({ ...printSettings, showAddress: checked })
                  }
                />
                <Label htmlFor="print-address">Show Store Address</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="print-email"
                  checked={printSettings.showEmail}
                  onCheckedChange={(checked) =>
                    setPrintSettings({ ...printSettings, showEmail: checked })
                  }
                />
                <Label htmlFor="print-email">Show Store Email</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="print-phone"
                  checked={printSettings.showPhone}
                  onCheckedChange={(checked) =>
                    setPrintSettings({ ...printSettings, showPhone: checked })
                  }
                />
                <Label htmlFor="print-phone">Show Store Phone Number</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="print-footer"
                  checked={printSettings.showFooter}
                  onCheckedChange={(checked) =>
                    setPrintSettings({ ...printSettings, showFooter: checked })
                  }
                />
                <Label htmlFor="print-footer">Show Receipt Footer</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handlePrintSettingsSave} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {user?.role === "SUPER_ADMIN" && (
          <TabsContent value="discount">
            <DiscountManagement />
          </TabsContent>
        )}

        <TabsContent value="privacy">
          <GdprSettings />
        </TabsContent>
      </Tabs>

      <footer className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
        2025 © T-Tech Solutions
      </footer>
    </div>
  );
};

export default Settings;
