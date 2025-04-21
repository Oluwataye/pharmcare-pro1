
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

interface DiscountSettingsProps {
  initialConfig: DiscountConfig;
  onSave: (config: DiscountConfig) => void;
}

export const DiscountSettings = ({ initialConfig, onSave }: DiscountSettingsProps) => {
  const [config, setConfig] = useState<DiscountConfig>(initialConfig);
  const { toast } = useToast();

  const handleSave = () => {
    onSave(config);
    toast({
      title: "Success",
      description: "Discount settings saved successfully",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discount Settings</CardTitle>
        <CardDescription>Configure discount rules for sales</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>Save Settings</Button>
      </CardFooter>
    </Card>
  );
};
