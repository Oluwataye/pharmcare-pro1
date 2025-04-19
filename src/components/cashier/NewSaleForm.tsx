
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Plus, Trash2, Search, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NewSaleFormProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface SaleItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

const productDatabase = [
  { id: '1', name: 'Paracetamol', price: 500, stock: 100 },
  { id: '2', name: 'Amoxicillin', price: 1500, stock: 50 },
  { id: '3', name: 'Vitamin C', price: 800, stock: 75 },
  { id: '4', name: 'Ibuprofen', price: 600, stock: 60 },
  { id: '5', name: 'Aspirin', price: 450, stock: 80 },
];

export function NewSaleForm({ onComplete, onCancel }: NewSaleFormProps) {
  const [items, setItems] = useState<SaleItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<typeof productDatabase[0] | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showSearch, setShowSearch] = useState(false);
  const { toast } = useToast();
  
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

    const existingItemIndex = items.findIndex(item => item.id === selectedProduct.id);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const newItems = [...items];
      newItems[existingItemIndex].quantity += quantity;
      newItems[existingItemIndex].total = newItems[existingItemIndex].quantity * newItems[existingItemIndex].price;
      setItems(newItems);
    } else {
      // Add new item
      setItems([
        ...items,
        {
          id: selectedProduct.id,
          name: selectedProduct.name,
          quantity: quantity,
          price: selectedProduct.price,
          total: selectedProduct.price * quantity,
        },
      ]);
    }

    // Reset selection
    setSelectedProduct(null);
    setQuantity(1);
    setSearchQuery("");
    setShowSearch(false);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const printReceipt = () => {
    try {
      // Create print content
      const printContent = `
        <html>
          <head>
            <title>Sale Receipt</title>
            <style>
              body { font-family: monospace; font-size: 12px; }
              .header { text-align: center; margin-bottom: 10px; }
              .item { margin: 5px 0; }
              .total { margin-top: 10px; border-top: 1px solid #000; }
              .customer-info { margin-top: 5px; margin-bottom: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>PharmaCare Pro</h2>
              <p>Sale Receipt</p>
              <p>${new Date().toLocaleString()}</p>
            </div>
            <div class="customer-info">
              <p>Customer: ${form.getValues().customerName || 'Walk-in Customer'}</p>
              <p>Phone: ${form.getValues().customerPhone || 'N/A'}</p>
            </div>
            ${items.map(item => `
              <div class="item">
                ${item.name}<br/>
                ${item.quantity} x ₦${item.price} = ₦${item.total}
              </div>
            `).join('')}
            <div class="total">
              <p>Total: ₦${calculateTotal()}</p>
            </div>
            <div style="text-align: center; margin-top: 20px;">
              <p>Thank you for your purchase!</p>
            </div>
          </body>
        </html>
      `;

      // Create a hidden iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      iframe.contentDocument?.write(printContent);
      iframe.contentDocument?.close();

      // Print and remove iframe
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);

      toast({
        title: "Success",
        description: "Receipt printed successfully",
      });

      // Complete the sale after printing
      onComplete();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to print receipt",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = () => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the sale",
        variant: "destructive",
      });
      return;
    }

    // Trigger print receipt before completing sale
    printReceipt();
  };

  return (
    <div className="space-y-6">
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
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search products..." 
                  className="pl-8 w-full md:w-[250px]" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                {searchQuery && (
                  <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredProducts.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-muted-foreground">No products found</div>
                    ) : (
                      filteredProducts.map(product => (
                        <div 
                          key={product.id}
                          className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setSelectedProduct(product);
                            setSearchQuery(product.name);
                          }}
                        >
                          {product.name} - ₦{product.price}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
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

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Price (₦)</TableHead>
              <TableHead className="text-right">Total (₦)</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No items added</TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{item.price}</TableCell>
                  <TableCell className="text-right">{item.total}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
            {items.length > 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-right font-bold">Total:</TableCell>
                <TableCell className="text-right font-bold">₦{calculateTotal()}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>
          <Printer className="mr-2 h-4 w-4" />
          Complete Sale
        </Button>
      </div>
    </div>
  );
}
