
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

import { InventoryItem } from "@/types/inventory";

interface ProductSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filteredProducts: InventoryItem[];
  onProductSelect: (product: InventoryItem) => void;
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
                className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                onClick={() => onProductSelect(product)}
              >
                <span>{product.name} - ₦{product.price}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${product.quantity <= (product.reorderLevel || 10) ? 'bg-red-100 text-red-600 font-bold' : 'bg-green-100 text-green-600'}`}>
                  Stock: {product.quantity}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
