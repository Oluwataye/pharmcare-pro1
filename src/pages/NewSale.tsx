
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
import { Printer, Save, ShoppingBag, Package } from "lucide-react";
import ProductSearchSection from "@/components/sales/ProductSearchSection";
import CurrentSaleTable from "@/components/sales/CurrentSaleTable";
import SaleTotals from "@/components/sales/SaleTotals";
import { useOffline } from "@/contexts/OfflineContext";

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
    completeSale,
    isOfflineMode
  } = useSales({ 
    cashierName: user ? user.username || user.name : undefined,
    cashierEmail: user ? user.email : undefined,
    cashierId: user ? user.id : undefined
  });

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

    // For wholesale, business name is required
    if (saleType === 'wholesale' && !businessName) {
      toast({
        title: "Error",
        description: "Business name is required for wholesale orders",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await completeSale({
        customerName,
        customerPhone,
        businessName: saleType === 'wholesale' ? businessName : undefined,
        businessAddress: saleType === 'wholesale' ? businessAddress : undefined,
        saleType
      });
      
      if (success) {
        try {
          await handlePrint({
            customerInfo: { 
              cashierName: user.username || user.name,
              cashierEmail: user.email,
              customerName,
              customerPhone,
              businessName: saleType === 'wholesale' ? businessName : undefined,
              businessAddress: saleType === 'wholesale' ? businessAddress : undefined,
            }
          });
        } catch (error) {
          // Continue even if printing fails
          console.error("Print failed but sale was completed", error);
        }
        
        navigate("/sales");
      }
    } catch (error) {
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
            <CardTitle>{saleType === 'wholesale' ? 'Wholesale Order' : 'Customer Info'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="customer-name">
                    {saleType === 'wholesale' ? 'Contact Person' : 'Customer Name'}
                  </Label>
                  <Input 
                    id="customer-name" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={saleType === 'wholesale' ? 'Contact person name' : 'Customer name'}
                  />
                </div>
                <div>
                  <Label htmlFor="customer-phone">Phone Number</Label>
                  <Input 
                    id="customer-phone" 
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone number" 
                  />
                </div>
              </div>
              
              {saleType === 'wholesale' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="business-name" className="text-red-500">Business Name*</Label>
                    <Input 
                      id="business-name" 
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Business name"
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="business-address">Business Address</Label>
                    <Input 
                      id="business-address" 
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      placeholder="Business address" 
                    />
                  </div>
                </div>
              )}
              
              <ProductSearchSection 
                onAddProduct={(product, quantity) => addItem(product, quantity, saleType === 'wholesale')} 
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
                      customerInfo: { 
                        cashierName: user ? user.username || user.name : undefined,
                        cashierEmail: user ? user.email : undefined,
                        customerName,
                        customerPhone,
                        businessName: saleType === 'wholesale' ? businessName : undefined,
                        businessAddress: saleType === 'wholesale' ? businessAddress : undefined
                      }
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
    </div>
  );
};

export default NewSale;
