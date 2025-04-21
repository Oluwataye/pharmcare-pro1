
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useSales } from "@/hooks/useSales";
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
import { Search, Printer, X, Plus, Percent } from "lucide-react";
import { Product } from "@/types/sales";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

const NewSale = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
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
  } = useSales({ cashierName: user ? user.username || user.name : undefined });

  const searchProducts = (term: string): Product[] => {
    const mockProducts = [
      { id: "1", name: "Paracetamol", price: 500, stock: 100 },
      { id: "2", name: "Amoxicillin", price: 1200, stock: 50 },
    ];
    return mockProducts.filter(p => 
      p.name.toLowerCase().includes(term.toLowerCase())
    );
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
      await handlePrint({
        cashierName: user ? user.username || user.name : undefined
      });
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
              <>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="discount">Overall Discount (%):</Label>
                    <div className="flex items-center relative">
                      <Percent className="absolute left-2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        max="100"
                        className="pl-8 w-24"
                        value={discount}
                        onChange={(e) => setOverallDiscount(parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₦{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    {calculateDiscountAmount() > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Discount:</span>
                        <span>-₦{calculateDiscountAmount().toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>₦{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-between items-center">
                  <Button variant="outline" onClick={() => handlePrint()}>
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
