
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

  const {
    items,
    discount,
    saleType,
    addItem,
    removeItem,
    updateQuantity,
    toggleItemPriceType,
    setOverallDiscount,
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
    isOfflineMode
  } = useSales({
    cashierName: user ? user.username || user.name : undefined,
    cashierEmail: user ? user.email : undefined,
    cashierId: user ? user.id : undefined
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

    try {
      logSecurityEvent('SALE_COMPLETION_ATTEMPT', {
        userId: user.id,
        saleType,
        itemCount: items.length,
        total: calculateTotal()
      });

      const success = await completeSale({
        customerName,
        customerPhone,
        businessName: saleType === 'wholesale' ? businessName : undefined,
        businessAddress: saleType === 'wholesale' ? businessAddress : undefined,
        saleType
      });

      if (success) {
        logSecurityEvent('SALE_COMPLETED', {
          userId: user.id,
          saleType,
          total: calculateTotal()
        });

        try {
          await handlePrint({
            cashierName: user.username || user.name,
            cashierEmail: user.email,
            cashierId: user.id,
            customerName: customerName || undefined,
            customerPhone: customerPhone || undefined,
            businessName: saleType === 'wholesale' ? businessName : undefined,
            businessAddress: saleType === 'wholesale' ? businessAddress : undefined,
          });
        } catch (error) {
          console.error("Print failed but sale was completed", error);
        }

        navigate("/sales");
      }
    } catch (error) {
      logSecurityEvent('SALE_COMPLETION_FAILED', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      toast({
        title: "Error",
        description: "Failed to complete sale",
        variant: "destructive",
      });
    }
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
          <Button onClick={handleCompleteSale}>
            {isOfflineMode ? (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Offline
              </>
            ) : (
              "Complete Sale"
            )}
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              {saleType === 'wholesale' ? 'Wholesale Order' : 'Customer Info'}
            </CardTitle>
          </CardHeader>
          <CardContent className="sensitive-data">
            <div className="space-y-4">
              {validationErrors.general && (
                <div className="text-red-500 text-sm">{validationErrors.general}</div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="customer-name">
                    {saleType === 'wholesale' ? 'Contact Person' : 'Customer Name'}
                  </Label>
                  <Input
                    id="customer-name"
                    value={customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    placeholder={saleType === 'wholesale' ? 'Contact person name' : 'Customer name'}
                    className={validationErrors.customerName ? 'border-red-500' : ''}
                    maxLength={100}
                  />
                  {validationErrors.customerName && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.customerName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="customer-phone">Phone Number</Label>
                  <Input
                    id="customer-phone"
                    value={customerPhone}
                    onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                    placeholder="Phone number"
                    className={validationErrors.customerPhone ? 'border-red-500' : ''}
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
                    <Label htmlFor="business-name" className="text-red-500">Business Name*</Label>
                    <Input
                      id="business-name"
                      value={businessName}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      placeholder="Business name"
                      required
                      className={validationErrors.businessName ? 'border-red-500' : ''}
                      maxLength={200}
                    />
                    {validationErrors.businessName && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.businessName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="business-address">Business Address</Label>
                    <Input
                      id="business-address"
                      value={businessAddress}
                      onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                      placeholder="Business address"
                      className={validationErrors.businessAddress ? 'border-red-500' : ''}
                      maxLength={500}
                    />
                    {validationErrors.businessAddress && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.businessAddress}</p>
                    )}
                  </div>
                </div>
              )}

              <ProductSearchSection
                onAddProduct={(product, quantity) => {
                  console.log('NewSale: onAddProduct called', { product, quantity, saleType });
                  try {
                    const result = addItem(product, quantity, saleType === 'wholesale');
                    console.log('NewSale: addItem result', result.success ? 'Success' : 'Failed', result);
                  } catch (error) {
                    console.error('NewSale: Error in addItem', error);
                  }
                }}
                isWholesale={saleType === 'wholesale'}
              />
            </div>
          </CardContent>
        </Card>

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
                  total={calculateTotal()}
                  discountAmount={calculateDiscountAmount()}
                  onDiscountChange={setOverallDiscount}
                  isWholesale={saleType === 'wholesale'}
                />

                <div className="mt-4 flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={() => handlePrint({
                      cashierName: user ? user.username || user.name : undefined,
                      cashierEmail: user ? user.email : undefined,
                      cashierId: user ? user.id : undefined,
                      customerName: customerName || undefined,
                      customerPhone: customerPhone || undefined,
                      businessName: saleType === 'wholesale' ? businessName : undefined,
                      businessAddress: saleType === 'wholesale' ? businessAddress : undefined
                    })}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print Receipt
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
          onPrint={executePrint}
        />
      )}
    </div>
  );
};

export default NewSale;
