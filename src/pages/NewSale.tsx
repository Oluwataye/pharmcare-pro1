
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useSales } from "@/hooks/useSales";
import { useShift } from "@/hooks/useShift";
import { secureStorage } from "@/lib/secureStorage";
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
import { useSystemConfig } from "@/hooks/useSystemConfig";
import PaymentModeSelector, { PaymentMode } from "@/components/sales/PaymentModeSelector";

// Add useCallback to imports
// (Assuming React imports are at top, but safely merging if possible, otherwise we rely on user manually correcting or assume React has it)
// Checking imports...
// import { useState, useEffect } from "react"; -> import { useState, useEffect, useCallback } from "react";


const NewSale = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isOnline } = useOffline();
  const { canCreateWholesale } = usePermissions();

  const [customerName, setCustomerName] = useState(() => secureStorage.getItem('CURRENT_SALE_CUSTOMER_NAME') || "");
  const [customerPhone, setCustomerPhone] = useState(() => secureStorage.getItem('CURRENT_SALE_CUSTOMER_PHONE') || "");
  const [businessName, setBusinessName] = useState(() => secureStorage.getItem('CURRENT_SALE_BUSINESS_NAME') || "");
  const [businessAddress, setBusinessAddress] = useState(() => secureStorage.getItem('CURRENT_SALE_BUSINESS_ADDRESS') || "");

  // Persist customer info
  useEffect(() => {
    secureStorage.setItem('CURRENT_SALE_CUSTOMER_NAME', customerName);
  }, [customerName]);

  useEffect(() => {
    secureStorage.setItem('CURRENT_SALE_CUSTOMER_PHONE', customerPhone);
  }, [customerPhone]);

  useEffect(() => {
    secureStorage.setItem('CURRENT_SALE_BUSINESS_NAME', businessName);
  }, [businessName]);

  useEffect(() => {
    secureStorage.setItem('CURRENT_SALE_BUSINESS_ADDRESS', businessAddress);
  }, [businessAddress]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastCompletedSaleId, setLastCompletedSaleId] = useState<string | null>(null);
  const [lastCompletedItems, setLastCompletedItems] = useState<any[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const [payments, setPayments] = useState<PaymentMode[]>([{ mode: 'cash', amount: 0 }]);
  const [resetKey, setResetKey] = useState(0); // Key to force re-render of child components
  const { config: systemConfig } = useSystemConfig();
  const { activeShift } = useShift();

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
    dispenserName: user ? (user.name || user.username || user.email?.split('@')[0] || 'Staff') : 'Staff',
    dispenserEmail: user ? user.email : undefined,
    dispenserId: user ? user.id : undefined,
    staffRole: user?.role
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

  const total = calculateTotal();

  // Sync default payment amount when total changes (only if single payment mode)
  useEffect(() => {
    if (payments && payments.length === 1) {
      setPayments([{ ...payments[0], amount: total }]);
    }
  }, [total]); // We intentionally omit payments to avoid loops, as we only want to update on TOTAL change

  const handleCompleteSale = async () => {
    if (!payments) {
      console.error("Critical: Payments state is undefined");
      toast({ title: "Error", description: "System state error. Please refresh.", variant: "destructive" });
      return;
    }

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

    const paymentTotal = payments.reduce((sum, p) => sum + p.amount, 0);
    // Allow small floating point error
    if (Math.abs(paymentTotal - total) > 0.05) {
      toast({
        title: "Payment Error",
        description: `Payment total (₦${paymentTotal.toLocaleString()}) does not match transaction total (₦${total.toLocaleString()})`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCompleting(true);
      const transactionId = `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const printWindow = openPrintWindow();
      const currentItems = [...items];

      logSecurityEvent('SALE_COMPLETION_ATTEMPT', {
        userId: user.id,
        saleType,
        itemCount: items.length,
        total: calculateTotal(),
        transactionId
      });

      const result = await completeSale({
        customerName,
        customerPhone,
        businessName: saleType === 'wholesale' ? businessName : undefined,
        businessAddress: saleType === 'wholesale' ? businessAddress : undefined,
        saleType,
        transactionId,
        payments,
        existingWindow: printWindow,
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
        setPayments([{ mode: 'cash', amount: 0 }]); // Reset payments
        setCustomerName("");
        setCustomerPhone("");
        setBusinessName("");
        setBusinessAddress("");
        setResetKey(prev => prev + 1); // Force reset of search section
        setIsSuccessModalOpen(true);
      }
    } catch (error) {
      logSecurityEvent('SALE_COMPLETION_FAILED', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      toast({
        title: "Error",
        description: "Failed to save sale record. The operation was cancelled.",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F9") {
        e.preventDefault();
        // Use a ref or call the handler directly if it wasn't recreated
        // But since we rely on current state, we invoke the function which closes over state
        handleCompleteSale();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCompleteSale]); // Critical: Update listener when handler changes (due to new state)

  const handleManualPrint = () => {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">New Sale</h1>
          {!isOnline && (
            <p className="text-sm text-amber-600">Working in offline mode - sale will sync when you're back online</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/sales")}>
            Cancel
          </Button>
          <Button
            onClick={handleCompleteSale}
            disabled={isCompleting || !activeShift}
            title={!activeShift ? "You must start a shift before recording sales" : ""}
          >
            {isCompleting ? "Processing..." : (isOfflineMode ? (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Offline
              </>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                Print Receipt
              </>
            ))}
          </Button>
        </div>
      </div>

      {canCreateWholesale && (
        <Tabs
          defaultValue={saleType}
          onValueChange={(value) => setSaleType(value as 'retail' | 'wholesale')}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="retail" className="flex items-center">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Retail Sale
            </TabsTrigger>
            <TabsTrigger value="wholesale" className="flex items-center">
              <Package className="mr-2 h-4 w-4" />
              Wholesale
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          {/* 1. Product Search (Top Priority) */}
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center">
                  <Package className="mr-2 h-5 w-5 text-primary" />
                  Product Search
                </div>
                <Badge variant="outline" className="font-normal text-xs">
                  F2 to Focus
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductSearchSection
                key={resetKey} // Force reset on sale completion
                onAddProduct={(product, quantity, selectedUnit) => {
                  try {
                    addItem(product, quantity, saleType === 'wholesale', selectedUnit);
                  } catch (error) {
                    console.error('NewSale: Error in addItem', error);
                  }
                }}
                isWholesale={saleType === 'wholesale'}
              />
            </CardContent>
          </Card>

          {/* 2. Customer Info (Secondary) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center text-muted-foreground">
                <Shield className="mr-2 h-4 w-4" />
                {saleType === 'wholesale' ? 'Wholesale Details' : 'Customer Details (Optional)'}
              </CardTitle>
            </CardHeader>
            <CardContent className="sensitive-data">
              <div className="space-y-4">
                {validationErrors.general && (
                  <div className="text-red-500 text-sm">{validationErrors.general}</div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="customer-name" className="text-xs">
                      {saleType === 'wholesale' ? 'Contact Person' : 'Customer Name'}
                    </Label>
                    <Input
                      id="customer-name"
                      value={customerName}
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      placeholder={saleType === 'wholesale' ? 'Contact person' : 'Walk-in Customer'}
                      className={validationErrors.customerName ? 'border-red-500 h-8' : 'h-8'}
                      maxLength={100}
                    />
                    {validationErrors.customerName && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.customerName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="customer-phone" className="text-xs">Phone Number</Label>
                    <Input
                      id="customer-phone"
                      value={customerPhone}
                      onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                      placeholder="Phone"
                      className={validationErrors.customerPhone ? 'border-red-500 h-8' : 'h-8'}
                      maxLength={20}
                    />
                    {validationErrors.customerPhone && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.customerPhone}</p>
                    )}
                  </div>
                </div>

                {saleType === 'wholesale' && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="business-name" className="text-red-500 text-xs">Business Name*</Label>
                      <Input
                        id="business-name"
                        value={businessName}
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                        placeholder="Business name"
                        required
                        className={validationErrors.businessName ? 'border-red-500 h-8' : 'h-8'}
                        maxLength={200}
                      />
                      {validationErrors.businessName && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.businessName}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="business-address" className="text-xs">Business Address</Label>
                      <Input
                        id="business-address"
                        value={businessAddress}
                        onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                        placeholder="Address"
                        className={validationErrors.businessAddress ? 'border-red-500 h-8' : 'h-8'}
                        maxLength={500}
                      />
                      {validationErrors.businessAddress && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.businessAddress}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{saleType === 'wholesale' ? 'Wholesale Order Items' : 'Current Sale'}</CardTitle>
          </CardHeader>
          <CardContent>
            <CurrentSaleTable
              items={items}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
              onTogglePriceType={canCreateWholesale ? toggleItemPriceType : undefined}
              isWholesale={saleType === 'wholesale'}
            />

            {items.length > 0 && (
              <>
                <SaleTotals
                  subtotal={calculateSubtotal()}
                  discount={discount}
                  manualDiscount={manualDiscount}
                  total={calculateTotal()}
                  discountAmount={calculateDiscountAmount()}
                  onDiscountChange={setOverallDiscount}
                  onManualDiscountChange={setManualDiscount}
                  isWholesale={saleType === 'wholesale'}
                  manualDiscountEnabled={systemConfig.manualDiscountEnabled}
                />

                <div className="mt-6">
                  <PaymentModeSelector
                    total={total}
                    payments={payments}
                    onPaymentsChange={setPayments}
                  />
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={handleManualPrint}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print Draft / Quote
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {previewData && (
        <ReceiptPreview
          open={showPreview}
          onOpenChange={setShowPreview}
          receiptData={previewData}
          onPrint={() => {
            const windowRef = openPrintWindow();
            executePrint(undefined, windowRef);
          }}
        />
      )}

      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-green-600">Sale Successful!</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-4 py-6">
            <div className="rounded-full bg-green-100 p-3">
              <Shield className="h-12 w-12 text-green-600" />
            </div>
            <p className="text-center text-muted-foreground">
              Transaction has been completed successfully. The receipt should be printing now.
            </p>
          </div>
          <DialogFooter className="flex sm:justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const windowRef = openPrintWindow();
                handlePrint({
                  saleId: lastCompletedSaleId || undefined,
                  items: lastCompletedItems,
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
      </Dialog>
    </div>
  );
};

export default NewSale;
