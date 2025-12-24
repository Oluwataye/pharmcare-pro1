
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
import { EnhancedTransactionsCard } from "@/components/admin/EnhancedTransactionsCard";
import { EnhancedLowStockCard } from "@/components/admin/EnhancedLowStockCard";

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
            <EnhancedTransactionsCard
              transactions={recentTransactions}
              onItemClick={handleItemClick}
              onViewAllClick={handleCardClick}
            />

            <EnhancedLowStockCard
              items={lowStockItems}
              onItemClick={handleItemClick}
              onViewAllClick={handleCardClick}
            />
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
