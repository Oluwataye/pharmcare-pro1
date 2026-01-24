
import { useToast } from "@/hooks/use-toast";

// ... existing imports

const SaleTotals = ({
  // ... props
}: SaleTotalsProps) => {
  const { toast } = useToast();

  return (
    <div className="mt-4 space-y-4">
      {/* ... existing code ... */}
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
      {/* ... existing code ... */}
    </div>
  );
};

export default SaleTotals;
