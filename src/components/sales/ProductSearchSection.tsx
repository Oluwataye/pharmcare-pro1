
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/sales";
import { Search, Plus, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface ProductSearchSectionProps {
  onAddProduct: (product: Product, quantity: number) => void;
  isWholesale?: boolean;
}

const ProductSearchSection = ({ onAddProduct, isWholesale = false }: ProductSearchSectionProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch products from Supabase inventory
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .gt('quantity', 0); // Only show items in stock

        if (error) throw error;

        // Map inventory to Product format
        const mappedProducts: Product[] = data.map(item => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          wholesalePrice: Number(item.price) * 0.85, // 15% discount for wholesale
          minWholesaleQuantity: 5, // Default minimum
          stock: item.quantity
        }));

        setProducts(mappedProducts);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();

    // Set up realtime subscription for inventory updates
    const channel = supabase
      .channel('inventory-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'inventory' },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const searchProducts = (term: string): Product[] => {
    if (!term.trim()) return [];
    return products.filter(p => 
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

    // Validate stock availability
    if (quantity > selectedProduct.stock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${selectedProduct.stock} units available in stock`,
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
