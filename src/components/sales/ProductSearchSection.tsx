import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/sales";
import { Search, Plus, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SelectField } from "@/components/inventory/form/FormField";
import { SelectItem } from "@/components/ui/select";
import { useInventory } from "@/hooks/useInventory";

interface ProductSearchSectionProps {
  onAddProduct: (product: Product, quantity: number, selectedUnit?: string) => void;
  isWholesale?: boolean;
}

const ProductSearchSection = ({ onAddProduct, isWholesale = false }: ProductSearchSectionProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  // Use inventory from context (already loaded)
  const { inventory, isLoading: isInventoryLoading } = useInventory();
  const isLoading = isInventoryLoading; // Alias for component usage
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch products from global inventory context
  useEffect(() => {
    if (inventory) {
      // Products are already loaded in context, just map them if needed or use directly
      // efficient mapping
      const mappedProducts: Product[] = inventory
        // Fix: Use camelCase 'expiryDate' as defined in InventoryItem (Context), not snake_case 'expiry_date' (DB)
        .filter((item: any) => item.quantity > 0 && (item.expiryDate ? new Date(item.expiryDate) > new Date() : true))
        .map((item: any) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          wholesalePrice: Number(item.price) * 0.85,
          minWholesaleQuantity: 5,
          stock: item.quantity,
          unit: item.unit,
          multi_unit_config: (item.multi_unit_config as any[]) || [],
          costPrice: Number(item.costPrice) || 0 // Fix: Access costPrice from context item
        }));
      setProducts(mappedProducts);
    }
  }, [inventory]);

  // Handle F2 shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
    let baseQtyRequired = quantity;
    if (selectedUnit && selectedUnit !== selectedProduct.unit) {
      const unitCfg = selectedProduct.multi_unit_config?.find(u => u.unit === selectedUnit);
      if (unitCfg) {
        baseQtyRequired = quantity * unitCfg.conversion;
      }
    }

    if (baseQtyRequired > selectedProduct.stock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${selectedProduct.stock} ${selectedProduct.unit} available in stock`,
        variant: "destructive",
      });
      return;
    }

    onAddProduct(selectedProduct, quantity, selectedUnit);
    setSelectedProduct(null);
    setSelectedUnit("");
    setQuantity(1);
    setSearchTerm("");
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          placeholder="Search products (F2)..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {searchTerm && !selectedProduct && (
        <div className="mt-2 border rounded-md max-h-60 overflow-y-auto bg-background z-50 relative">
          {searchProducts(searchTerm).map(product => (
            <div
              key={product.id}
              className="p-2 hover:bg-accent cursor-pointer flex justify-between items-center"
              onClick={() => {
                setSelectedProduct(product);
                setSearchTerm(product.name);
                setSelectedUnit(product.unit || "");
              }}
            >
              <span>{product.name}</span>
              <div className="flex flex-col items-end">
                <span>₦{isWholesale && product.wholesalePrice ? product.wholesalePrice : product.price}</span>
                <span className="text-[10px] text-muted-foreground">Stock: {product.stock} {product.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProduct && (
        <div className="mt-4 flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-md border">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Unit:</label>
            <div className="w-[140px]">
              <SelectField
                id="selected-unit"
                label=""
                value={selectedUnit}
                onValueChange={setSelectedUnit}
              >
                <SelectItem value={selectedProduct.unit || "unit"}>{selectedProduct.unit || "Unit"}</SelectItem>
                {selectedProduct.multi_unit_config?.map((unit: any) => (
                  <SelectItem key={unit.unit} value={unit.unit}>
                    {unit.unit} (x{unit.conversion})
                  </SelectItem>
                ))}
              </SelectField>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Qty:</label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-20"
            />
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-bold">
              Price: ₦{(() => {
                if (selectedUnit === selectedProduct.unit || !selectedUnit) {
                  return isWholesale && selectedProduct.wholesalePrice ? selectedProduct.wholesalePrice : selectedProduct.price;
                }
                const unitCfg = selectedProduct.multi_unit_config?.find((u: any) => u.unit === selectedUnit);
                return unitCfg ? unitCfg.price : selectedProduct.price;
              })()}
            </span>
            <span className="text-xs text-muted-foreground line-clamp-1">
              {selectedProduct.stock} {selectedProduct.unit} available
            </span>
          </div>

          <Button onClick={handleAddItem} className="ml-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add to Sale
          </Button>

          {isWholesale && selectedProduct.wholesalePrice && selectedProduct.minWholesaleQuantity && (
            <div className="w-full mt-2">
              <Badge variant="outline" className="text-[10px]">
                <Package className="h-3 w-3 mr-1" />
                Min {selectedProduct.minWholesaleQuantity} {selectedProduct.unit} for wholesale price
              </Badge>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearchSection;
