import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Plus, Printer, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductSearch } from "./ProductSearch";
import { SaleItemsTable } from "./SaleItemsTable";
import { useSalesPrinting } from "@/hooks/sales/useSalesPrinting";
import { useSalesCompletion } from "@/hooks/sales/useSalesCompletion";
import { useAuth } from "@/contexts/AuthContext";
import { SaleItem } from "@/types/sales";
import SaleTotals from "../sales/SaleTotals";

interface NewSaleFormProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface Product {
  id: string;
  name: string;
  price: number;
  wholesalePrice: number;
  stock: number;
}

const productDatabase: Product[] = [
  { id: '1', name: 'Paracetamol', price: 500, wholesalePrice: 450, stock: 100 },
  { id: '2', name: 'Amoxicillin', price: 1500, wholesalePrice: 1350, stock: 50 },
  { id: '3', name: 'Vitamin C', price: 800, wholesalePrice: 720, stock: 75 },
  { id: '4', name: 'Ibuprofen', price: 600, wholesalePrice: 540, stock: 60 },
  { id: '5', name: 'Aspirin', price: 450, wholesalePrice: 400, stock: 80 },
];

export function NewSaleForm({ onComplete, onCancel }: NewSaleFormProps) {
  const [items, setItems] = useState<SaleItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showSearch, setShowSearch] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [isWholesale, setIsWholesale] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const { handlePrint, openPrintWindow } = useSalesPrinting(items, discount, isWholesale ? 'wholesale' : 'retail');

  // Calculate total and discount amounts
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  const { completeSale } = useSalesCompletion(
    items,
    () => total,
    () => setItems([]),
    () => setDiscount(0),
    () => setIsWholesale(false)
  );

  const form = useForm({
    defaultValues: {
      customerName: "",
      customerPhone: "",
    },
  });

  const filteredProducts = productDatabase.filter(
    product => product.name.toLowerCase().includes(searchQuery.toLowerCase())
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

    const price = isWholesale ? selectedProduct.wholesalePrice : selectedProduct.price;
    const existingItemIndex = items.findIndex(item => item.id === selectedProduct.id && item.isWholesale === isWholesale);

    if (existingItemIndex >= 0) {
      const newItems = [...items];
      newItems[existingItemIndex].quantity += quantity;
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
          total: price * quantity,
          isWholesale: isWholesale,
          unitPrice: price // Important for sales tracking
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
    const product = productDatabase.find(p => p.id === id);
    if (!product) return;

    const newPrice = item.isWholesale ? product.price : product.wholesalePrice;
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

  const handleCompleteAndPrint = async () => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the sale",
        variant: "destructive",
      });
      return;
    }

    try {
      // 1. Generate Transaction ID client-side immediately
      const transactionId = `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // 2. Capture the window synchronously
      const printWindow = openPrintWindow();
      const currentItems = [...items];

      // 3. EXECUTE PRINT *IMMEDIATELY* (Optimistic UI)
      handlePrint({
        customerName: form.getValues().customerName || undefined,
        customerPhone: form.getValues().customerPhone || undefined,
        cashierName: user ? user.username || user.name : undefined,
        cashierEmail: user ? user.email : undefined,
        cashierId: user ? user.id : undefined,
        existingWindow: printWindow,
        directPrint: true,
        items: currentItems,
        saleId: transactionId
      });

      // 4. SAVE THE SALE IN BACKGROUND (with the same ID)
      await completeSale({
        customerName: form.getValues().customerName,
        customerPhone: form.getValues().customerPhone,
        saleType: isWholesale ? 'wholesale' : 'retail',
        transactionId,
        cashierName: user ? user.username || user.name : undefined,
        cashierEmail: user ? user.email : undefined,
        cashierId: user ? user.id : undefined,
      });

      // 5. Notify Parent
      onComplete();

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process sale",
        variant: "destructive",
      });
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
          {showSearch ? (
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
              />
              <Button onClick={handleAddItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          ) : (
            <Button onClick={() => setShowSearch(true)}>
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
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleCompleteAndPrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt
        </Button>
      </div>
    </div>
  );
}
