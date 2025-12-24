
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Tag, Package } from "lucide-react";
import { SaleItem } from "@/types/sales";

interface CurrentSaleTableProps {
  items: SaleItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onTogglePriceType?: (id: string) => void;
  isWholesale?: boolean;
}

const CurrentSaleTable = ({ 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  onTogglePriceType,
  isWholesale = false
}: CurrentSaleTableProps) => {
  return (
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
            <TableCell>
              <div>
                {item.name}
                {item.isWholesale && (
                  <Badge variant="outline" className="ml-2 bg-blue-50">
                    <Package className="h-3 w-3 mr-1" /> 
                    Wholesale
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                >
                  -
                </Button>
                <span>{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                >
                  +
                </Button>
              </div>
            </TableCell>
            <TableCell className="text-right">₦{item.price}</TableCell>
            <TableCell className="text-right">₦{item.total}</TableCell>
            <TableCell>
              <div className="flex items-center space-x-1">
                {onTogglePriceType && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onTogglePriceType(item.id)}
                    className="h-6 w-6 text-blue-500"
                    title={item.isWholesale ? "Switch to retail price" : "Switch to wholesale price"}
                  >
                    <Tag className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveItem(item.id)}
                  className="h-6 w-6 text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
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
  );
};

export default CurrentSaleTable;
