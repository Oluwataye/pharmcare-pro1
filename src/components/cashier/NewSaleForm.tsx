import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Plus, Printer, Tag, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductSearch } from "./ProductSearch";
import { SaleItemsTable } from "./SaleItemsTable";
import { useSalesPrinting } from "@/hooks/sales/useSalesPrinting";
import { useSalesCompletion } from "@/hooks/sales/useSalesCompletion";
import { SaleItem } from "@/types/sales";
import SaleTotals from "../sales/SaleTotals";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface NewSaleFormProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  category: string;
}

export function NewSaleForm({ onComplete, onCancel }: NewSaleFormProps) {
  const [items, setItems] = useState<SaleItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showSearch, setShowSearch] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [isWholesale, setIsWholesale] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { handlePrint } = useSalesPrinting(items, discount, isWholesale ? 'wholesale' : 'retail');
  
  const form = useForm({
    defaultValues: {
      customerName: "",
      customerPhone: "",
    },
  });

  // Fetch products from inventory
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('id, name, price, quantity, sku, category')
        .gt('quantity', 0)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Calculate total and discount amounts
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  const filteredProducts = products.filter(
    product => product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddItem = () => {
    if (!selectedProduct) {
      toast({
        title: "Error",
        description: "Please select a product first",
        variant: "destructive",
      });
      return;
    }

    if (quantity <= 0) {
      toast({
        title: "Error",
        description: "Quantity must be greater than zero",
        variant: "destructive",
      });
      return;
    }

    // Check stock availability
    if (quantity > selectedProduct.quantity) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${selectedProduct.quantity} units available for ${selectedProduct.name}`,
        variant: "destructive",
      });
      return;
    }

    const retailPrice = selectedProduct.price;
    const wholesalePrice = selectedProduct.price * 0.9; // 10% discount for wholesale
    const price = isWholesale ? wholesalePrice : retailPrice;
    const existingItemIndex = items.findIndex(item => item.id === selectedProduct.id && item.isWholesale === isWholesale);
    
    if (existingItemIndex >= 0) {
      const newQuantity = items[existingItemIndex].quantity + quantity;
      
      // Check total quantity against stock
      if (newQuantity > selectedProduct.quantity) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${selectedProduct.quantity} units available for ${selectedProduct.name}`,
          variant: "destructive",
        });
        return;
      }
      
      const newItems = [...items];
      newItems[existingItemIndex].quantity = newQuantity;
      newItems[existingItemIndex].total = newItems[existingItemIndex].quantity * newItems[existingItemIndex].price;
      setItems(newItems);
    } else {
      setItems([
        ...items,
        {
          id: selectedProduct.id,
          name: selectedProduct.name,
          quantity: quantity,
          price: price,
          unitPrice: retailPrice,
          total: price * quantity,
          isWholesale: isWholesale,
          discount: 0
        },
      ]);
    }

    setSelectedProduct(null);
    setQuantity(1);
    setSearchQuery("");
    setShowSearch(false);
  };

  const handleToggleWholesale = () => {
    setIsWholesale(!isWholesale);
  };

  const handleToggleItemPriceType = (id: string) => {
    const itemIndex = items.findIndex(item => item.id === id);
    if (itemIndex === -1) return;
    
    const item = items[itemIndex];
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    const retailPrice = product.price;
    const wholesalePrice = product.price * 0.9;
    const newPrice = item.isWholesale ? retailPrice : wholesalePrice;
    const newItems = [...items];
    newItems[itemIndex] = {
      ...item,
      isWholesale: !item.isWholesale,
      price: newPrice,
      total: newPrice * item.quantity
    };
    
    setItems(newItems);
  };

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setItems(items.filter(item => item.id !== id));
      return;
    }
    
    const newItems = items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          quantity: newQuantity,
          total: item.price * newQuantity
        };
      }
      return item;
    });
    
    setItems(newItems);
  };

  const handleCompleteSale = async () => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the sale",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Prepare sale data with proper discount
      const saleData = {
        items: items.map(item => ({
          ...item,
          unitPrice: item.unitPrice || item.price
        })),
        total: total,
        discount: discount,
        customerName: form.getValues().customerName,
        customerPhone: form.getValues().customerPhone,
        saleType: isWholesale ? 'wholesale' : 'retail',
        transactionId: `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        cashierName: user?.name,
        cashierEmail: user?.email,
        cashierId: user?.id,
      };

      // Save sale to database via edge function
      const { data, error } = await supabase.functions.invoke('complete-sale', {
        body: saleData
      });

      if (error) {
        throw new Error(error.message || 'Failed to complete sale');
      }

      if (!data.success) {
        throw new Error('Sale completion failed');
      }

      toast({
        title: `${isWholesale ? 'Wholesale' : 'Retail'} Sale Completed`,
        description: `Transaction ID: ${data.transactionId}`,
      });

      // Print receipt after successful sale
      try {
        await handlePrint({
          customerInfo: {
            customerName: form.getValues().customerName || 'Walk-in Customer',
            customerPhone: form.getValues().customerPhone || 'N/A',
            cashierName: user?.name,
            cashierEmail: user?.email,
            cashierId: user?.id,
          }
        });
      } catch (printError) {
        console.error("Print receipt error:", printError);
        // Don't fail the sale if printing fails
      }

      // Clear form and refresh products
      form.reset();
      await fetchProducts();
      
      onComplete();
    } catch (error) {
      console.error("Complete sale error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete sale. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{isWholesale ? 'New Wholesale Sale' : 'New Retail Sale'}</h2>
        <Button 
          variant="outline" 
          onClick={handleToggleWholesale}
          className="flex items-center gap-2"
        >
          <Tag className="h-4 w-4" />
          {isWholesale ? 'Switch to Retail' : 'Switch to Wholesale'}
        </Button>
      </div>

      <Form {...form}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Name (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter customer name" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="customerPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Phone (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter customer phone" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </Form>

      <div className="border p-4 rounded-md">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold">Items</h3>
          {isLoadingProducts ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading products...
            </div>
          ) : showSearch ? (
            <div className="flex flex-col md:flex-row gap-4">
              <ProductSearch
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filteredProducts={filteredProducts}
                onProductSelect={(product) => {
                  setSelectedProduct(product);
                  setSearchQuery(product.name);
                }}
              />
              <Input 
                type="number" 
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-20"
                placeholder="Qty"
              />
              <Button onClick={handleAddItem} disabled={isLoadingProducts}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          ) : (
            <Button onClick={() => setShowSearch(true)} disabled={isLoadingProducts}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          )}
        </div>

        <SaleItemsTable 
          items={items} 
          onRemoveItem={(id) => setItems(items.filter(item => item.id !== id))}
          onUpdateQuantity={handleUpdateQuantity}
          onTogglePriceType={handleToggleItemPriceType}
          isWholesale={isWholesale}
        />
        
        <SaleTotals
          subtotal={subtotal}
          discount={discount}
          total={total}
          discountAmount={discountAmount}
          onDiscountChange={setDiscount}
          isWholesale={isWholesale}
        />
      </div>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleCompleteSale} disabled={isLoading || items.length === 0}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Printer className="mr-2 h-4 w-4" />
              Complete Sale
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
