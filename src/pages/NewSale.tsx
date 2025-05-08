
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useSales } from "@/hooks/useSales";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, Save } from "lucide-react";
import ProductSearchSection from "@/components/sales/ProductSearchSection";
import CurrentSaleTable from "@/components/sales/CurrentSaleTable";
import SaleTotals from "@/components/sales/SaleTotals";
import { useOffline } from "@/contexts/OfflineContext";

const NewSale = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isOnline } = useOffline();
  
  const {
    items,
    discount,
    addItem,
    removeItem,
    updateQuantity,
    setOverallDiscount,
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

    try {
      const success = await completeSale({
        // Can add customer info here if we have a form for it
      });
      
      if (success) {
        try {
          await handlePrint({
            customerInfo: { 
              cashierName: user.username || user.name,
              cashierEmail: user.email
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add Products</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductSearchSection onAddProduct={addItem} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Sale</CardTitle>
          </CardHeader>
          <CardContent>
            <CurrentSaleTable 
              items={items} 
              onUpdateQuantity={updateQuantity} 
              onRemoveItem={removeItem}
            />
            
            {items.length > 0 && (
              <>
                <SaleTotals 
                  subtotal={calculateSubtotal()}
                  discount={discount}
                  total={calculateTotal()}
                  discountAmount={calculateDiscountAmount()}
                  onDiscountChange={setOverallDiscount}
                />
                
                <div className="mt-4 flex justify-between items-center">
                  <Button 
                    variant="outline" 
                    onClick={() => handlePrint({ 
                      customerInfo: { 
                        cashierName: user ? user.username || user.name : undefined,
                        cashierEmail: user ? user.email : undefined
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
