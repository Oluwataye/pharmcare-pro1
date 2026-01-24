
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Percent, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface SaleTotalsProps {
  subtotal: number;
  discount: number;
  manualDiscount?: number;
  total: number;
  discountAmount: number;
  onDiscountChange: (discount: number) => void;
  onManualDiscountChange?: (amount: number) => void;
  isWholesale?: boolean;
  manualDiscountEnabled?: boolean;
}

const SaleTotals = ({
  subtotal,
  discount,
  manualDiscount = 0,
  total,
  discountAmount,
  onDiscountChange,
  onManualDiscountChange,
  isWholesale = false,
  manualDiscountEnabled = true
}: SaleTotalsProps) => {
  const { toast } = useToast();

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Label htmlFor="discount">Overall Discount (%):</Label>
            <div className="flex items-center relative">
              <Percent className="absolute left-2 h-4 w-4 text-muted-foreground" />
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                className="pl-8 w-24"
                value={discount}
                onChange={(e) => onDiscountChange(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {isWholesale && (
            <Badge variant="outline" className="bg-blue-50">
              <Package className="h-3 w-3 mr-1" />
              Wholesale Transaction
            </Badge>
          )}
        </div>

        {manualDiscountEnabled && (
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="manual-discount">Manual Discount (₦):</Label>
              <div className="flex items-center relative">
                <span className="absolute left-2 text-muted-foreground font-medium">₦</span>
                <Input
                  id="manual-discount"
                  type="number"
                  placeholder="500 - 1000"
                  className="pl-6 w-32"
                  value={manualDiscount || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    // Handle empty/NaN as 0
                    if (isNaN(val)) {
                      onManualDiscountChange?.(0);
                      return;
                    }
                    onManualDiscountChange?.(val);
                  }}
                  onBlur={() => {
                    if (manualDiscount > 0 && (manualDiscount < 500 || manualDiscount > 1000)) {
                      toast({
                        title: "Invalid Discount",
                        description: `Manual discount must be between ₦500 and ₦1,000`,
                        variant: "destructive",
                      });
                    }
                  }}
                />
              </div>
            </div>
            <p className={`text-[10px] italic ${manualDiscount > 0 && (manualDiscount < 500 || manualDiscount > 1000) ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
              Range: ₦500 - ₦1,000
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>₦{subtotal.toFixed(2)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Discount:</span>
            <span>-₦{discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold">
          <span>Total:</span>
          <span>₦{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default SaleTotals;
