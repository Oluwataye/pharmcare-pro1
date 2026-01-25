
import { useToast } from "@/hooks/use-toast";
import { DiscountSettings } from "@/components/admin/DiscountSettings";
import { DiscountHistory } from "@/components/admin/DiscountHistory";
import { DiscountConfig } from "@/types/sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSystemConfig } from "@/hooks/useSystemConfig";

export const DiscountManagement = () => {
  const { config, updateConfig } = useSystemConfig();
  const { toast } = useToast();

  // Map system config to discount config format
  const discountConfig: DiscountConfig = {
    defaultDiscount: config.defaultDiscount,
    maxDiscount: config.maxDiscount,
    enabled: config.enableDiscounts,
    manualDiscountEnabled: config.manualDiscountEnabled,
  };

  const handleSaveDiscountConfig = (newConfig: DiscountConfig) => {
    updateConfig({
      defaultDiscount: newConfig.defaultDiscount,
      maxDiscount: newConfig.maxDiscount,
      enableDiscounts: newConfig.enabled,
      manualDiscountEnabled: newConfig.manualDiscountEnabled
    });

    toast({
      title: "Success",
      description: "Discount settings saved successfully",
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Discount Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="history">Discount History</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <DiscountSettings
              initialConfig={discountConfig}
              onSave={handleSaveDiscountConfig}
            />
          </TabsContent>

          <TabsContent value="history">
            <DiscountHistory />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
