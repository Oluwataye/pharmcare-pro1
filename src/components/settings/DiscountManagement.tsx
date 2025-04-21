
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { DiscountSettings } from "@/components/admin/DiscountSettings";
import { DiscountConfig } from "@/types/sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock initial discount configuration
const initialDiscountConfig: DiscountConfig = {
  defaultDiscount: 5,
  maxDiscount: 20,
  enabled: true,
};

export const DiscountManagement = () => {
  const [discountConfig, setDiscountConfig] = useState<DiscountConfig>(initialDiscountConfig);
  const { toast } = useToast();

  const handleSaveDiscountConfig = (config: DiscountConfig) => {
    setDiscountConfig(config);
    // In a real app, this would save to backend/database
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
        <DiscountSettings 
          initialConfig={discountConfig} 
          onSave={handleSaveDiscountConfig} 
        />
      </CardContent>
    </Card>
  );
};
