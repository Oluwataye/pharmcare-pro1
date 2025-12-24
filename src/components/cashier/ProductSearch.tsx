
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Product {
  id: string;
  name: string;
  price: number;
  wholesalePrice: number;
  stock: number;
}

interface ProductSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filteredProducts: Product[];
  onProductSelect: (product: Product) => void;
}

export function ProductSearch({
  searchQuery,
  onSearchChange,
  filteredProducts,
  onProductSelect,
}: ProductSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input 
        placeholder="Search products..." 
        className="pl-8 w-full md:w-[250px]" 
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
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
                onClick={() => onProductSelect(product)}
              >
                {product.name} - ₦{product.price}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
