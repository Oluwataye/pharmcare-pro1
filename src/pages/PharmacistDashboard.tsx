
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MedicationForm } from "@/components/pharmacist/MedicationForm";
import { PharmacistHeader } from "@/components/pharmacist/PharmacistHeader";
import { MedicationStats } from "@/components/pharmacist/MedicationStats";
import { MedicationTable } from "@/components/pharmacist/MedicationTable";
import { medications } from "@/data/mockMedications";
import { useIsMobile } from "@/hooks/use-mobile";

const PharmacistDashboard = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showMedicationForm, setShowMedicationForm] = useState(false);
  const isMobile = useIsMobile();

  const filteredMedications = medications.filter(
    med => 
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = medications.filter(med => med.status === "Low Stock").length;
  const criticalStockCount = medications.filter(med => med.status === "Critical").length;
  const expiringSoonCount = 3; // Mock data for medications expiring within 30 days

  const handleMedicationComplete = (isNew: boolean) => {
    toast({
      title: isNew ? "Medication Added" : "Medication Updated",
      description: isNew ? "The medication was added successfully" : "The medication was updated successfully",
    });
    setShowMedicationForm(false);
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
          />

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
