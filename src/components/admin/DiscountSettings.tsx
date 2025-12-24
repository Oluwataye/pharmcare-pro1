
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DiscountConfig } from "@/types/sales";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DiscountSettingsProps {
  initialConfig: DiscountConfig;
  onSave: (config: DiscountConfig) => void;
}

export const DiscountSettings = ({ initialConfig, onSave }: DiscountSettingsProps) => {
  const [config, setConfig] = useState<DiscountConfig>(initialConfig);
  const [advancedSettings, setAdvancedSettings] = useState({
    bulkDiscountEnabled: true,
    loyaltyDiscountEnabled: false,
  });
  const { toast } = useToast();

  const handleSave = () => {
    if (config.maxDiscount < config.defaultDiscount) {
      toast({
        title: "Error",
        description: "Maximum discount cannot be less than default discount",
        variant: "destructive",
      });
      return;
    }
    
    // Include advanced settings in the save
    const updatedConfig = {
      ...config,
      bulkDiscountEnabled: advancedSettings.bulkDiscountEnabled,
      loyaltyDiscountEnabled: advancedSettings.loyaltyDiscountEnabled,
    };
    
    onSave(updatedConfig);
    toast({
      title: "Success",
      description: "Discount settings saved successfully",
    });
  };

  const handleLoyaltyDiscountToggle = (checked: boolean) => {
    setAdvancedSettings({
      ...advancedSettings,
      loyaltyDiscountEnabled: checked,
    });
    
    // Only show toast if the discount system is enabled
    if (config.enabled) {
      toast({
        title: checked ? "Loyalty Discount Enabled" : "Loyalty Discount Disabled",
        description: checked 
          ? "Loyalty customers will now receive special discounts" 
          : "Loyalty discount feature has been disabled",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discount Settings</CardTitle>
        <CardDescription>Configure discount rules for sales</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="discount-enabled">Enable Discounts</Label>
              <Switch
                id="discount-enabled"
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-discount">Default Discount (%)</Label>
              <Input
                id="default-discount"
                type="number"
                min="0"
                max="100"
                value={config.defaultDiscount}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    defaultDiscount: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)),
                  })
                }
                disabled={!config.enabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-discount">Maximum Discount (%)</Label>
              <Input
                id="max-discount"
                type="number"
                min="0"
                max="100"
                value={config.maxDiscount}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    maxDiscount: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)),
                  })
                }
                disabled={!config.enabled}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-2">
              <Label>Special Discount Rules</Label>
              <div className="border rounded-md p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bulk-discount-enabled">Bulk Purchase Discounts</Label>
                  <Switch
                    id="bulk-discount-enabled"
                    checked={advancedSettings.bulkDiscountEnabled}
                    onCheckedChange={(checked) => 
                      setAdvancedSettings({
                        ...advancedSettings,
                        bulkDiscountEnabled: checked
                      })
                    }
                    disabled={!config.enabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="loyalty-discount-enabled">Loyalty Customer Discounts</Label>
                  <Switch
                    id="loyalty-discount-enabled"
                    checked={advancedSettings.loyaltyDiscountEnabled}
                    onCheckedChange={handleLoyaltyDiscountToggle}
                    disabled={!config.enabled}
                  />
                </div>
              </div>
              
              {advancedSettings.loyaltyDiscountEnabled && config.enabled && (
                <div className="mt-4 border rounded-md p-4 space-y-2 bg-muted/50">
                  <h3 className="font-medium">Loyalty Discount Settings</h3>
                  <div className="space-y-2">
                    <Label htmlFor="loyalty-discount-percent">Loyalty Customer Discount (%)</Label>
                    <Input
                      id="loyalty-discount-percent"
                      type="number"
                      min="0"
                      max="100"
                      defaultValue="10"
                      disabled={!config.enabled || !advancedSettings.loyaltyDiscountEnabled}
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={!config.enabled}>Save Settings</Button>
      </CardFooter>
    </Card>
  );
};
