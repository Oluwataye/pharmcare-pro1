import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Printer, X, Plus } from "lucide-react";

interface SaleItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

const NewSale = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);

  const searchProducts = (term: string) => {
    const mockProducts = [
      { id: "1", name: "Paracetamol", price: 500 },
      { id: "2", name: "Amoxicillin", price: 1200 },
    ];
    return mockProducts.filter(p => 
      p.name.toLowerCase().includes(term.toLowerCase())
    );
  };

  const addItem = (product: { id: string; name: string; price: number }) => {
    const existingItem = items.find(item => item.id === product.id);
    if (existingItem) {
      setItems(items.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setItems([...items, {
        ...product,
        quantity: 1,
        total: product.price
      }]);
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setItems(items.map(item =>
      item.id === id
        ? { ...item, quantity, total: quantity * item.price }
        : item
    ));
  };

  const handlePrint = async () => {
    try {
      if (!('printer' in navigator)) {
        throw new Error('Printing is not supported in this browser');
      }

      const printContent = `
        <html>
          <head>
            <title>Sale Receipt</title>
            <style>
              body { font-family: monospace; font-size: 12px; }
              .header { text-align: center; margin-bottom: 10px; }
              .item { margin: 5px 0; }
              .total { margin-top: 10px; border-top: 1px solid #000; }
              .footer { 
                margin-top: 20px; 
                text-align: center; 
                border-top: 1px solid #000; 
                padding-top: 10px; 
                font-size: 10px; 
                color: #666; 
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>PharmaCare Pro</h2>
              <p>Sale Receipt</p>
              <p>${new Date().toLocaleString()}</p>
            </div>
            ${items.map(item => `
              <div class="item">
                ${item.name}<br/>
                ${item.quantity} x ₦${item.price} = ₦${item.total}
              </div>
            `).join('')}
            <div class="total">
              <p>Total: ₦${items.reduce((sum, item) => sum + item.total, 0)}</p>
            </div>
            <div class="footer">
              <p>Thank you for your purchase!</p>
              <p>Powered By T-Tech Solutions</p>
            </div>
          </body>
        </html>
      `;

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      iframe.contentDocument?.write(printContent);
      iframe.contentDocument?.close();

      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);

      toast({
        title: "Success",
        description: "Receipt sent to printer",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to print receipt",
        variant: "destructive",
      });
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

    try {
      await handlePrint();
      toast({
        title: "Success",
        description: "Sale completed successfully",
      });
      navigate("/sales");
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
        <h1 className="text-2xl font-bold">New Sale</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/sales")}>
            Cancel
          </Button>
          <Button onClick={handleCompleteSale}>
            Complete Sale
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {searchTerm && (
              <div className="mt-2 border rounded-md">
                {searchProducts(searchTerm).map(product => (
                  <div
                    key={product.id}
                    className="p-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                    onClick={() => addItem(product)}
                  >
                    <span>{product.name}</span>
                    <span>₦{product.price}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Sale</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span>{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">₦{item.price}</TableCell>
                    <TableCell className="text-right">₦{item.total}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="h-6 w-6 text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No items added
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {items.length > 0 && (
              <div className="mt-4 flex justify-between items-center">
                <div className="text-lg font-bold">
                  Total: ₦{items.reduce((sum, item) => sum + item.total, 0)}
                </div>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Receipt
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewSale;
