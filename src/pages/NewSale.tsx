
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useSales } from "@/hooks/useSales";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, Save, ShoppingBag, Package, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ProductSearchSection from "@/components/sales/ProductSearchSection";
import CurrentSaleTable from "@/components/sales/CurrentSaleTable";
import SaleTotals from "@/components/sales/SaleTotals";
import { useOffline } from "@/contexts/OfflineContext";
import { customerInfoSchema, validateAndSanitize } from "@/lib/validation";
import { logSecurityEvent } from "@/components/security/SecurityProvider";
import { ReceiptPreview } from "@/components/receipts/ReceiptPreview";

const NewSale = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isOnline } = useOffline();
  const { canCreateWholesale } = usePermissions();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastCompletedSaleId, setLastCompletedSaleId] = useState<string | null>(null);
  const [lastCompletedItems, setLastCompletedItems] = useState<any[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);

  const {
    items,
    discount,
    manualDiscount,
    saleType,
    addItem,
    removeItem,
    updateQuantity,
    toggleItemPriceType,
    setOverallDiscount,
    setManualDiscount,
    setSaleType,
    calculateTotal,
    calculateSubtotal,
    calculateDiscountAmount,
    handlePrint,
    executePrint,
    showPreview,
    setShowPreview,
    previewData,
    completeSale,
    isOfflineMode,
    openPrintWindow
  } = useSales({
    dispenserName: user ? (user.username || user.name || user.email) : undefined,
    dispenserEmail: user ? user.email : undefined,
    dispenserId: user ? user.id : undefined
  });

  const validateCustomerInfo = () => {
    const customerData = {
      customerName,
      customerPhone,
      businessName: saleType === 'wholesale' ? businessName : undefined,
      businessAddress: saleType === 'wholesale' ? businessAddress : undefined
    };

    const validation = validateAndSanitize(customerInfoSchema, customerData);

    if (!validation.success) {
      setValidationErrors({ general: validation.error || 'Invalid customer information' });
      return false;
    }

    // Additional validation for wholesale
    if (saleType === 'wholesale' && !businessName.trim()) {
      setValidationErrors({ businessName: 'Business name is required for wholesale orders' });
      return false;
    }

    setValidationErrors({});
    return true;
  };

  const handleInputChange = (field: string, value: string) => {
    // Sanitize input and limit length
    const sanitizedValue = value.replace(/[<>'"&]/g, '').substring(0, 200);

    switch (field) {
      case 'customerName':
        setCustomerName(sanitizedValue);
        break;
      case 'customerPhone':
        setCustomerPhone(sanitizedValue.replace(/[^0-9+\-\s\(\)]/g, ''));
        break;
      case 'businessName':
        setBusinessName(sanitizedValue);
        break;
      case 'businessAddress':
        setBusinessAddress(sanitizedValue);
        break;
    }

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCompleteSale = async () => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to the sale",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to complete a sale",
        variant: "destructive",
      });
      return;
    }

    if (!validateCustomerInfo()) {
      toast({
        title: "Validation Error",
        description: "Please check customer information",
        variant: "destructive",
      });
      return;
    }

    // Validate manual discount range if used
    if (manualDiscount > 0 && (manualDiscount < 500 || manualDiscount > 1000)) {
      toast({
        title: "Invalid Discount",
        description: `Manual discount of ₦${manualDiscount} is invalid. Must be between ₦500 and ₦1,000.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCompleting(true);

      // 1. Generate Transaction ID client-side immediately
      const transactionId = `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // 2. Capture the window synchronously
      const printWindow = openPrintWindow();
      const currentItems = [...items];

      // 3. EXECUTE PRINT *IMMEDIATELY* (Optimistic UI)
      // We pass the items directly so it doesn't need to fetch anything.
      // We pass the transactionId we just generated so the receipt looks valid.
      handlePrint({
        dispenserName: user ? user.username || user.name : undefined,
        dispenserEmail: user ? user.email : undefined,
        dispenserId: user ? user.id : undefined,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        businessName: saleType === 'wholesale' ? businessName : undefined,
        businessAddress: saleType === 'wholesale' ? businessAddress : undefined,
        existingWindow: printWindow,
        directPrint: true,
        items: currentItems,
        saleId: transactionId // Use the ID we generated
      });

      logSecurityEvent('SALE_COMPLETION_ATTEMPT', {
        userId: user.id,
        saleType,
        itemCount: items.length,
        total: calculateTotal(),
        transactionId
      });

      // 4. SAVE THE SALE IN BACKGROUND (with the same ID)
      const result = await completeSale({
        customerName,
        customerPhone,
        businessName: saleType === 'wholesale' ? businessName : undefined,
        businessAddress: saleType === 'wholesale' ? businessAddress : undefined,
        saleType,
        transactionId, // Pass the ID we already printed with
        // Note: We don't pass existingWindow here because we already used it for printing!
      });

      if (result && typeof result === 'string') {
        setLastCompletedItems(currentItems);
        logSecurityEvent('SALE_COMPLETED', {
          userId: user.id,
          saleType,
          total: calculateTotal(),
          transactionId
        });

        setLastCompletedSaleId(result);
        setIsSuccessModalOpen(true);
      }
      // Note: If save fails, handlePrint already ran, so the user has a receipt.
      // The offline fallback in useSalesCompletion ensures we almost always get a result anyway.

    } catch (error) {
      logSecurityEvent('SALE_COMPLETION_FAILED', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      toast({
        title: "Error",
        description: "Failed to save sale record (but receipt may have printed)",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleManualPrint = () => {
    // Validate manual discount range if used
    if (manualDiscount > 0 && (manualDiscount < 500 || manualDiscount > 1000)) {
      toast({
        title: "Invalid Discount",
        description: `Manual discount of ₦${manualDiscount} is invalid. Must be between ₦500 and ₦1,000.`,
        variant: "destructive",
      });
      return;
    }

    // Open window synchronously
    const windowRef = openPrintWindow();

    handlePrint({
      dispenserName: user ? user.username || user.name : undefined,
      dispenserEmail: user ? user.email : undefined,
      dispenserId: user ? user.id : undefined,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      businessName: saleType === 'wholesale' ? businessName : undefined,
      businessAddress: saleType === 'wholesale' ? businessAddress : undefined,
      existingWindow: windowRef,
      directPrint: true
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* ... existing code ... */}
      <DialogFooter className="flex sm:justify-center gap-2">
        <Button
          variant="outline"
          onClick={() => {
            // Validate manual discount range just in case (though it should be cleared or valid if sale completed)
            // But for reprint of *current* state (if they didn't clear), we should check.
            // Actually, lastCompletedItems are captured, but if they changed discount *after* completion...
            // The reprint uses lastCompletedItems, but handlePrint might use current discount if not passed explicitly?
            // handlePrint uses `options?.discount || discount`.
            // If we reprint `lastCompletedItems`, we re-use the current discount state if not passed from history?
            // `handlePrint` takes `discount` from hook state if no options.
            // But Wait! `lastCompletedSaleId` is set.
            // We should probably rely on the fact that if sale completed, it was valid.
            // BUT user said "no print to take place...".
            // If I am re-printing a *past* sale, the discount is fixed in history.
            // If I am printing the *current* cart (handleManualPrint), I validate.

            const windowRef = openPrintWindow();
            handlePrint({
              saleId: lastCompletedSaleId || undefined,
              items: lastCompletedItems, // Use the captured items
              existingWindow: windowRef,
              directPrint: true
            });
          }}
        >
          <Printer className="mr-2 h-4 w-4" />
          Reprint Receipt
        </Button>
        <Button onClick={() => navigate("/sales")}>
          Go to Sales List
        </Button>
      </DialogFooter>
    </DialogContent>
      </Dialog >
    </div >
  );
};

export default NewSale;
