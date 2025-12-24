
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MedicationForm } from "@/components/pharmacist/MedicationForm";
import { PharmacistHeader } from "@/components/pharmacist/PharmacistHeader";
import { MedicationStats } from "@/components/pharmacist/MedicationStats";
import { MedicationTable } from "@/components/pharmacist/MedicationTable";
import { medications } from "@/data/mockMedications";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";

const PharmacistDashboard = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showMedicationForm, setShowMedicationForm] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const filteredMedications = medications.filter(
    med => 
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = medications.filter(med => med.status === "Low Stock").length;
  const criticalStockCount = medications.filter(med => med.status === "Critical").length;
  const expiringSoonCount = 3; // Mock data for medications expiring within 30 days

  // Mock data for recent transactions and low stock alerts for pharmacist
  const recentTransactions = [
    { id: 1, product: "Paracetamol", customer: "John Doe", amount: 1200, date: "Today, 10:30 AM" },
    { id: 2, product: "Amoxicillin", customer: "Jane Smith", amount: 2500, date: "Today, 09:45 AM" },
  ];

  const lowStockItems = medications
    .filter(med => med.status === "Low Stock" || med.status === "Critical")
    .slice(0, 3)
    .map((med, index) => ({
      id: index + 1,
      product: med.name,
      category: med.category,
      quantity: med.stock, // Updated from 'quantity' to 'stock' to match the Medication interface
      reorderLevel: 20, // Mock reorder level
    }));

  const handleMedicationComplete = (isNew: boolean) => {
    toast({
      title: isNew ? "Medication Added" : "Medication Updated",
      description: isNew ? "The medication was added successfully" : "The medication was updated successfully",
    });
    setShowMedicationForm(false);
  };

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  const handleItemClick = (route: string, id: number) => {
    // For future implementation: navigate to specific item detail
    navigate(route);
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in px-2 md:px-0">
      <PharmacistHeader 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onAddMedication={() => setShowMedicationForm(true)}
      />

      {showMedicationForm ? (
        <Card className="border-2 border-primary/10">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-xl md:text-2xl">Add New Medication</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <MedicationForm 
              onComplete={(isNew) => handleMedicationComplete(isNew)} 
              onCancel={() => setShowMedicationForm(false)} 
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <MedicationStats 
            totalMedications={medications.length}
            lowStockCount={lowStockCount}
            criticalStockCount={criticalStockCount}
            expiringSoonCount={expiringSoonCount}
            onCardClick={handleCardClick}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="relative overflow-hidden transition-all hover:shadow-lg">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-4">
                  {recentTransactions.length > 0 ? (
                    <div className="space-y-3">
                      {recentTransactions.map(transaction => (
                        <div 
                          key={transaction.id}
                          className="flex items-center justify-between p-3 hover:bg-muted rounded-md cursor-pointer transition-colors"
                          onClick={() => handleItemClick('/sales', transaction.id)}
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
                    onClick={() => handleCardClick('/sales')}
                  >
                    View all transactions
                  </div>
                </div>
              </CardContent>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            </Card>

            <Card className="relative overflow-hidden transition-all hover:shadow-lg">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg font-semibold">Low Stock Alerts</CardTitle>
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
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            </Card>
          </div>

          <div className="overflow-x-auto">
            <MedicationTable 
              medications={medications}
              filteredMedications={filteredMedications}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default PharmacistDashboard;
