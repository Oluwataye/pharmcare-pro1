
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [storeSettings, setStoreSettings] = useState({
    id: '',
    name: "PharmaCare Pro",
    address: "123 Main Street, Lagos",
    phone: "080-1234-5678",
    email: "contact@pharmacarepro.com",
  });

  const [printSettings, setPrintSettings] = useState({
    showLogo: true,
    showAddress: true,
    showEmail: true,
    showPhone: true,
    showFooter: true,
  });

  // Load settings from database on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setStoreSettings({
          id: data.id,
          name: data.name,
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
        });
        
        setPrintSettings({
          showLogo: data.print_show_logo ?? true,
          showAddress: data.print_show_address ?? true,
          showEmail: data.print_show_email ?? true,
          showPhone: data.print_show_phone ?? true,
          showFooter: data.print_show_footer ?? true,
        });
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      });
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
      
      // Also save to localStorage for receipt printing
      localStorage.setItem('storeSettings', JSON.stringify(storeSettings));
      
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
        <TabsList className="grid w-full md:w-1/2 grid-cols-3">
          <TabsTrigger value="store">Store</TabsTrigger>
          <TabsTrigger value="printing">Printing</TabsTrigger>
          {user?.role === "SUPER_ADMIN" && (
            <TabsTrigger value="discount">Discount</TabsTrigger>
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
      </Tabs>

      <footer className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
        2025 © T-Tech Solutions
      </footer>
    </div>
  );
};

export default Settings;
