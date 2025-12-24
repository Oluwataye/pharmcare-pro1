
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, History } from "lucide-react";
import { format, subDays, subMonths, subYears, isWithinInterval } from "date-fns";

// Enhanced mock data with more entries and actual dates
const discountHistoryData = [
  {
    id: "1",
    date: new Date("2025-04-22").toISOString(),
    time: "14:30",
    itemName: "Paracetamol",
    originalPrice: 500,
    discountPercentage: 10,
    finalPrice: 450,
    appliedBy: "John Doe"
  },
  {
    id: "2",
    date: new Date("2025-04-21").toISOString(),
    time: "15:45",
    itemName: "Amoxicillin",
    originalPrice: 1200,
    discountPercentage: 15,
    finalPrice: 1020,
    appliedBy: "Jane Smith"
  },
  {
    id: "3",
    date: new Date("2025-03-15").toISOString(),
    time: "09:30",
    itemName: "Vitamin C",
    originalPrice: 800,
    discountPercentage: 20,
    finalPrice: 640,
    appliedBy: "Mike Johnson"
  },
  {
    id: "4",
    date: new Date("2025-01-10").toISOString(),
    time: "11:20",
    itemName: "Ibuprofen",
    originalPrice: 600,
    discountPercentage: 5,
    finalPrice: 570,
    appliedBy: "Sarah Wilson"
  }
];

type TimePeriod = "daily" | "weekly" | "monthly" | "yearly" | "all";

export const DiscountHistory = () => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("daily");
  
  const filterDiscountsByPeriod = (period: TimePeriod) => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "daily":
        startDate = subDays(now, 1);
        break;
      case "weekly":
        startDate = subDays(now, 7);
        break;
      case "monthly":
        startDate = subMonths(now, 1);
        break;
      case "yearly":
        startDate = subYears(now, 1);
        break;
      default:
        return discountHistoryData;
    }

    return discountHistoryData.filter((record) =>
      isWithinInterval(new Date(record.date), {
        start: startDate,
        end: now,
      })
    );
  };

  const filteredDiscounts = filterDiscountsByPeriod(timePeriod);

  const totalDiscount = filteredDiscounts.reduce(
    (sum, record) => sum + (record.originalPrice - record.finalPrice),
    0
  );

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Recent Discount Applications</h3>
              <p className="text-sm text-muted-foreground">
                Track all discounts applied to sales
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={timePeriod} onValueChange={(value: TimePeriod) => setTimePeriod(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Last 24 Hours</SelectItem>
                  <SelectItem value="weekly">Last 7 Days</SelectItem>
                  <SelectItem value="monthly">Last 30 Days</SelectItem>
                  <SelectItem value="yearly">Last Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-muted/10 p-4 rounded-md mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <span className="font-medium">Total Discounts ({timePeriod})</span>
              </div>
              <span className="text-lg font-bold">₦{totalDiscount.toFixed(2)}</span>
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
                {filteredDiscounts.map((record) => (
                  <TableRow key={record.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-sm">
                          <Calendar className="mr-2 h-4 w-4" />
                          {format(new Date(record.date), "MMM dd, yyyy")}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <History className="mr-2 h-4 w-4" />
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
                {filteredDiscounts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                      No discount records found for this time period
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
