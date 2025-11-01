import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, ChevronRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: number;
  product: string;
  customer: string;
  amount: number;
  date: string;
}

interface EnhancedTransactionsCardProps {
  transactions: Transaction[];
  onItemClick: (route: string, id: number) => void;
  onViewAllClick: (route: string) => void;
}

export const EnhancedTransactionsCard = ({
  transactions,
  onItemClick,
  onViewAllClick,
}: EnhancedTransactionsCardProps) => {
  const formatRelativeTime = (dateStr: string) => {
    // Simple implementation - can be enhanced
    if (dateStr.includes('Today')) return dateStr.replace('Today, ', '');
    if (dateStr.includes('Yesterday')) return 'Yesterday';
    return dateStr;
  };

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-lg border-l-4 border-l-green-500">
      <CardHeader className="p-4 md:p-6 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-green-600" />
            Recent Transactions
          </CardTitle>
          <Badge className="bg-green-100 text-green-700 border-green-200">
            {transactions.length} today
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        <div className="space-y-2">
          {transactions.length > 0 ? (
            <>
              {transactions.map((transaction, index) => (
                <div
                  key={transaction.id}
                  className={cn(
                    "group p-3 hover:bg-accent rounded-lg cursor-pointer transition-all border",
                    index % 2 === 0 && "bg-muted/30"
                  )}
                  onClick={() => onItemClick('/sales', transaction.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                          {transaction.product}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Sale
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {transaction.customer}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-green-600">
                        ₦{transaction.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(transaction.date)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                variant="ghost"
                className="w-full justify-between hover:bg-primary/5 text-primary font-medium mt-2"
                onClick={() => onViewAllClick('/sales')}
              >
                View all transactions
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No recent transactions
            </p>
          )}
        </div>
      </CardContent>
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
    </Card>
  );
};