
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/sales";
import { Search, Plus, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProductSearchSectionProps {
  onAddProduct: (product: Product, quantity: number) => void;
  isWholesale?: boolean;
}

const ProductSearchSection = ({ onAddProduct, isWholesale = false }: ProductSearchSectionProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  // Enhanced mock products with wholesale prices
  const mockProducts = [
    { 
      id: "1", 
      name: "Paracetamol", 
      price: 500, 
      wholesalePrice: 400, 
      minWholesaleQuantity: 10,
      stock: 100 
    },
    { 
      id: "2", 
      name: "Amoxicillin", 
      price: 1200, 
      wholesalePrice: 1000, 
      minWholesaleQuantity: 5,
      stock: 50 
    },
    { 
      id: "3", 
      name: "Ibuprofen", 
      price: 600, 
      wholesalePrice: 500, 
      minWholesaleQuantity: 8,
      stock: 75 
    },
    { 
      id: "4", 
      name: "Ciprofloxacin", 
      price: 1500, 
      wholesalePrice: 1250, 
      minWholesaleQuantity: 3,
      stock: 40 
    },
  ];

  const searchProducts = (term: string): Product[] => {
    return mockProducts.filter(p => 
      p.name.toLowerCase().includes(term.toLowerCase())
    );
  };

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

    // If wholesale and quantity meets minimum threshold, suggest wholesale price
    if (isWholesale && 
        selectedProduct.minWholesaleQuantity && 
        quantity < selectedProduct.minWholesaleQuantity) {
      toast({
        title: "Wholesale Information",
        description: `Minimum quantity for wholesale pricing is ${selectedProduct.minWholesaleQuantity}`,
      });
    }

    onAddProduct(selectedProduct, quantity);
    setSelectedProduct(null);
    setQuantity(1);
    setSearchTerm("");
  };

  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search products..."
        className="pl-8"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {searchTerm && (
        <div className="mt-2 border rounded-md max-h-60 overflow-y-auto">
          {searchProducts(searchTerm).map(product => (
            <div
              key={product.id}
              className="p-2 hover:bg-accent cursor-pointer flex justify-between items-center"
              onClick={() => {
                setSelectedProduct(product);
                setSearchTerm(product.name);
              }}
            >
              <span>{product.name}</span>
              <div className="flex flex-col items-end">
                <span>₦{isWholesale && product.wholesalePrice ? product.wholesalePrice : product.price}</span>
                {isWholesale && product.wholesalePrice && (
                  <span className="text-xs text-muted-foreground">
                    Min qty: {product.minWholesaleQuantity || 1}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedProduct && (
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label>Quantity:</label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-20"
            />
          </div>
          <Button onClick={handleAddItem}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
          
          {isWholesale && selectedProduct.wholesalePrice && selectedProduct.minWholesaleQuantity && (
            <Badge variant="outline" className="ml-auto">
              <Package className="h-3 w-3 mr-1" />
              Min {selectedProduct.minWholesaleQuantity} for wholesale price
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearchSection;
