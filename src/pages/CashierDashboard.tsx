
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, DollarSign, Receipt, Users, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { NewSaleForm } from "@/components/cashier/NewSaleForm";

const CashierDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showNewSaleForm, setShowNewSaleForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const recentTransactions = [
    {
      id: 1,
      customer: "John Smith",
      items: 3,
      amount: 2500,
      time: "10:30 AM",
      date: "2023-04-15",
      status: "Completed"
    },
    {
      id: 2,
      customer: "Sarah Wilson",
      items: 5,
      amount: 4750,
      time: "11:45 AM",
      date: "2023-04-15",
      status: "Completed"
    },
    {
      id: 3,
      customer: "Michael Brown",
      items: 2,
      amount: 1800,
      time: "01:15 PM",
      date: "2023-04-15",
      status: "Completed"
    },
  ];

  const filteredTransactions = recentTransactions.filter(
    transaction => 
      transaction.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewSale = () => {
    setShowNewSaleForm(true);
  };

  const handleSaleComplete = () => {
    toast({
      title: "Sale Completed",
      description: "The transaction was processed successfully",
    });
    setShowNewSaleForm(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Cashier Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage sales and transactions</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search transactions..." 
              className="pl-8 w-[200px] md:w-[300px] transition-all" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={handleNewSale} className="bg-primary hover:bg-primary/90 transition-colors">
            <ShoppingCart className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        </div>
      </div>

      {showNewSaleForm ? (
        <Card className="border-2 border-primary/10">
          <CardHeader>
            <CardTitle>New Sale</CardTitle>
          </CardHeader>
          <CardContent>
            <NewSaleForm onComplete={handleSaleComplete} onCancel={() => setShowNewSaleForm(false)} />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="hover:shadow-lg transition-all duration-200 hover:border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦9,050</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  +8% from yesterday
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-200 hover:border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                <Receipt className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">+2 since last shift</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-200 hover:border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customers</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">Unique customers today</p>
              </CardContent>
            </Card>
          </div>

          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-muted/50">
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount (₦)</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Date</TableHead>
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
                      <TableRow key={transaction.id} className="hover:bg-muted/50 cursor-pointer">
                        <TableCell className="font-medium">{transaction.customer}</TableCell>
                        <TableCell>{transaction.items}</TableCell>
                        <TableCell>₦{transaction.amount.toLocaleString()}</TableCell>
                        <TableCell>{transaction.time}</TableCell>
                        <TableCell>{transaction.date}</TableCell>
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
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default CashierDashboard;
