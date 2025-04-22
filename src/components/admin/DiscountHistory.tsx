
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, Calendar } from "lucide-react";

// Mock data - In a real app, this would come from your backend
const discountHistoryData = [
  {
    id: "1",
    date: "2025-04-22",
    time: "14:30",
    itemName: "Paracetamol",
    originalPrice: 500,
    discountPercentage: 10,
    finalPrice: 450,
    appliedBy: "John Doe"
  },
  {
    id: "2",
    date: "2025-04-22",
    time: "15:45",
    itemName: "Amoxicillin",
    originalPrice: 1200,
    discountPercentage: 15,
    finalPrice: 1020,
    appliedBy: "Jane Smith"
  }
];

export const DiscountHistory = () => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Recent Discount Applications</h3>
              <p className="text-sm text-muted-foreground">
                Track all discounts applied to sales
              </p>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Date & Time</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Original Price</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Final Price</TableHead>
                  <TableHead className="text-right">Applied By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discountHistoryData.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-sm">
                          <Calendar className="mr-2 h-4 w-4" />
                          {record.date}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="mr-2 h-4 w-4" />
                          {record.time}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{record.itemName}</TableCell>
                    <TableCell className="text-right">₦{record.originalPrice}</TableCell>
                    <TableCell className="text-right">{record.discountPercentage}%</TableCell>
                    <TableCell className="text-right">₦{record.finalPrice}</TableCell>
                    <TableCell className="text-right">{record.appliedBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
