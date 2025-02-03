import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Printer } from "lucide-react";

const recentSales = [
  {
    id: 1,
    product: "Paracetamol",
    quantity: 2,
    price: 500,
    total: 1000,
    date: "2024-02-20",
  },
  {
    id: 2,
    product: "Amoxicillin",
    quantity: 1,
    price: 1500,
    total: 1500,
    date: "2024-02-20",
  },
];

const RecentSales = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Sales</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Price (₦)</TableHead>
              <TableHead>Total (₦)</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentSales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>{sale.product}</TableCell>
                <TableCell>{sale.quantity}</TableCell>
                <TableCell>{sale.price}</TableCell>
                <TableCell>{sale.total}</TableCell>
                <TableCell>{sale.date}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <Printer className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RecentSales;