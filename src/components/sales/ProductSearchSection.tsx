
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/sales";
import { Search, Plus } from "lucide-react";

interface ProductSearchSectionProps {
  onAddProduct: (product: Product, quantity: number) => void;
}

const ProductSearchSection = ({ onAddProduct }: ProductSearchSectionProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  const mockProducts = [
    { id: "1", name: "Paracetamol", price: 500, stock: 100 },
    { id: "2", name: "Amoxicillin", price: 1200, stock: 50 },
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
        <div className="mt-2 border rounded-md">
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
              <span>₦{product.price}</span>
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
        </div>
      )}
    </div>
  );
};

export default ProductSearchSection;
