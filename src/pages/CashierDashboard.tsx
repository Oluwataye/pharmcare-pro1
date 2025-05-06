
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
import { Search, ShoppingCart, DollarSign, Receipt, Users, TrendingUp, AlertTriangle } from "lucide-react";
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

  // Mock low stock items for cashier view
  const lowStockItems = [
    { id: 1, product: "Paracetamol", category: "Pain Relief", quantity: 10, reorderLevel: 15 },
    { id: 2, product: "Amoxicillin", category: "Antibiotics", quantity: 5, reorderLevel: 20 },
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

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  const handleItemClick = (route: string, id: number) => {
    // For future implementation: navigate to specific item detail
    navigate(route);
  };

  const statsCards = [
    {
      title: "Today's Sales",
      value: "₦9,050",
      icon: DollarSign,
      description: "+8% from yesterday",
      iconColor: "text-primary",
      route: "/sales"
    },
    {
      title: "Transactions",
      value: "12",
      icon: Receipt,
      description: "+2 since last shift",
      iconColor: "text-primary",
      route: "/sales"
    },
    {
      title: "Customers",
      value: "8",
      icon: Users,
      description: "Unique customers today",
      iconColor: "text-primary",
      route: "/sales"
    },
    {
      title: "Low Stock Items",
      value: lowStockItems.length.toString(),
      icon: AlertTriangle,
      description: "Needs attention",
      iconColor: "text-amber-500",
      route: "/inventory"
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in px-2 md:px-0">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Cashier Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Manage sales and transactions</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search transactions..." 
              className="pl-8 w-full transition-all" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={handleNewSale} className="bg-primary hover:bg-primary/90 transition-colors w-full sm:w-auto">
            <ShoppingCart className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        </div>
      </div>

      {showNewSaleForm ? (
        <Card className="border-2 border-primary/10">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-xl md:text-2xl">New Sale</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <NewSaleForm onComplete={handleSaleComplete} onCancel={() => setShowNewSaleForm(false)} />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
            {statsCards.map((card, index) => (
              <Card 
                key={index} 
                className="hover:shadow-lg transition-all duration-200 hover:border-primary/20 cursor-pointer"
                onClick={() => handleCardClick(card.route)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {card.title === "Today's Sales" && <TrendingUp className="h-3 w-3 text-green-500" />}
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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

            <Card className="hover:shadow-lg transition-all duration-200">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Low Stock Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-4">
                  {lowStockItems.length > 0 ? (
                    <div className="space-y-3">
                      {lowStockItems.map(item => (
                        <div 
                          key={item.id}
                          className="flex items-center justify-between p-3 hover:bg-muted rounded-md cursor-pointer transition-colors"
                          onClick={() => handleItemClick('/inventory', item.id)}
                        >
                          <div>
                            <p className="font-medium text-sm">{item.product}</p>
                            <p className="text-xs text-muted-foreground">{item.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-red-500">{item.quantity} left</p>
                            <p className="text-xs text-muted-foreground">Reorder: {item.reorderLevel}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No low stock alerts
                    </p>
                  )}
                  <div 
                    className="text-sm text-primary font-medium cursor-pointer hover:underline"
                    onClick={() => handleCardClick('/inventory')}
                  >
                    View all low stock items
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
        </>
      )}
    </div>
  );
};

export default CashierDashboard;
