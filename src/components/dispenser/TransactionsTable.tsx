
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Transaction {
  id: number;
  customer: string;
  items: number;
  amount: number;
  time: string;
  date: string;
  status: string;
}

interface TransactionsTableProps {
  filteredTransactions: Transaction[];
  handleItemClick: (route: string, id: number) => void;
}

export const TransactionsTable = ({ 
  filteredTransactions, 
  handleItemClick 
}: TransactionsTableProps) => {
  return (
    <div className="overflow-x-auto">
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="responsive-table">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-muted/50">
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount (₦)</TableHead>
                  <TableHead className="hidden sm:table-cell">Time</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow 
                      key={transaction.id} 
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleItemClick('/sales', transaction.id)}
                    >
                      <TableCell className="font-medium">{transaction.customer}</TableCell>
                      <TableCell>{transaction.items}</TableCell>
                      <TableCell>₦{transaction.amount.toLocaleString()}</TableCell>
                      <TableCell className="hidden sm:table-cell">{transaction.time}</TableCell>
                      <TableCell className="hidden md:table-cell">{transaction.date}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {transaction.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Import missing imports at the top of the file
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";
