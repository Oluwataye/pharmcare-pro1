
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";

interface Transaction {
  id: number;
  customer: string;
  items: number;
  amount: number;
  time: string;
  date: string;
  status: string;
}

interface RecentTransactionsCardProps {
  filteredTransactions: Transaction[];
  handleItemClick: (route: string, id: number) => void;
  handleCardClick: (route: string) => void;
}

export const RecentTransactionsCard = ({ 
  filteredTransactions, 
  handleItemClick, 
  handleCardClick 
}: RecentTransactionsCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="space-y-4">
          {filteredTransactions.length > 0 ? (
            <div className="space-y-3">
              {filteredTransactions.slice(0, 3).map(transaction => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-3 hover:bg-muted rounded-md cursor-pointer transition-colors"
                  onClick={() => handleItemClick('/sales', transaction.id)}
                >
                  <div>
                    <p className="font-medium text-sm">{transaction.customer}</p>
                    <p className="text-xs text-muted-foreground">{transaction.items} items</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₦{transaction.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{transaction.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No transactions found
            </p>
          )}
          <div 
            className="text-sm text-primary font-medium cursor-pointer hover:underline"
            onClick={() => handleCardClick('/sales')}
          >
            View all transactions
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
