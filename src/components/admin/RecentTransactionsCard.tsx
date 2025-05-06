
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Transaction {
  id: number;
  product: string;
  customer: string;
  amount: number;
  date: string;
}

interface RecentTransactionsCardProps {
  transactions: Transaction[];
  onItemClick: (route: string, id: number) => void;
  onViewAllClick: (route: string) => void;
}

export const RecentTransactionsCard = ({
  transactions,
  onItemClick,
  onViewAllClick,
}: RecentTransactionsCardProps) => {
  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="space-y-4">
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map(transaction => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-3 hover:bg-muted rounded-md cursor-pointer transition-colors"
                  onClick={() => onItemClick('/sales', transaction.id)}
                >
                  <div>
                    <p className="font-medium text-sm">{transaction.product}</p>
                    <p className="text-xs text-muted-foreground">{transaction.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₦{transaction.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{transaction.date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No recent transactions
            </p>
          )}
          <div 
            className="text-sm text-primary font-medium cursor-pointer hover:underline"
            onClick={() => onViewAllClick('/sales')}
          >
            View all transactions
          </div>
        </div>
      </CardContent>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
    </Card>
  );
};

