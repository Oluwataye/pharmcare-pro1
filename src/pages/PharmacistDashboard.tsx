
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MedicationForm } from "@/components/pharmacist/MedicationForm";
import { PharmacistHeader } from "@/components/pharmacist/PharmacistHeader";
import { MedicationStats } from "@/components/pharmacist/MedicationStats";
import { MedicationTable } from "@/components/pharmacist/MedicationTable";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { EnhancedTransactionsCard } from "@/components/admin/EnhancedTransactionsCard";
import { EnhancedLowStockCard } from "@/components/admin/EnhancedLowStockCard";
import { useInventory } from "@/hooks/useInventory";
import { supabase } from "@/integrations/supabase/client";
import { useOffline } from "@/contexts/OfflineContext";
import { useCallback } from "react";

interface Medication {
  id: string | number;
  name: string;
  category: string;
  stock: number;
  expiry: string;
  status: "In Stock" | "Low Stock" | "Critical";
}

const PharmacistDashboard = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showMedicationForm, setShowMedicationForm] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { inventory, isLoading } = useInventory();
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  // Map inventory to medications format
  const medications: Medication[] = (inventory || []).map(item => {
    let status: "In Stock" | "Low Stock" | "Critical" = "In Stock";
    if (item.quantity <= 0) status = "Critical";
    else if (item.quantity <= (item.reorderLevel || 0)) status = "Low Stock";

    return {
      id: item.id,
      name: item.name || 'Unknown',
      category: item.category || 'Uncategorized',
      stock: item.quantity || 0,
      expiry: item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A',
      status: status
    };
  });

  const filteredMedications = medications.filter(
    med =>
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = medications.filter(med => med.status === "Low Stock").length;
  const criticalStockCount = medications.filter(med => med.status === "Critical").length;

  // Calculate expiring soon (within 30 days)
  const expiringSoonCount = (inventory || []).filter(item => {
    if (!item.expiryDate) return false;
    const expiry = new Date(item.expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  }).length;

  const { pendingOperations } = useOffline();

  const fetchTransactions = useCallback(async () => {
    const { data: transactions, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    const pendingSales = (pendingOperations || [])
      .filter(op => op.resource === 'sales')
      .map(op => {
        const sale = op.data || {};
        return {
          id: sale.transactionId || `PENDING-${op.id}`,
          product: sale.customerName || 'Walk-in Customer (Offline)',
          customer: `Items: ${Array.isArray(sale.items) ? sale.items.length : 1}`,
          amount: Number(sale.total || 0),
          date: `Pending Sync`
        };
      });

    if (transactions) {
      const formattedTx = transactions.map(tx => ({
        id: tx.transaction_id || tx.id,
        product: tx.customer_name || 'Walk-in Customer',
        customer: `Items: ${(tx.items && Array.isArray(tx.items)) ? tx.items.length : 'N/A'}`,
        amount: Number(tx.total || tx.total_amount || 0),
        date: new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      setRecentTransactions([...pendingSales, ...formattedTx].slice(0, 10));
    }
  }, [pendingOperations]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Low stock items for card
  const lowStockItems = (inventory || [])
    .filter(item => item.quantity <= (item.reorderLevel || 0))
    .slice(0, 3)
    .map((item, index) => ({
      id: item.id,
      product: item.name,
      category: item.category || 'Uncategorized',
      quantity: item.quantity,
      reorderLevel: item.reorderLevel || 0,
    }));

  const handleMedicationComplete = (isNew: boolean) => {
    toast({
      title: isNew ? "Medication Added" : "Medication Updated",
      description: isNew ? "The medication was added successfully" : "The medication was updated successfully",
    });
    setShowMedicationForm(false);
    fetchTransactions(); // Refresh transactions in case stock logic changed
  };

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  const handleItemClick = (route: string, id: number | string) => {
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
