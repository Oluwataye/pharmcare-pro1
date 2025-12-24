
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Percent, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SaleTotalsProps {
  subtotal: number;
  discount: number;
  total: number;
  discountAmount: number;
  onDiscountChange: (discount: number) => void;
  isWholesale?: boolean;
}

const SaleTotals = ({ 
  subtotal, 
  discount, 
  total, 
  discountAmount, 
  onDiscountChange,
  isWholesale = false
}: SaleTotalsProps) => {
  return (
    <div className="mt-4 space-y-4">
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
