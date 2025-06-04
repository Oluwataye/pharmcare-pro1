
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Tag } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SaleItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  isWholesale?: boolean;
}

interface SaleItemsTableProps {
  items: SaleItem[];
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, newQuantity: number) => void;
  onTogglePriceType: (id: string) => void;
  isWholesale: boolean;
}

export function SaleItemsTable({ 
  items, 
  onRemoveItem, 
  onUpdateQuantity, 
  onTogglePriceType, 
  isWholesale 
}: SaleItemsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead className="text-right">Price (₦)</TableHead>
          <TableHead className="text-right">Total (₦)</TableHead>
          <TableHead className="text-center">Actions</TableHead>
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
              <TableCell>
                <div className="flex items-center gap-2">
                  {item.name}
                  {item.isWholesale && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Wholesale
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                  className="w-20 text-right"
                />
              </TableCell>
              <TableCell className="text-right">₦{item.price}</TableCell>
              <TableCell className="text-right">₦{item.total}</TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onTogglePriceType(item.id)}
                    title={item.isWholesale ? "Switch to Retail" : "Switch to Wholesale"}
                  >
                    <Tag className="h-4 w-4 text-blue-500" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
        {items.length > 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-right font-bold">Total:</TableCell>
            <TableCell className="text-right font-bold">₦{items.reduce((sum, item) => sum + item.total, 0)}</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
