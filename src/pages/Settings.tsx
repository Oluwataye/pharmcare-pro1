
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

const Settings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [storeSettings, setStoreSettings] = useState({
    name: "PharmaCare Pro",
    address: "123 Main Street, Lagos",
    phone: "080-1234-5678",
    email: "contact@pharmacarepro.com",
  });

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('storeSettings');
    if (savedSettings) {
      setStoreSettings(JSON.parse(savedSettings));
    }
  }, []);

  const [printSettings, setPrintSettings] = useState({
    showLogo: true,
    showAddress: true,
    showEmail: true,
    showPhone: true,
    showFooter: true,
  });

  const handleStoreSettingsSave = () => {
    // Save settings to localStorage for receipt printing
    localStorage.setItem('storeSettings', JSON.stringify(storeSettings));
    
    toast({
      title: "Settings Saved", 
      description: "Store settings have been updated successfully.",
    });
  };

  const handlePrintSettingsSave = () => {
    toast({
      title: "Settings Saved",
      description: "Print settings have been updated successfully.",
    });
  };

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
          {user?.role === "ADMIN" && (
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
              <Button onClick={handleStoreSettingsSave}>Save Changes</Button>
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
              <Button onClick={handlePrintSettingsSave}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {user?.role === "ADMIN" && (
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
